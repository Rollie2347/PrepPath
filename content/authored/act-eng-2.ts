// ACT English, set 2. Original passages written for PrepPath (Claude Code session, 2026-10-17).
import type { Authored } from '../pipeline/ingest';

import { at, type Flip, finalize, plain, shuffledNoChange } from './helpers';

const NC = 'NO CHANGE';
const S = 'act.eng.cse.structure';
const U = 'act.eng.cse.usage';
const P = 'act.eng.cse.punct';
const ORG = 'act.eng.pow.org';
const TOP = 'act.eng.pow.topic';
const CL = 'act.eng.kol.clarity';
const ST = 'act.eng.kol.style';
const best = 'Which choice is best?';
const keep = 'The writer is considering deleting the underlined sentence. Should the sentence be kept or deleted?';

// --- Mural on Fifth Street
const muralA =
  "For twenty years, the brick wall beside Hal's Hardware on Fifth Street was blank. [[1|Then, last spring, the owner invited]] art students from the high school to paint a mural there. [[2|The students spent weeks planning the design, they]] interviewed longtime residents about the neighborhood's history.";
const muralB =
  "The finished mural shows the street as it looked in 1950, with a streetcar, a movie theater, and crowds of shoppers. [[4|In one corner, the students painted a small portrait of Hal himself, who has run the store for four decades.]] [[5|Their's]] is a mural that honors both the past and the people who keep the neighborhood going.";
const muralC =
  "On the day the mural was finished, dozens of neighbors gathered on the sidewalk. Hal, who rarely speaks in public, gave a short speech thanking the students. \"I [[7|walk past this wall every morning,\"]] he said. \"Now it finally has something to say.\"";

// --- Learning ASL
const aslA =
  'When my younger brother, Eli, was born deaf, my family [[8|decided that all of us would learn American Sign Language (ASL) together as a family unit]]. [[9|At first, I was the slowest learner.]] My parents practiced every evening, but I was busy with soccer and homework, and I kept forgetting the signs.';
const aslB =
  "Everything changed when Eli turned three. One afternoon he tugged my sleeve and signed a question I didn't understand. He tried again, more slowly, but I still couldn't follow. [[10|Watching his face fall, I realized that if I didn't learn, I would miss out on knowing my own brother.]]";
const aslC =
  'From then on, I practiced every day. I watched videos, quizzed myself with flash cards, and asked Eli to teach me the signs he learned at preschool. [[12|Moreover,]] within a year I could hold a real conversation with him.';
const aslD =
  "Now Eli is eight, and he corrects my signing whenever I make a mistake. I don't mind. Learning his language has taught me that understanding someone often means meeting them where they are.";

// --- Grandmother's lemon cake
const cakeA =
  "After my grandmother passed away, my aunt found an index card tucked inside an old cookbook. The ink had faded, and several words were [[17|smudged beyond reading]], but the card clearly listed flour, sugar, lemons, and an ingredient none of us expected: a spoonful of black pepper.";
const cakeB =
  'It took my aunt and me six tries to get the cake right. The first version was [[19|as dense as a brick]]; the second was too sour. By the sixth attempt, though, [[20|we had it: the]] same golden crust, the same bright, peppery tang that we remembered from every birthday of our childhood.';
const cakeC =
  'Each of my cousins [[21|have]] now baked the cake at least once. [[22|Whoever]] tastes it for the first time always asks the same question: why pepper?';

// --- Weather balloon
const balloonB =
  '[[25|Our teacher, Ms. Ferreira, had warned us that]] the balloon would eventually burst. When it did, a parachute would carry the box [[26|safely back to the ground. Where]] we hoped to find it.';
const balloonC =
  '[1] The balloon climbed for nearly two hours. [2] Its camera recorded the curve of Earth and the black sky above the atmosphere. [3] At about 30 kilometers up, the balloon burst. [4] Ninety minutes later, the GPS tracker showed the box resting in a cornfield forty miles away.';
