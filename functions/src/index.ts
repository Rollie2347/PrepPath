import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, type DocumentReference } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { englishDataset, englishRecommendedTransformers, RegExpMatcher } from 'obscenity';

import { scoreDiagnostic, seedMastery } from './shared/adaptive/diagnostic';
import { newMastery, updateMastery } from './shared/adaptive/elo';
import { predictScore } from './shared/adaptive/score';
import {
  MAX_ANSWERS_PER_LESSON,
  MIN_MS_PER_ANSWER,
  SHOP_PRICES,
  type CompleteDiagnosticRequest,
  type CompleteDiagnosticResponse,
  type CompleteLessonRequest,
  type CompleteLessonResponse,
  type InitUserRequest,
  type OpenChestResponse,
  type ShopItem,
} from './shared/api';
import { isCorrect } from './shared/grading';
import { COHORT_SIZE, nextTier, settleCohort, weekId } from './shared/progression/league';
import {
  applyCheckpoint,
  buildPath,
  CHECKPOINT_QUESTIONS,
  findNode,
  isUnlocked,
  LEGENDARY_QUESTIONS,
  legendarySeconds,
  LEVELS_PER_NODE,
  type NodeProgress,
} from './shared/progression/path';
import { advanceQuests, questsFor, type QuestState } from './shared/progression/quests';
import { addFreeze, creditGoal, daysBetween, MAX_FREEZES, newStreak, settle } from './shared/progression/streak';
import { lessonXp } from './shared/progression/xp';
import { getTest } from './shared/taxonomy';
import type { Difficulty, Question, TestId } from './shared/types';
import { AVATARS, DAILY_GOALS, type ProgressDoc, type UserDoc } from './shared/user';

initializeApp();
const db = getFirestore();

const TESTS: TestId[] = ['sat', 'act'];
const RECENT_KEEP = 150;
/** Slack on the Legendary time limit for network and render latency. */
const LEGENDARY_TIME_GRACE = 1.1;
const CHECKPOINT_MAX_MISSES = 3;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const userRef = (uid: string) => db.doc(`users/${uid}`) as DocumentReference<UserDoc>;
const progressRef = (uid: string) => db.doc(`users/${uid}/state/progress`) as DocumentReference<ProgressDoc>;

function requireUid(auth: { uid: string } | undefined): string {
  if (!auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return auth.uid;
}

/** Display names are shown to strangers in leagues, so offensive ones are refused (App Store 1.2). */
const nameMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
  // Real names and words the dataset flags (checked against obscenity 0.4.6).
  whitelistedTerms: ['dickson', 'dickens', 'dickinson', 'dickey', 'dickie', 'analise', 'analisa', 'penistone', 'hancock', 'cockburn', 'babcock', 'assaf', 'shitake', 'shiitake'],
});
/** Also checks with spaces and dots removed, so "f u c k" is caught. */
const offensiveName = (name: string) => nameMatcher.hasMatch(name) || nameMatcher.hasMatch(name.replace(/[\s._-]+/g, ''));
/** Distinct reporters that hide a name from leagues until someone reviews `reports/{uid}`. */
const REPORTS_TO_HIDE = 2;
const HIDDEN_NAME = 'Learner';

function emptyProgress(): ProgressDoc {
  return { nodes: {}, mastery: {}, bookmarks: [], mistakes: [], recent: [] };
}

// ---------------------------------------------------------------- initUser

