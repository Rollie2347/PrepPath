import { arrayRemove, arrayUnion, doc, setDoc } from '@react-native-firebase/firestore';
import { httpsCallable } from '@react-native-firebase/functions';

import type {
  CompleteDiagnosticRequest,
  CompleteDiagnosticResponse,
  CompleteLessonRequest,
  CompleteLessonResponse,
  InitUserRequest,
  OpenChestResponse,
  ShopItem,
} from '@shared/api';

import { auth, db, functions } from '@/lib/firebase';

export const initUser = httpsCallable<InitUserRequest, void>(functions, 'initUser');
export const completeLesson = httpsCallable<CompleteLessonRequest, CompleteLessonResponse>(functions, 'completeLesson');
export const completeDiagnostic = httpsCallable<CompleteDiagnosticRequest, CompleteDiagnosticResponse>(functions, 'completeDiagnostic');
export const openChest = httpsCallable<{ nodeId: string }, OpenChestResponse>(functions, 'openChest');
export const buyItem = httpsCallable<{ item: ShopItem }, { gems: number }>(functions, 'buyItem');
export const reportUser = httpsCallable<{ uid: string; cohortId: string }, void>(functions, 'reportUser');
export const deleteAccount = httpsCallable<void, void>(functions, 'deleteAccount');

/** Hides a league member from this user's leaderboard (no report). */
export async function blockUser(target: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(doc(db, 'users', uid), { blocked: arrayUnion(target) }, { merge: true });
}

export async function setBookmark(questionId: string, on: boolean) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(
    doc(db, 'users', uid, 'state', 'progress'),
    { bookmarks: on ? arrayUnion(questionId) : arrayRemove(questionId) },
    { merge: true },
  );
}