const balloonD =
  'We drove out the next morning and found the box [[28|intact, its]] camera still running. [[29|Watching the footage that afternoon, the whole class cheered when the balloon burst.]]';

// --- Bike co-op
const bikeA =
  '[[38|On Saturday mornings, the sound of wrenches and spinning wheels drifts out of a converted garage on Maple Avenue.]] Inside, a bicycle cooperative teaches people how to repair their own bikes. Members pay ten dollars a year, [[31|which gives them access to tools, spare parts, and advice from volunteer mechanics who give advice]].';
const bikeB =
  "The co-op's founder, Dev Patel, started it in 2015. He had noticed that many people in the neighborhood owned bikes they could not ride [[33|because of minor problems, such as flat tires or loose chains, that are minor]].";
const bikeC =
  'Today the co-op [[34|hosts]] about forty members on a typical Saturday. [[35|Some come to fix a single brake; others spend hours rebuilding old frames into working bikes.]] The volunteers never do the work for anyone. Instead, they [[36|coach members through each repair]], so that members leave knowing how to do it themselves.';
const bikeD = 'The co-op has grown so popular that the garage is often crowded. [[37|For this reason,]] Dev hopes to open a second location across town next year.';

// --- Glacier research
const iceA =
  'Glaciers [[39|creep]] downhill so slowly that the movement is invisible to the eye. [[49|My cousin once visited a glacier in Alaska.]] Over centuries, this slow movement carves deep valleys into mountains.';
const iceB =
  'Scientists [[40|spy on]] glaciers using satellites and field measurements. The data show that most glaciers are shrinking. [[50|Therefore,]] a few glaciers have grown in recent decades, usually where snowfall has increased.';
const iceC =
  "Last summer, a research team camped beside a glacier in the Canadian Rockies. The glacier's surface was [[42|a dazzling, cracked expanse of blue-white ice]]. Each day the researchers [[43|trudged]] across it for hours, sinking into soft snow with every step.";
const iceD =
  'The team set up camp near the edge of the ice[[52|. The]] wind was so strong one night that two tents blew over. The expedition\'s leader, [[51|a glaciologist who has studied ice for thirty years]], insisted on careful safety checks every morning.';
const iceE =
  '[[53|Buried under fresh snow, the scientists could barely find the trail]] on the last day. If the weather [[54|would have been]] better, they would have finished a day early. Still, the researchers returned [[44|back to their base camp]] with every sample they needed.';
const iceF =
  "[[45|In spite of the fact that]] the season was short, the team's findings [[46|were published in a scientific journal that publishes research]] the following spring. The study's lead author said the results were [[47|alarming and worrying and concerning]]. When the researchers later met with members of the town council, [[48|they]] asked for more funding for the study.";
const iceG =
  "The team packed three essential items[[55|: ice axes,]] ropes, and satellite phones. Their measurements matter far beyond the mountains: the glacier's meltwater feeds a river [[56|that, in turn,]] supplies a nearby city.";