export const initUser = onCall<InitUserRequest>(async (req) => {
  const uid = requireUid(req.auth);
  const d = req.data;

  const name = typeof d.displayName === 'string' ? d.displayName.trim() : '';
  if (name.length < 2 || name.length > 20) throw new HttpsError('invalid-argument', 'Name must be 2–20 characters.');
  if (offensiveName(name)) throw new HttpsError('invalid-argument', 'Please choose a different name. Other players see it in leagues.');
  if (!Array.isArray(d.tests) || d.tests.length === 0 || d.tests.some((t) => !TESTS.includes(t)))
    throw new HttpsError('invalid-argument', 'Pick SAT, ACT, or both.');
  if (!d.tests.includes(d.activeTest)) throw new HttpsError('invalid-argument', 'Bad active test.');
  if (!DAILY_GOALS.some((g) => g.xp === d.dailyXpGoal)) throw new HttpsError('invalid-argument', 'Bad daily goal.');
  if (!AVATARS.includes(d.avatar)) throw new HttpsError('invalid-argument', 'Bad avatar.');

  const goals: UserDoc['goals'] = {};
  for (const t of d.tests) {
    const g = d.goals?.[t];
    const { min, max } = getTest(t).scale;
    const inScale = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
    if (!g || !inScale(g.target)) throw new HttpsError('invalid-argument', `Target ${t.toUpperCase()} score must be ${min}–${max}.`);
    if (g.current !== null && !inScale(g.current)) throw new HttpsError('invalid-argument', 'Bad current score.');
    if (g.testDate !== null && !DAY_RE.test(g.testDate)) throw new HttpsError('invalid-argument', 'Bad test date.');
    goals[t] = { target: g.target, current: g.current, testDate: g.testDate };
  }

  let nodes: Record<string, NodeProgress> = {};
  for (const t of d.tests) {
    const units = buildPath(t);
    for (const unitId of d.placedUnits?.[t] ?? []) {
      const unit = units.find((u) => u.id === unitId);
      if (!unit) throw new HttpsError('invalid-argument', `Unknown unit ${unitId}.`);
      nodes = applyCheckpoint(unit, nodes);
    }
  }

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(userRef(uid));
    if (existing.exists && existing.data()?.onboarded) throw new HttpsError('already-exists', 'Already set up.');
    const user: UserDoc = {
      displayName: name,
      avatar: d.avatar,
      tests: d.tests,
      activeTest: d.activeTest,
      goals,
      dailyXpGoal: d.dailyXpGoal,
      timezoneOffsetMin: Number(d.timezoneOffsetMin) || 0,
      onboarded: true,
      game: {
        xp: 0,
        gems: 0,
        streak: newStreak(),
        leagueTier: 0,
        leagueCohort: null,
        xpBoostUntil: null,
        todayXp: { day: '', xp: 0 },
      },
    };
    tx.set(userRef(uid), user);
    tx.set(progressRef(uid), { ...emptyProgress(), nodes });
  });
});

// ----------------------------------------------------------- completeLesson

export const completeLesson = onCall<CompleteLessonRequest>(async (req): Promise<CompleteLessonResponse> => {
  const uid = requireUid(req.auth);
  const { test, nodeId, kind, answers, localDay } = req.data;

  if (!TESTS.includes(test)) throw new HttpsError('invalid-argument', 'Bad test.');
  if (!['lesson', 'legendary', 'checkpoint', 'practice'].includes(kind)) throw new HttpsError('invalid-argument', 'Bad kind.');
  if (!Array.isArray(answers) || answers.length === 0 || answers.length > MAX_ANSWERS_PER_LESSON)
    throw new HttpsError('invalid-argument', 'Bad answers.');
  // The device's local day may differ from UTC by at most a day.
  if (!DAY_RE.test(localDay) || Math.abs(daysBetween(new Date().toISOString().slice(0, 10), localDay)) > 1)
    throw new HttpsError('invalid-argument', 'Bad local day.');
  const totalMs = answers.reduce((s, a) => s + (Number(a.timeMs) || 0), 0);
  if (totalMs < answers.length * MIN_MS_PER_ANSWER) throw new HttpsError('failed-precondition', 'Answers came in too fast.');

  const units = buildPath(test);
  const isPractice = nodeId.startsWith('practice:');
  const found = isPractice ? null : findNode(units, nodeId);
  if (isPractice !== (kind === 'practice')) throw new HttpsError('invalid-argument', 'Kind does not match node.');
  if (!isPractice) {
    if (!found) throw new HttpsError('not-found', 'Unknown node.');
    const nk = found.node.kind;
    const ok =
      (kind === 'lesson' && (nk === 'skill' || nk === 'review')) ||
      (kind === 'legendary' && nk === 'skill') ||
      (kind === 'checkpoint' && nk === 'checkpoint');
    if (!ok) throw new HttpsError('invalid-argument', 'Kind does not match node.');
  }

  // Grade against the server's copy of each question.
  const ids = [...new Set(answers.map((a) => a.questionId))];
  const snaps = await db.getAll(...ids.map((id) => db.doc(`questions/${id}`)));
  const questions = new Map<string, Question>();
  for (const s of snaps) {
    const q = s.data() as Question | undefined;
    if (!q || q.reviewStatus !== 'approved' || q.test !== test) throw new HttpsError('invalid-argument', `Bad question ${s.id}.`);
    if (found && !found.node.skillIds.includes(q.skillId)) throw new HttpsError('invalid-argument', `Question ${s.id} is not in this node.`);
    questions.set(s.id, { ...q, id: s.id });
  }
  const graded = answers.map((a) => {
    const q = questions.get(a.questionId)!;
    return { questionId: q.id, skillId: q.skillId, difficulty: q.difficulty as Difficulty, correct: isCorrect(q, a.response), timeMs: a.timeMs };
  });
  const misses = graded.filter((g) => !g.correct).length;

  let passed = true;
  if (kind === 'legendary')
    passed = graded.length >= LEGENDARY_QUESTIONS && misses === 0 && !!found &&
      totalMs <= legendarySeconds(found.node) * 1000 * LEGENDARY_TIME_GRACE;
  if (kind === 'checkpoint') passed = graded.length >= CHECKPOINT_QUESTIONS && misses <= CHECKPOINT_MAX_MISSES;

  let bestRun = 0;
  for (let run = 0, i = 0; i < graded.length; i++) {
    run = graded[i].correct ? run + 1 : 0;
    bestRun = Math.max(bestRun, run);
  }

  const now = Date.now();
  const week = weekId(new Date(now));
  const questsRef = db.doc(`users/${uid}/quests/${localDay}`);

  const result = await db.runTransaction(async (tx) => {
    const [userSnap, progSnap, questSnap] = await Promise.all([tx.get(userRef(uid)), tx.get(progressRef(uid)), tx.get(questsRef)]);
    const user = userSnap.data();
    if (!user?.onboarded) throw new HttpsError('failed-precondition', 'Finish onboarding first.');
    const prog: ProgressDoc = { ...emptyProgress(), ...progSnap.data() };

    if (found && !isUnlocked(units, prog.nodes, nodeId)) throw new HttpsError('failed-precondition', 'Node is locked.');
    if (kind === 'legendary' && (prog.nodes[nodeId]?.level ?? 0) < LEVELS_PER_NODE)
      throw new HttpsError('failed-precondition', 'Clear every level first.');

    const game = user.game;
    const boosted = !!game.xpBoostUntil && game.xpBoostUntil > now;
    const xp = lessonXp({ kind, answers: graded, passed, boosted });

    // Mastery, mistakes, recent.
    const mastery = { ...prog.mastery };
    const mistakes = new Set(prog.mistakes);
    for (const g of graded) {
      mastery[g.skillId] = updateMastery(mastery[g.skillId] ?? newMastery(), g.difficulty, g.correct);
      if (g.correct) mistakes.delete(g.questionId);
      else mistakes.add(g.questionId);
    }
    const recent = [...prog.recent.filter((id) => !questions.has(id)), ...ids].slice(-RECENT_KEEP);

    // Path progress.
    let nodes = { ...prog.nodes };
    let newLevel: number | null = null;
    if (found && passed) {
      const p = nodes[nodeId] ?? { level: 0, legendary: false };
      if (kind === 'lesson') {
        newLevel = found.node.kind === 'skill' ? Math.min(LEVELS_PER_NODE, p.level + 1) : Math.max(1, p.level);
        nodes[nodeId] = { ...p, level: newLevel };
      } else if (kind === 'legendary') {
        nodes[nodeId] = { ...p, legendary: true };
      } else if (kind === 'checkpoint') {
        nodes = applyCheckpoint(found.unit, nodes);
      }
    }

    // Daily XP, streak.
    const todayXp = game.todayXp.day === localDay ? game.todayXp.xp + xp.total : xp.total;
    let streak = settle(game.streak, localDay).streak;
    let milestone: number | null = null;
    const before = streak.lastDay;
    if (todayXp >= user.dailyXpGoal) ({ streak, milestone } = creditGoal(streak, localDay));
    const extended = streak.lastDay === localDay && before !== localDay;

    // Quests.
    const questStates: QuestState[] =
      (questSnap.data()?.quests as QuestState[] | undefined) ??
      questsFor(uid, localDay).map((q) => ({ ...q, progress: 0, done: false }));
    const { states, completed } = advanceQuests(questStates, {
      xp: xp.total,
      perfect: xp.perfect > 0,
      bestRun,
      correct: graded.filter((g) => g.correct).length,
    });
    const gemsEarned = completed.reduce((s, q) => s + q.gems, 0);

    // League: join this week's cohort if needed.
    let cohortId = game.leagueCohort;
    let cohortIsNew = false;
    if (!cohortId || !cohortId.startsWith(`${week}_`)) {
      const open = await tx.get(
        db.collection('leagues').where('weekId', '==', week).where('tier', '==', game.leagueTier).where('size', '<', COHORT_SIZE).limit(1),
      );
      if (open.empty) {
        cohortId = `${week}_${game.leagueTier}_${uid.slice(0, 8)}${now}`;
        cohortIsNew = true;
      } else {
        cohortId = open.docs[0].id;
      }
    }
    const cohortRef = db.doc(`leagues/${cohortId}`);
    const memberPath = `members.${uid}`;
    if (cohortIsNew) {
      tx.set(cohortRef, {
        weekId: week,
        tier: game.leagueTier,
        endsAt: weekEnd(now),
        size: 1,
        settled: false,
        members: { [uid]: { name: user.displayName, avatar: user.avatar, weeklyXp: xp.total, lastXpAt: now } },
      });
    } else if (cohortId !== game.leagueCohort) {
      tx.update(cohortRef, {
        size: FieldValue.increment(1),
        [memberPath]: { name: user.displayName, avatar: user.avatar, weeklyXp: xp.total, lastXpAt: now },
      });
    } else {
      tx.update(cohortRef, {
        [`${memberPath}.weeklyXp`]: FieldValue.increment(xp.total),
        [`${memberPath}.lastXpAt`]: now,
      });
    }

    tx.update(userRef(uid), {
      'game.xp': FieldValue.increment(xp.total),
      'game.gems': FieldValue.increment(gemsEarned),
      'game.streak': streak,
      'game.todayXp': { day: localDay, xp: todayXp },
      'game.leagueCohort': cohortId,
    });
    tx.set(progressRef(uid), { ...prog, mastery, nodes, recent, mistakes: [...mistakes] });
    tx.set(questsRef, { quests: states });

    return {
      xp,
      passed,
      newLevel,
      streak: { count: streak.count, milestone, extended },
      questsCompleted: completed.map((q) => q.title),
      gemsEarned,
      graded: graded.map(({ questionId, correct, difficulty }) => ({ questionId, correct, difficulty })),
    } satisfies CompleteLessonResponse;
  });

  // Raw attempts feed analytics (weak-spot heat map, question calibration). Not transactional.
  const batch = db.batch();
  for (const g of graded) batch.set(db.collection(`users/${uid}/attempts`).doc(), { ...g, nodeId, kind, at: now });
  await batch.commit();

  return result;
});