// Spots whose original wording is correct but shown with an error, so NO CHANGE is not the key
// too often. Letters in explanations refer to the order before shuffling (remapped after).
const FLIPS: Record<number, Flip> = {
  1: { k: 1, explanation: '"Then" marks the next event in time: the wall was blank for twenty years, and then the owner invited students to paint it. "For example," "Similarly," and "In other words" signal an illustration, a likeness, or a restatement, none of which fits.' },
  17: { k: 1, explanation: '"Smudged beyond reading" is clear and concise and fits the reflective tone. The original is vague, C is too casual, and D is stiff and wordy.' },
  22: { k: 1, explanation: 'The pronoun is the subject of "tastes," so the subject form "Whoever" is correct; it means "any person who." "Whomever" is an object form, "Whoever\'s" is possessive, and "Who" cannot begin this statement on its own.' },
  25: { k: 1, explanation: 'The name "Ms. Ferreira" renames "Our teacher," so it is set off by a pair of commas. The original and C each use only one of the pair, and D adds a comma between "us" and "that," which interrupts the sentence.' },
  34: { k: 1, explanation: '"Hosts" precisely describes a place where members gather to work. "Harbors" and "shelters" suggest hiding or protecting people, and "entertains" suggests providing amusement.' },
  36: { k: 1, explanation: '"Coach members through each repair" matches the point that volunteers guide members so they learn. The other choices suggest bossiness or condescension, which contradicts the description.' },
  37: { k: 1, explanation: 'Crowding at the garage is the reason Dev wants a second location, so "For this reason" is the logical link. "On the other hand" and "Even so" signal contrast, and "For instance" signals an example.' },
  39: { k: 1, explanation: 'The sentence says the movement is so slow it is invisible, and "creep" means to move slowly. "Sprint," "zip," and "dash" all mean to move fast.' },
  43: { k: 1, explanation: 'The researchers walked for hours while sinking into snow, and "trudged" means to walk slowly with effort. "Skipped," "pranced," and "strolled" all suggest light or easy movement.' },
  52: { k: 1, explanation: 'Each part is a complete sentence, so a period correctly separates them. The original joins them with only a comma (a comma splice), C has no punctuation (a run-on), and D adds a comma after "and."' },
  56: { k: 1, explanation: '"In turn" is an interrupting phrase, so it is set off by a pair of commas. The original and C each use only one comma, and D splits the phrase itself.' },
};