// ------------------------------------------------------- completeDiagnostic

export const completeDiagnostic = onCall<CompleteDiagnosticRequest>(async (req): Promise<CompleteDiagnosticResponse> => {
  const uid = requireUid(req.auth);
  const { test, answers } = req.data;

  if (!TESTS.includes(test)) throw new HttpsError('invalid-argument', 'Bad test.');
  if (!Array.isArray(answers) || answers.length === 0 || answers.length > MAX_ANSWERS_PER_LESSON)
    throw new HttpsError('invalid-argument', 'Bad answers.');
  const ids = answers.map((a) => a.questionId);
  if (new Set(ids).size !== ids.length) throw new HttpsError('invalid-argument', 'Duplicate question.');
  const totalMs = answers.reduce((s, a) => s + (Number(a.timeMs) || 0), 0);
  if (totalMs < answers.length * MIN_MS_PER_ANSWER) throw new HttpsError('failed-precondition', 'Answers came in too fast.');

  const snaps = await db.getAll(...ids.map((id) => db.doc(`questions/${id}`)));
  const questions = new Map<string, Question>();
  for (const s of snaps) {
    const q = s.data() as Question | undefined;
    if (!q || q.reviewStatus !== 'approved' || q.test !== test) throw new HttpsError('invalid-argument', `Bad question ${s.id}.`);
    questions.set(s.id, { ...q, id: s.id });
  }
  const graded = answers.map((a) => {
    const q = questions.get(a.questionId)!;
    return { questionId: q.id, skillId: q.skillId, difficulty: q.difficulty as Difficulty, correct: isCorrect(q, a.response), timeMs: a.timeMs };
  });

  const now = Date.now();
  const result = scoreDiagnostic(test, graded, now);
  const units = buildPath(test);

  const response = await db.runTransaction(async (tx) => {
    const [userSnap, progSnap] = await Promise.all([tx.get(userRef(uid)), tx.get(progressRef(uid))]);
    if (!userSnap.data()?.onboarded) throw new HttpsError('failed-precondition', 'Finish onboarding first.');
    const prog: ProgressDoc = { ...emptyProgress(), ...progSnap.data() };
    if (prog.diagnostic?.[test]) throw new HttpsError('already-exists', 'Diagnostic already taken.');

    const mastery = seedMastery(test, result, graded, prog.mastery);
    let nodes = { ...prog.nodes };
    for (const unitId of result.placedUnits) {
      const unit = units.find((u) => u.id === unitId);
      if (unit) nodes = applyCheckpoint(unit, nodes);
    }
    const mistakes = new Set(prog.mistakes);
    for (const g of graded) if (!g.correct) mistakes.add(g.questionId);
    const recent = [...prog.recent.filter((id) => !questions.has(id)), ...ids].slice(-RECENT_KEEP);

    tx.set(progressRef(uid), {
      ...prog,
      mastery,
      nodes,
      mistakes: [...mistakes],
      recent,
      diagnostic: { ...prog.diagnostic, [test]: result },
    });
    return { result, estimate: predictScore(test, mastery) } satisfies CompleteDiagnosticResponse;
  });

  const batch = db.batch();
  for (const g of graded) batch.set(db.collection(`users/${uid}/attempts`).doc(), { ...g, nodeId: 'diagnostic', kind: 'diagnostic', at: now });
  await batch.commit();

  return response;
});

/** Leagues end Monday 00:00 UTC. */
function weekEnd(now: number): number {
  const d = new Date(now);
  const day = d.getUTCDay() || 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + (8 - day));
}

// ---------------------------------------------------------------- openChest

export const openChest = onCall<{ nodeId: string }>(async (req): Promise<OpenChestResponse> => {
  const uid = requireUid(req.auth);
  const nodeId = String(req.data?.nodeId ?? '');
  const test = TESTS.find((t) => nodeId.startsWith(`${t}.`));
  if (!test) throw new HttpsError('invalid-argument', 'Bad node.');
  const units = buildPath(test);
  const found = findNode(units, nodeId);
  if (found?.node.kind !== 'chest') throw new HttpsError('invalid-argument', 'Not a chest.');

  return db.runTransaction(async (tx) => {
    const prog: ProgressDoc = { ...emptyProgress(), ...(await tx.get(progressRef(uid))).data() };
    if (!isUnlocked(units, prog.nodes, nodeId)) throw new HttpsError('failed-precondition', 'Chest is locked.');
    if ((prog.nodes[nodeId]?.level ?? 0) >= 1) throw new HttpsError('already-exists', 'Already opened.');

    const gems = 20 + Math.floor(Math.random() * 21);
    const xpBoostMinutes = Math.random() < 1 / 3 ? 15 : 0;
    tx.set(progressRef(uid), { nodes: { [nodeId]: { level: 1, legendary: false } } }, { merge: true });
    tx.update(userRef(uid), {
      'game.gems': FieldValue.increment(gems),
      ...(xpBoostMinutes ? { 'game.xpBoostUntil': Date.now() + xpBoostMinutes * 60_000 } : {}),
    });
    return { gems, xpBoostMinutes };
  });
});

// ------------------------------------------------------------------ buyItem

export const buyItem = onCall<{ item: ShopItem }>(async (req) => {
  const uid = requireUid(req.auth);
  const item = req.data?.item;
  if (item !== 'streakFreeze') throw new HttpsError('invalid-argument', 'Unknown item.');

  return db.runTransaction(async (tx) => {
    const user = (await tx.get(userRef(uid))).data();
    if (!user) throw new HttpsError('failed-precondition', 'No profile.');
    const price = SHOP_PRICES[item];
    if (user.game.gems < price) throw new HttpsError('failed-precondition', 'Not enough gems.');
    if (user.game.streak.freezes >= MAX_FREEZES) throw new HttpsError('failed-precondition', 'Freeze slots full.');
    tx.update(userRef(uid), { 'game.gems': user.game.gems - price, 'game.streak': addFreeze(user.game.streak) });
    return { gems: user.game.gems - price };
  });
});