const items: Authored[] = [
  // Mural
  { skill: ORG, d: 1, stimulus: at(muralA, 1), stem: best, choices: [NC, 'For example, last spring, the owner invited', 'Similarly, last spring, the owner invited', 'In other words, last spring, the owner invited'], answer: 0, explanation: '"Then" marks the next event in time: the wall was blank for twenty years, and then the owner invited students to paint it. "For example," "Similarly," and "In other words" signal an illustration, a likeness, or a restatement, none of which fits.' },
  { skill: S, d: 2, stimulus: at(muralA, 2), stem: best, choices: [NC, 'The students spent weeks planning the design; they', 'The students spent weeks planning the design they', 'The students, spending weeks planning the design, they'], answer: 1, explanation: 'Two complete sentences are joined with only a comma (a comma splice). A semicolon fixes it. C is a run-on, and D gives the verb "interviewed" two subjects ("The students… they").' },
  { skill: TOP, d: 4, stimulus: at(muralB, 4), stem: keep, choices: ["Kept, because it supports the final sentence's point that the mural honors the people who keep the neighborhood going.", 'Kept, because it explains how the students chose the colors for the mural.', 'Deleted, because it contradicts the idea that the mural shows the street in 1950.', 'Deleted, because it repeats information from the first paragraph.'], answer: 0, explanation: 'The final sentence says the mural honors "the people who keep the neighborhood going." The portrait of Hal, who has run the store for decades, is the evidence for that point. The sentence says nothing about colors, does not contradict the 1950 scene, and repeats nothing.' },
  { skill: U, d: 2, stimulus: at(muralB, 5), stem: best, choices: [NC, 'Theirs', "There's", "Theirs'"], answer: 1, explanation: 'The possessive pronoun "theirs" never takes an apostrophe. "There\'s" means "there is," and "Their\'s" and "Theirs\'" are not standard forms.' },
  { skill: P, d: 3, stimulus: at(muralC, 7), stem: best, choices: [NC, "walk past this wall every morning\",", 'walk past this wall every morning;"', 'walk past this wall, every morning,"'], answer: 0, explanation: 'In standard American English, a comma that ends a quoted sentence before a tag like "he said" goes inside the closing quotation mark. B puts the comma outside, C uses a semicolon, and D adds an unneeded comma before "every morning."' },

  // ASL
  { skill: CL, d: 2, stimulus: at(aslA, 8), stem: best, choices: [NC, 'decided that all of us would learn American Sign Language (ASL) together', 'decided that all of us, as a family together, would learn American Sign Language (ASL) as a unit', 'made the decision that we all, together as a family, would be learning American Sign Language (ASL) as a group'], answer: 1, explanation: '"All of us… together" already says the whole family would learn, so "as a family unit" is redundant. B states the idea once. C and D pile on even more repetition.' },
  { skill: TOP, d: 3, stimulus: at(aslA, 9), stem: 'Which choice most effectively sets up the information that follows in the paragraph?', choices: [NC, 'ASL has its own grammar, which differs from English grammar.', 'My brother loved playing with blocks.', 'Many hearing families learn sign language.'], answer: 0, explanation: 'The rest of the paragraph explains why the narrator fell behind: soccer, homework, and forgetting signs. "At first, I was the slowest learner" sets that up. The other choices introduce facts the paragraph never develops.' },
  { skill: TOP, d: 2, stimulus: at(aslB, 10), stem: 'Which choice most effectively concludes the paragraph by showing why the narrator\'s attitude changed?', choices: [NC, "Eli's favorite color was green.", 'Three-year-olds often ask many questions.', 'I went back to my homework.'], answer: 0, explanation: 'The paragraph describes the narrator failing to understand Eli. Realizing "I would miss out on knowing my own brother" explains why the narrator began practicing every day. The other choices do not explain any change.' },
  { skill: ORG, d: 3, stimulus: at(aslC, 12), stem: best, choices: [NC, 'As a result,', 'However,', 'For instance,'], answer: 1, explanation: 'Being able to hold a conversation is the result of practicing every day, so "As a result" is the logical transition. "Moreover" adds an unrelated point, "However" signals a contrast, and "For instance" introduces an example.' },
  { skill: TOP, d: 4, stimulus: [plain(aslA), plain(aslB), plain(aslC), aslD].join('\n\n'), stem: "Suppose the writer's goal had been to write an essay about how a family member's needs changed the writer's own habits and understanding. Would this essay accomplish that goal?", choices: ["Yes, because it shows how the narrator went from neglecting ASL practice to studying every day in order to communicate with Eli.", 'Yes, because it explains the history of American Sign Language.', "No, because it focuses mainly on the parents' experience learning ASL.", "No, because it describes Eli's preschool rather than the narrator."], answer: 0, explanation: "The essay traces the narrator's change: from forgetting signs, to realizing what was at stake, to daily practice and a new understanding. It gives no history of ASL, and the parents and the preschool are only mentioned in passing." },

  // Cake
  { skill: ST, d: 3, stimulus: at(cakeA, 17), stem: best, choices: [NC, 'smudged in a way that was not nice', 'totally wrecked, like, unreadable', 'rendered illegible due to the occurrence of smudging'], answer: 0, explanation: '"Smudged beyond reading" is clear and concise and fits the reflective tone. B is too casual, C is vague, and D is stiff and wordy.' },
  { skill: ST, d: 2, stimulus: at(cakeB, 19), stem: best, choices: [NC, 'dense, very dense, extremely dense', 'of a density approximating that of masonry', 'kinda heavy I guess'], answer: 0, explanation: 'The simile "as dense as a brick" is vivid and matches the essay\'s warm, conversational tone. B is repetitive, C is stiff and overly formal, and D is too casual and vague.' },
  { skill: P, d: 4, stimulus: at(cakeB, 20), stem: best, choices: [NC, 'we had it; the', 'we had it the', 'we had it, and the'], answer: 0, explanation: 'A colon after a complete clause ("we had it") can introduce a description of what "it" was. A semicolon needs a complete sentence after it, and the list of qualities is not one. C runs the ideas together, and D creates a fragment after "and."' },
  { skill: U, d: 3, stimulus: at(cakeC, 21), stem: best, choices: [NC, 'has', 'are having', 'were'], answer: 1, explanation: 'The subject is "Each," which is singular ("of my cousins" just describes it). A singular subject takes "has." The other choices are plural.' },
  { skill: U, d: 4, stimulus: at(cakeC, 22), stem: best, choices: [NC, 'Whomever', "Whoever's", 'Who'], answer: 0, explanation: 'The pronoun is the subject of "tastes," so the subject form "Whoever" is correct; it means "any person who." "Whomever" is an object form, "Whoever\'s" is possessive, and "Who" cannot begin this statement on its own.' },

  // Balloon
  { skill: P, d: 3, stimulus: at(balloonB, 25), stem: best, choices: [NC, 'Our teacher Ms. Ferreira, had warned us that', 'Our teacher, Ms. Ferreira had warned us that', 'Our teacher, Ms. Ferreira, had warned us, that'], answer: 0, explanation: 'The name "Ms. Ferreira" renames "Our teacher," so it is set off by a pair of commas. B and C each use only one of the pair, and D adds a comma between "us" and "that," which interrupts the sentence.' },
  { skill: S, d: 2, stimulus: at(balloonB, 26), stem: best, choices: [NC, 'safely back to the ground, where', 'safely back to the ground; where', 'safely back to the ground where,'], answer: 1, explanation: '"Where we hoped to find it" cannot stand alone as a sentence. Joining it to the previous sentence with a comma makes it a clause describing the ground. A semicolon cannot introduce a dependent clause, and D puts the comma in the wrong place.' },
  { skill: ORG, d: 4, stimulus: balloonC, stem: 'The writer wants to add this sentence to the paragraph:\n\nIts thermometer, like the camera, kept recording the whole time.\n\nThe sentence would most logically be placed:', choices: ['after Sentence 1.', 'after Sentence 2.', 'after Sentence 3.', 'after Sentence 4.'], answer: 1, explanation: 'The new sentence compares the thermometer with "the camera," so it must follow Sentence 2, where the camera is introduced. It also belongs during the climb, before the balloon bursts in Sentence 3.' },
  { skill: P, d: 5, stimulus: at(balloonD, 28), stem: best, choices: [NC, 'intact; its', 'intact. Its', 'intact its'], answer: 0, explanation: '"Its camera still running" has no main verb, so it is a phrase that describes the box, and a comma attaches it correctly. A semicolon or a period would leave it as a fragment, and no punctuation runs it into "intact."' },
  { skill: S, d: 4, stimulus: at(balloonD, 29), stem: best, choices: [NC, "Watching the footage that afternoon, the balloon's burst made the whole class cheer.", 'The footage, watching it that afternoon, made the whole class cheer when the balloon burst.', 'Watching the footage that afternoon, cheers came from the whole class when the balloon burst.'], answer: 0, explanation: 'An opening phrase like "Watching the footage" must describe the subject right after the comma. In the original, the class is doing the watching, which makes sense. In the other choices the "burst," the "footage," or the "cheers" would be watching, which does not.' },

  // Bike co-op
  { skill: ORG, d: 2, stimulus: at(bikeA, 38), stem: 'Which choice most effectively introduces the essay?', choices: [NC, 'Bicycles were invented in the nineteenth century.', 'Maple Avenue is a long street.', 'Many people prefer cars to bicycles.'], answer: 0, explanation: 'The essay is about a bike repair co-op. Opening with the sounds of repair drifting out of the garage draws the reader straight into that scene. The other choices are general facts that do not lead into the co-op.' },
  { skill: CL, d: 3, stimulus: at(bikeA, 31), stem: best, choices: [NC, 'which gives them access to tools, spare parts, and advice from volunteer mechanics', 'which gives access to them of tools, spare parts, and advising mechanics who volunteer advice', 'giving them, for access, tools and spare parts and advice from mechanics, volunteer ones'], answer: 1, explanation: '"Advice from volunteer mechanics who give advice" says "advice" twice. B removes the repetition. C and D are wordy and awkward.' },
  { skill: CL, d: 2, stimulus: at(bikeB, 33), stem: best, choices: [NC, 'because of minor problems, such as flat tires or loose chains', 'because of problems, such as flat tires or loose chains, that were small and minor', 'because of flat tires or loose chains or other such problems of a minor and small nature'], answer: 1, explanation: 'The original calls the problems "minor" twice. B says it once and keeps the examples. C and D repeat the idea ("small and minor").' },
  { skill: ST, d: 3, stimulus: at(bikeC, 34), stem: best, choices: [NC, 'harbors', 'entertains', 'shelters'], answer: 0, explanation: '"Hosts" precisely describes a place where members gather to work. "Harbors" and "shelters" suggest hiding or protecting people, and "entertains" suggests providing amusement.' },
  { skill: TOP, d: 3, stimulus: at(bikeC, 35), stem: 'The writer wants to show that members come to the co-op with a wide range of projects. Which choice best accomplishes this goal?', choices: [NC, 'Most members ride their bikes to work.', 'The garage has a concrete floor.', 'Bike repair can be messy.'], answer: 0, explanation: 'Contrasting a single brake repair with hours of rebuilding old frames shows the range of projects. The other choices say nothing about what members work on.' },
  { skill: ST, d: 2, stimulus: at(bikeC, 36), stem: best, choices: [NC, 'boss members around during each repair', "lord over members' repairs", "handhold the members' repairs, like babysitters"], answer: 0, explanation: '"Coach members through each repair" matches the point that volunteers guide members so they learn. The other choices suggest bossiness or condescension, which contradicts the description.' },
  { skill: ORG, d: 2, stimulus: at(bikeD, 37), stem: best, choices: [NC, 'On the other hand,', 'For instance,', 'Even so,'], answer: 0, explanation: 'Crowding at the garage is the reason Dev wants a second location, so "For this reason" is the logical link. "On the other hand" and "Even so" signal contrast, and "For instance" signals an example.' },

  // Glaciers
  { skill: ST, d: 1, stimulus: at(iceA, 39), stem: best, choices: [NC, 'sprint', 'zip', 'dash'], answer: 0, explanation: 'The sentence says the movement is so slow it is invisible, and "creep" means to move slowly. "Sprint," "zip," and "dash" all mean to move fast.' },
  { skill: TOP, d: 2, stimulus: at(iceA, 49), stem: keep, choices: ['Kept, because it shows that glaciers can be visited.', 'Kept, because it explains how glaciers carve valleys.', 'Deleted, because it interrupts the explanation of how glaciers move and shape the land with an unrelated personal detail.', 'Deleted, because it contradicts the claim that glacier movement is invisible.'], answer: 2, explanation: 'The paragraph explains how slow glacier movement carves valleys. A cousin\'s trip to Alaska interrupts that explanation and adds nothing to it. It does not explain carving or contradict anything.' },
  { skill: ST, d: 2, stimulus: at(iceB, 40), stem: best, choices: [NC, 'monitor', 'snoop on', 'stalk'], answer: 1, explanation: 'The essay is informative and neutral. "Monitor" precisely describes scientists tracking glaciers. "Spy on," "snoop on," and "stalk" suggest secret or sinister watching.' },
  { skill: ORG, d: 2, stimulus: at(iceB, 50), stem: best, choices: [NC, 'However,', 'Likewise,', 'For this reason,'], answer: 1, explanation: 'Most glaciers are shrinking, but a few have grown: that is a contrast, so "However" is needed. "Therefore" and "For this reason" signal a result, and "Likewise" signals a similarity.' },
  { skill: ST, d: 1, stimulus: at(iceC, 42), stem: best, choices: [NC, 'pretty nice-looking', 'an icy thing', 'sort of blue'], answer: 0, explanation: '"A dazzling, cracked expanse of blue-white ice" gives a precise, vivid picture. The other choices are vague and too casual.' },
  { skill: ST, d: 2, stimulus: at(iceC, 43), stem: best, choices: [NC, 'skipped', 'pranced', 'strolled'], answer: 0, explanation: 'The researchers walked for hours while sinking into snow, and "trudged" means to walk slowly with effort. "Skipped," "pranced," and "strolled" all suggest light or easy movement.' },
  { skill: S, d: 1, stimulus: at(iceD, 52), stem: best, choices: [NC, ', the', ' the', ', and, the'], answer: 0, explanation: 'Each part is a complete sentence, so a period correctly separates them. A comma alone is a comma splice, no punctuation is a run-on, and D adds a comma after "and."' },
  { skill: P, d: 3, stimulus: at(iceD, 51), stem: best, choices: [NC, 'a glaciologist who has studied ice, for thirty years', 'a glaciologist who has studied ice for thirty years;', 'who is a glaciologist, has studied ice for thirty years,'], answer: 0, explanation: 'The phrase renames "The expedition\'s leader," and it is already set off by commas on both sides. B splits "studied ice for thirty years" with a comma, C puts a semicolon between the subject and its verb "insisted," and D turns the sentence into a jumble with two verbs and no clear subject.' },
  { skill: S, d: 5, stimulus: at(iceE, 53), stem: best, choices: [NC, 'The scientists could barely find the trail, which was buried under fresh snow,', 'Buried under fresh snow, finding the trail was barely possible for the scientists', 'The scientists, buried under fresh snow, could barely find the trail'], answer: 1, explanation: 'The trail, not the scientists, was buried. The original and D attach "buried under fresh snow" to the scientists, and C attaches it to "finding." B places the description right after "the trail," where it belongs.' },
  { skill: U, d: 4, stimulus: at(iceE, 54), stem: best, choices: [NC, 'had been', 'was being', 'would be'], answer: 1, explanation: 'This sentence imagines a past situation that did not happen. The "if" clause takes the past perfect ("had been"), and the result clause takes "would have." "Would have been" does not belong in the "if" clause.' },
  { skill: CL, d: 1, stimulus: at(iceE, 44), stem: best, choices: [NC, 'to their base camp', 'back again to their base camp', 'in a backward direction to their base camp'], answer: 1, explanation: '"Returned" already means "went back," so "back" is redundant. "Returned to their base camp" is concise.' },
  { skill: CL, d: 2, stimulus: at(iceF, 45), stem: best, choices: [NC, 'Although', 'Despite of the fact', 'Being that'], answer: 1, explanation: '"Although" says in one word what "In spite of the fact that" says in six. "Despite of" is not standard English, and "Being that" is nonstandard.' },
  { skill: CL, d: 2, stimulus: at(iceF, 46), stem: best, choices: [NC, 'were published in a scientific journal', 'were published in a journal of science that publishes scientific research', 'got published in a publishing journal for science'], answer: 1, explanation: 'A journal "that publishes research" repeats what "published in a scientific journal" already says. B is concise. C and D are even more repetitive.' },
  { skill: CL, d: 1, stimulus: at(iceF, 47), stem: best, choices: [NC, 'alarming', 'alarming, worrying', 'alarmingly concerning and worrying'], answer: 1, explanation: '"Alarming," "worrying," and "concerning" mean nearly the same thing here. One word, "alarming," says it clearly.' },
  { skill: CL, d: 4, stimulus: at(iceF, 48), stem: best, choices: [NC, 'the researchers', 'it', 'those'], answer: 1, explanation: '"They" could mean the researchers or the council members, so the sentence is unclear about who asked for funding. Naming "the researchers" removes the ambiguity. "It" and "those" are just as unclear.' },
  { skill: P, d: 2, stimulus: at(iceG, 55), stem: best, choices: [NC, '; ice axes,', ', ice axes', ' ice axes,'], answer: 0, explanation: 'A colon after a complete clause correctly introduces the list of three items. A semicolon cannot introduce a list, and B and C run the list into "items" or drop the comma between items.' },
  { skill: P, d: 3, stimulus: at(iceG, 56), stem: best, choices: [NC, 'that in turn,', 'that, in turn', 'that in, turn,'], answer: 0, explanation: '"In turn" is an interrupting phrase, so it is set off by a pair of commas. B and C each use only one comma, and D splits the phrase itself.' },
];

const PASSAGES = [muralA, muralB, muralC, aslA, aslB, aslC, aslD, cakeA, cakeB, cakeC, balloonB, balloonC, balloonD, bikeA, bikeB, bikeC, bikeD, iceA, iceB, iceC, iceD, iceE, iceF, iceG];

export default shuffledNoChange(finalize(items, PASSAGES, FLIPS));