// ------------------------------------------------------------ settleLeagues

export const settleLeagues = onSchedule({ schedule: 'every monday 00:05', timeZone: 'Etc/UTC' }, async () => {
  const lastWeek = weekId(new Date(Date.now() - 86_400_000));
  const cohorts = await db.collection('leagues').where('weekId', '==', lastWeek).where('settled', '==', false).get();

  for (const c of cohorts.docs) {
    const data = c.data() as { tier: number; members: Record<string, { weeklyXp: number; lastXpAt: number }> };
    const members = Object.entries(data.members)
      .map(([uid, m]) => ({ uid, weeklyXp: m.weeklyXp, lastXpAt: m.lastXpAt }))
      .sort((a, b) => a.lastXpAt - b.lastXpAt);
    const outcomes = settleCohort(members, data.tier);

    // A deleted account's user doc is gone; updating it would fail the whole batch.
    const users = members.length ? await db.getAll(...members.map((m) => userRef(m.uid))) : [];
    const live = new Set(users.filter((u) => u.exists).map((u) => u.id));
    const batch = db.batch();
    for (const [uid, outcome] of outcomes) {
      if (live.has(uid)) batch.update(userRef(uid), { 'game.leagueTier': nextTier(data.tier, outcome), 'game.leagueCohort': null });
    }
    batch.update(c.ref, { settled: true, outcomes: Object.fromEntries(outcomes) });
    await batch.commit();
  }
});

// -------------------------------------------------------------- reportUser

/**
 * Reports a league member's name (App Store 1.2). The reporter also stops seeing that member.
 * After REPORTS_TO_HIDE distinct reporters the name is replaced everywhere until reviewed;
 * open reports are in `reports/{uid}` (Firebase console).
 */
export const reportUser = onCall<{ uid: string; cohortId: string }>(async (req) => {
  const reporter = requireUid(req.auth);
  const { uid: target, cohortId } = req.data ?? {};
  if (typeof target !== 'string' || typeof cohortId !== 'string' || target === reporter) throw new HttpsError('invalid-argument', 'Bad report.');
  const cohortRef = db.doc(`leagues/${cohortId}`);
  const reportRef = db.doc(`reports/${target}`);
  await db.runTransaction(async (tx) => {
    const [cohort, report, targetUser] = await Promise.all([tx.get(cohortRef), tx.get(reportRef), tx.get(userRef(target))]);
    const members = (cohort.data()?.members ?? {}) as Record<string, { name: string }>;
    if (!members[target] || !members[reporter]) throw new HttpsError('not-found', 'That player is not in your league.');
    const reporters: string[] = report.data()?.reporters ?? [];
    if (!reporters.includes(reporter)) reporters.push(reporter);
    tx.set(reportRef, { name: members[target].name, reporters, count: reporters.length, lastAt: Date.now(), status: 'open' }, { merge: true });
    tx.update(userRef(reporter), { blocked: FieldValue.arrayUnion(target) });
    if (reporters.length >= REPORTS_TO_HIDE && members[target].name !== HIDDEN_NAME) {
      tx.update(cohortRef, { [`members.${target}.name`]: HIDDEN_NAME });
      if (targetUser.exists) tx.update(userRef(target), { displayName: HIDDEN_NAME });
    }
  });
});

// ----------------------------------------------------------- deleteAccount

/** In-app account deletion (App Store 5.1.1(v)): user data, league entries, then the auth user. */
export const deleteAccount = onCall(async (req) => {
  const uid = requireUid(req.auth);
  const cohorts = await db.collection('leagues').where(`members.${uid}.lastXpAt`, '>', 0).get();
  for (const c of cohorts.docs) {
    await c.ref.update({ [`members.${uid}`]: FieldValue.delete(), size: FieldValue.increment(-1) });
  }
  await db.recursiveDelete(userRef(uid));
  await db.doc(`reports/${uid}`).delete();
  await getAuth().deleteUser(uid);
});
