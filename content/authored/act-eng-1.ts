// ACT English, set 1. Original passages written for PrepPath (Claude Code session, 2026-10-17).
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

// --- The Seed Library
const seedA =
  'When the public library in Alder Falls opened a seed library three years ago, [[1|nobody were sure]] whether residents would use it. The idea was simple. Anyone with a library card could borrow packets of vegetable and flower seeds, grow the plants at home, and return seeds saved from the harvest at the end of the season. The librarians stored the packets in an old wooden card catalog[[2|, its]] dozens of small drawers were perfect for sorting seeds by type.';
const seedB =
  "The first spring, only a handful of gardeners borrowed seeds. [[3|By the second year, however,]] word had spread. Local schools asked for packets for their classroom gardens, and a group of retirees [[4|volunteered to sort, label, and they would also deliver]] seeds to homebound residents. The library's director, Mae Ortiz, [[5|who had first proposed the idea,]] began keeping a list of the varieties that grew best in the valley's short, cool summers.";
const seedC =
  "[[6|Saving seeds is not difficult, but it does require patience.]] A tomato, for instance, must ripen fully on the vine before its seeds can be collected, and bean pods must be left to dry until they rattle. [[7|Gardeners who return seeds are asked to label each packet with the plant's name, the year, and any notes about how it grew.]] These notes, written in pencil on the backs of the packets, have become one of the library's [[8|most valuable]] resources.";
const seedD =
  "Today the card catalog holds more than four hundred varieties, many of them saved and returned by local gardeners. [[9|The project that began as an uncertain experiment has become part of the town's yearly rhythm, as familiar as the first frost.]]";

// --- Grandpa's radio
const radioA =
  "My grandfather's radio sat on a shelf in his garage for as long as I can remember. It was a tabletop model from the 1950s, [[10|housed in a wooden cabinet that was made of wood]], with a cloth-covered speaker and a dial that glowed orange when it worked. It had not worked in decades. Last summer, I decided to [[11|bring it back to life]].";
const radioB =
  'I knew almost nothing about electronics, so I started by reading. A repair guide from the public library explained that most radios of that era [[12|fail for the same reason: their]] capacitors, small parts that store electric charge, dry out over time. [[13|Replacing them, in my opinion, it seemed]] like the right place to begin.';
const radioC =
  "Over three weekends, I removed [[14|each of the radio's twenty-two old capacitors]] and soldered new ones in their place. [[15|The work was slow. The work was also tedious.]] More than once I had to check a wiring diagram to make sure I had not reversed a connection.";
const radioD =
  'When I finally plugged the radio in and turned the knob, the dial began to glow. At first there was only static. Then, [[16|faint but unmistakable, a baseball game]] crackled through the speaker, and I heard my grandfather laugh from the doorway. [[17|He told me it sounded exactly the way it had when he was a boy.]]';

// --- Bridge competition
const bridgeA =
  'Every spring, engineering students at Riverside Community College compete to build the strongest bridge out of nothing but craft sticks and glue. Each team receives the same materials and the same rules[[19|: the]] bridge must span half a meter and weigh no more than 300 grams.';
const bridgeB =
  "Last year's winning team, [[20|whom]] the judges praised for their careful testing, built a truss design that held 41 kilograms before it snapped. The team's captain explained that [[21|they're]] secret was simple: they tested small sections of the bridge before gluing the full structure together.";
const bridgeC =
  '[1] When a joint failed, the students could see exactly where the weakness was. [2] Testing sections first saved the team both time and materials. [3] They then redesigned only that joint instead of rebuilding the entire bridge. [4] The judges also noted that the team kept a detailed notebook of every test.';
const bridgeD = 'This year, more than thirty teams [[23|has signed]] up for the competition[[24|, which]] will be held in the college gymnasium in April.';

// --- Kettle Lake dark sky
const skyA =
  'Most nights, the sky above Kettle Lake is [[25|really super dark]]. Because the nearest city is more than eighty miles away, very little artificial light reaches the shore. On a clear night, visitors can see thousands of stars and the pale band of the Milky Way stretching from one horizon to the other.';
const skyB =
  "In 2019, a group of residents formed a club to protect that darkness. The club persuaded the town to replace its glaring streetlights with shielded fixtures that point light downward. [[28|Shielded fixtures are also used in many parking lots.]] Since the change, the club's members have counted noticeably more stars from the town beach.";
const skyC =
  "The club also hosts monthly stargazing nights. Members set up telescopes on the beach, and anyone who shows up can take a turn looking at Saturn's rings or the craters of the Moon. Attendance has grown steadily; last August, more than two hundred people came.";

// --- Community kitchen
const kitchenA =
  "On Tuesday evenings, the basement of St. Brigid's Church fills with the smell of onions and garlic. [[30|Volunteers, chopping vegetables at long folding tables while]] a radio plays in the corner. By six o'clock, [[31|the stew is ready, and the doors open]] to anyone who wants a hot meal.";
const kitchenB =
  'The kitchen serves about ninety people each week. [[32|Many of the guests are regulars; others]] come only once or twice. The volunteers make a point of learning names, and they try to remember who likes extra bread and [[33|whom prefers]] a smaller portion.';
const kitchenC =
  "[[34|Running the kitchen costs money, of course.]] Most of the food comes from a regional food bank, but the volunteers also hold a bake sale every fall to pay for spices, cooking oil, and other supplies the food bank does not provide. Last year's bake sale raised \\$1,200, [[35|which was enough to buy supplies for the entire winter]].";

// --- Honeybees
const beeA =
  'Honeybees cannot speak, but they [[36|have a pretty awesome way]] of sharing information. When a forager finds a rich patch of flowers, she returns to the hive and performs what scientists call a waggle dance. The angle of her dance tells the other bees which direction to fly, and the length of each waggle tells them how far to go.';
const beeB =
  'Researchers first decoded the dance by [[38|watching bees very closely and carefully observing them]] inside glass-walled hives. Their work showed that even insects with tiny brains can communicate [[39|complicated]] information.';

// --- Mammoth exhibit
const mammothA =
  'The natural history museum in Coldwater recently unveiled its newest exhibit: a nearly complete skeleton of a woolly mammoth. The bones were discovered by a farmer who was digging a drainage ditch on his property. Paleontologists spent two years cleaning and [[42|piecing together]] the skeleton before it could be displayed.';
const mammothB =
  "The exhibit's designers wanted visitors to [[43|grasp]] the animal's enormous size. They placed the skeleton on a low platform so that children could stand directly beside its curved tusks.";
const mammothC =
  "Reactions to the exhibit have been enthusiastic. One visitor wrote in the museum's guest book that seeing the mammoth up close was [[45|like stepping thousands of years into the past]].";

// --- Millbrook pool
const poolA =
  '[1] The town of Millbrook did not have a public pool until 1998. [2] Before then, children cooled off in the river below the old mill dam. [3] The river was cold and clear, but its current could be dangerous after heavy rains. [4] After a near-drowning in 1996, parents began raising money for a pool.';
const poolB =
  'The pool quickly became the center of summer life in Millbrook. [[47|In contrast,]] the swim team that formed in its first year has won three regional championships.';
const poolC =
  'Each year the pool hosts a festival before it closes for the season. This year the festival will be held [[54|in the month of October, during the fall season,]] and [[55|it will feature a cannonball contest, and also a contest for cannonballs for adults]].';

// --- Hike
const hikeA =
  '[[48|Hiking up the steep trail, the view of the valley]] grew wider with every switchback. We reached the summit at noon[[49| we ate]] lunch on a flat rock that overlooked the lake.';
const hikeB =
  'Neither my sister nor my cousins [[50|was]] tired, so we decided to take the longer loop back to the parking lot. The longer loop passed a waterfall, [[52|a meadow full of wildflowers, and crossing a wooden footbridge]]. By the time we returned to the car, the sun [[53|had already set]].';


// Spots whose original wording is correct but shown with an error, so NO CHANGE is not the key
// too often. Letters in explanations refer to the order before shuffling (remapped after).
const FLIPS: Record<number, Flip> = {
  8: { k: 2, explanation: 'The notes are compared with all of the library\'s resources (more than two), so the superlative "most valuable" is needed. "More valuable" compares only two things, and "valuablest" and "most valuablest" are not standard forms.' },
  11: { k: 1, explanation: '"Bring it back to life" fits the essay\'s personal but not slangy tone and clearly means "make it work again." The original is too slangy, C is stiff and wordy, and D is vague.' },
  12: { k: 1, explanation: 'A colon can introduce an explanation after a complete clause: "most radios of that era fail for the same reason" is complete, and what follows explains the reason. The comma in the original creates a comma splice, C adds an unnecessary comma after "fail," and D puts a semicolon before a dependent "because" clause.' },
  16: { k: 2, explanation: 'The phrase describes the sound of the game, so both words should be adjectives: "faint but unmistakable." The original and B mix an adverb with an adjective, and D places a comma after "game," separating the subject from its verb "crackled."' },
  19: { k: 1, explanation: 'The colon introduces the rules that were just mentioned. The comma in the original creates a comma splice, C leaves out punctuation and creates a run-on, and D makes the sentence ungrammatical with "which the."' },
  20: { k: 1, explanation: 'Inside the clause, the judges praised the team, so the pronoun is the object of "praised" and must be "whom." "Who" is a subject pronoun, "whose" shows possession, and "whomever" means "anyone whom," which does not fit.' },
  31: { k: 2, explanation: 'Two independent clauses joined by "and" take a comma before "and." The original is a comma splice, B puts the comma after "and," and D wrongly separates the subject "stew" from its verb.' },
  39: { k: 1, explanation: 'An adjective is needed to describe the noun "information," and "complicated" is that adjective. The original, "complicatedly," is an adverb; "complication" is a noun; and "complicating" means "making something more complicated."' },
  42: { k: 1, explanation: '"Piecing together" precisely describes fitting bones into place one by one. "Smushing" suggests crushing, "throwing together" suggests a careless job, and "hooking up" is too casual and vague.' },
  53: { k: 1, explanation: 'The sunset happened before a past event (returning to the car), so the past perfect "had already set" is correct. The other choices use present or future tenses that do not fit the past-tense story.' },
};

const items: Authored[] = [
  // Seed library
  { skill: U, d: 1, stimulus: at(seedA, 1), stem: best, choices: [NC, 'nobody was sure', 'nobody have been sure', 'nobody are sure'], answer: 1, explanation: '"Nobody" is a singular pronoun, so it takes the singular verb "was." The other choices pair it with plural verbs ("were," "have been," "are").' },
  { skill: S, d: 2, stimulus: at(seedA, 2), stem: best, choices: [NC, '; its', ", it's", ' its'], answer: 1, explanation: 'Both "The librarians stored the packets in an old wooden card catalog" and "its dozens of small drawers were perfect…" are complete sentences. A comma alone cannot join them (a comma splice), and no punctuation at all makes a run-on. A semicolon correctly joins two independent clauses. "It\'s" means "it is," which makes no sense here.' },
  { skill: ORG, d: 2, stimulus: at(seedB, 3), stem: best, choices: [NC, 'By the second year, for example,', 'By the second year, similarly,', 'By the second year, therefore,'], answer: 0, explanation: 'The first sentence says only a few gardeners borrowed seeds; the next says word had spread. That is a contrast, so "however" fits. "For example" signals an illustration, "similarly" a likeness, and "therefore" a result, none of which matches the shift from few borrowers to many.' },
  { skill: S, d: 2, stimulus: at(seedB, 4), stem: best, choices: [NC, 'volunteered to sort, label, and deliver', 'volunteered sorting, labeling, and to deliver', 'volunteered to sort, labeling, and delivering'], answer: 1, explanation: 'Items in a series should share the same form. "To sort, label, and deliver" keeps all three verbs parallel. The other choices mix forms ("they would also deliver," "sorting… to deliver," "to sort… labeling").' },
  { skill: P, d: 3, stimulus: at(seedB, 5), stem: best, choices: [NC, 'who had first proposed the idea', 'who, had first proposed the idea,', 'who had first proposed, the idea,'], answer: 0, explanation: 'The clause "who had first proposed the idea" adds extra information about Mae Ortiz, so it is set off by a pair of commas. Removing the closing comma (B) leaves the clause unclosed, and the commas in C and D split the clause in the middle.' },
  { skill: TOP, d: 3, stimulus: at(seedC, 6), stem: 'Which choice most effectively introduces the main idea of the paragraph?', choices: [NC, 'The library also lends cake pans and fishing rods.', 'Tomatoes are among the most popular vegetables in home gardens.', 'Many libraries have added new services in recent years.'], answer: 0, explanation: 'The paragraph explains that seeds must be collected at the right time and labeled carefully, which is exactly what "not difficult, but it does require patience" introduces. The other choices drift to unrelated library services, tomatoes in general, or libraries in general.' },
  { skill: TOP, d: 3, stimulus: at(seedC, 7), stem: 'If the writer deleted the underlined sentence, the paragraph would primarily lose:', choices: ['the information that the phrase "These notes" in the next sentence refers to.', 'a description of how tomatoes ripen on the vine.', 'evidence that the seed library has become less popular.', 'a comparison between the seed library and other libraries.'], answer: 0, explanation: 'The next sentence begins "These notes," which only makes sense because the underlined sentence describes the notes gardeners write on each packet. The sentence says nothing about ripening tomatoes, popularity, or other libraries.' },
  { skill: U, d: 1, stimulus: at(seedC, 8), stem: best, choices: [NC, 'most valuablest', 'more valuable', 'valuablest'], answer: 0, explanation: 'The notes are compared with all of the library\'s resources (more than two), so the superlative "most valuable" is correct. "More valuable" compares only two things, and "valuablest" and "most valuablest" are not standard forms.' },
  { skill: ORG, d: 2, stimulus: plain(seedA) + '\n\n' + at(seedD, 9), stem: 'Which choice most effectively concludes the essay by connecting back to its opening?', choices: [NC, 'Gardeners should water seedlings early in the morning.', 'Some libraries also lend tools such as drills and ladders.', 'Four hundred is a large number of varieties to store.'], answer: 0, explanation: 'The essay opens by saying nobody was sure residents would use the seed library. Calling it a project that "began as an uncertain experiment" and is now part of the town\'s rhythm ties the ending to that opening. The other choices add unrelated or obvious details.' },

  // Radio
  { skill: CL, d: 1, stimulus: at(radioA, 10), stem: best, choices: [NC, 'housed in a wooden cabinet', 'housed in a cabinet that was wooden and made of wood', 'housed, in a wooden cabinet,'], answer: 1, explanation: '"Wooden" already says the cabinet is made of wood, so "that was made of wood" is redundant. "Housed in a wooden cabinet" says it once. D adds commas that wrongly separate "housed" from where it was housed.' },
  { skill: ST, d: 2, stimulus: at(radioA, 11), stem: best, choices: [NC, 'resurrect the heck out of it', 'effectuate its restoration to operational status', 'do the radio'], answer: 0, explanation: 'The essay is personal but not slangy, and "bring it back to life" matches that tone while clearly meaning "make it work again." B is too slangy, C is stiff and wordy, and D is vague.' },
  { skill: P, d: 3, stimulus: at(radioB, 12), stem: best, choices: [NC, 'fail for the same reason, their', 'fail, for the same reason: their', 'fail for the same reason; because their'], answer: 0, explanation: 'A colon can introduce an explanation after a complete clause: "most radios of that era fail for the same reason" is complete, and what follows explains the reason. A comma (B) creates a comma splice, C adds an unnecessary comma, and D puts a semicolon before a dependent "because" clause.' },
  { skill: S, d: 3, stimulus: at(radioB, 13), stem: best, choices: [NC, 'Replacing them seemed', 'Replacing them, it seemed', 'Having replaced them, it seemed'], answer: 1, explanation: '"Replacing them" is already the subject of the sentence, so adding "it" gives the verb "seemed" two subjects. "Replacing them seemed like the right place to begin" is clear and correct. D also changes the meaning, since the narrator had not yet replaced anything.' },
  { skill: P, d: 2, stimulus: at(radioC, 14), stem: best, choices: [NC, "each of the radios twenty-two old capacitors", "each of the radios' twenty-two old capacitors", "each of the radio's twenty-two old capacitor's"], answer: 0, explanation: "The capacitors belong to one radio, so the singular possessive \"radio's\" is correct. \"Radios\" has no apostrophe, \"radios'\" is plural possessive (more than one radio), and \"capacitor's\" wrongly adds an apostrophe to a plural noun." },
  { skill: CL, d: 2, stimulus: at(radioC, 15), stem: best, choices: [NC, 'The work was slow and tedious.', 'The work was slow, the work was tedious.', 'The work, being slow, was also being tedious.'], answer: 1, explanation: 'Repeating "The work was" is wordy; combining the ideas into "slow and tedious" says the same thing once. C is a comma splice, and D is awkward and wordy.' },
  { skill: U, d: 4, stimulus: at(radioD, 16), stem: best, choices: [NC, 'faint but unmistakably, a baseball game', 'faintly but unmistakable, a baseball game', 'faintly but unmistakably a baseball game,'], answer: 0, explanation: 'The phrase describes the sound of the game, so both words should be adjectives: "faint but unmistakable." B and C mix an adjective with an adverb, and D places the comma after "game," separating the subject from its verb "crackled."' },
  { skill: TOP, d: 4, stimulus: at(radioD, 17), stem: 'The writer is considering deleting the underlined sentence. Should the sentence be kept or deleted?', choices: ["Kept, because it shows the personal meaning the restored radio holds for the narrator's grandfather.", 'Kept, because it explains how the narrator replaced the capacitors.', 'Deleted, because it repeats information stated earlier in the paragraph.', 'Deleted, because it shifts the focus of the paragraph from the radio to baseball.'], answer: 0, explanation: "The sentence completes the moment by showing why the repair mattered to the grandfather, which fits the essay's personal focus. It says nothing about capacitors, it repeats nothing, and it is about the radio, not baseball." },

  // Bridge
  { skill: P, d: 2, stimulus: at(bridgeA, 19), stem: best, choices: [NC, ', the', ' the', ', which the'], answer: 0, explanation: 'The colon introduces the rules that were just mentioned. A comma (B) creates a comma splice, no punctuation (C) creates a run-on, and "which the" (D) makes the sentence ungrammatical.' },
  { skill: U, d: 4, stimulus: at(bridgeB, 20), stem: best, choices: [NC, 'who', 'whose', 'whomever'], answer: 0, explanation: 'Inside the clause, the judges praised the team, so the pronoun is the object of "praised": "whom." "Who" is a subject pronoun, "whose" shows possession, and "whomever" means "any person who."' },
  { skill: U, d: 1, stimulus: at(bridgeB, 21), stem: best, choices: [NC, 'their', 'there', "there's"], answer: 1, explanation: 'The secret belongs to the team, so the possessive "their" is needed. "They\'re" means "they are," "there" refers to a place, and "there\'s" means "there is."' },
  { skill: ORG, d: 4, stimulus: bridgeC, stem: 'For the sake of logic and cohesion, Sentence 1 should be placed:', choices: ['where it is now.', 'after Sentence 2.', 'after Sentence 3.', 'after Sentence 4.'], answer: 1, explanation: 'Sentence 2 states the main point (testing sections saved time and materials). Sentence 1 then describes a joint failing, and Sentence 3 says the team redesigned "only that joint," which needs Sentence 1 right before it. So Sentence 1 belongs after Sentence 2.' },
  { skill: U, d: 2, stimulus: at(bridgeD, 23), stem: best, choices: [NC, 'have signed', 'signs', 'is signing'], answer: 1, explanation: 'The subject "teams" is plural, so it needs the plural verb "have signed." The other choices are singular.' },
  { skill: P, d: 3, stimulus: at(bridgeD, 24), stem: best, choices: [NC, ', that', ', who', ', it'], answer: 0, explanation: 'The clause adds extra information about the competition, so it is set off by a comma and begins with "which." "That" is not used after a comma to begin this kind of clause, "who" refers to people, and ", it" creates a comma splice.' },

  // Sky
  { skill: ST, d: 2, stimulus: at(skyA, 25), stem: best, choices: [NC, 'remarkably dark', 'dark-ish, kind of', 'of a darkness that is dark'], answer: 1, explanation: 'The rest of the essay uses a clear, informative tone. "Remarkably dark" fits that tone and is precise. "Really super" and "dark-ish, kind of" are too casual, and D is wordy and repetitive.' },
  { skill: TOP, d: 3, stimulus: at(skyB, 28), stem: 'The writer is considering deleting the underlined sentence. Should the sentence be kept or deleted?', choices: ['Kept, because it explains why the town chose shielded fixtures.', 'Kept, because it provides evidence that the night sky has improved.', "Deleted, because it adds a detail that distracts from the paragraph's focus on the club's work at Kettle Lake.", 'Deleted, because it contradicts the previous sentence.'], answer: 2, explanation: "The paragraph is about what the club did and what changed at Kettle Lake. Where else shielded fixtures are used is off topic. The sentence gives no reason for the town's choice, no evidence about the sky, and does not contradict anything." },
  { skill: TOP, d: 4, stimulus: [plain(skyA), plain(skyB), skyC].join('\n\n'), stem: "Suppose the writer's primary purpose had been to explain how light pollution affects wildlife. Would this essay accomplish that purpose?", choices: ['Yes, because it describes how little artificial light reaches the shore of Kettle Lake.', 'Yes, because it explains why the town replaced its streetlights.', "No, because it focuses on residents' efforts to keep the sky dark and share it with visitors, not on wildlife.", 'No, because it argues that streetlights should be removed from all towns.'], answer: 2, explanation: 'The essay describes the dark sky, the club that protects it, and its stargazing nights. Animals are never mentioned. D is wrong because the essay never argues for removing streetlights everywhere; the town replaced them with shielded fixtures.' },

  // Kitchen
  { skill: S, d: 3, stimulus: at(kitchenA, 30), stem: best, choices: [NC, 'Volunteers chop vegetables at long folding tables while', 'Volunteers chopping vegetables at long folding tables, while', 'Volunteers, who chop vegetables at long folding tables while'], answer: 1, explanation: 'As written, the sentence has no main verb ("Volunteers, chopping…" is a fragment). "Volunteers chop vegetables" gives the subject a verb. C and D are still fragments: "chopping" is not a main verb, and "who chop" begins a clause that describes the volunteers without completing the sentence.' },
  { skill: P, d: 2, stimulus: at(kitchenA, 31), stem: best, choices: [NC, 'the stew is ready and, the doors open', 'the stew is ready, the doors open', 'the stew, is ready and the doors open'], answer: 0, explanation: 'Two independent clauses joined by "and" take a comma before "and." B puts the comma after "and," C is a comma splice, and D wrongly separates the subject "stew" from its verb.' },
  { skill: P, d: 3, stimulus: at(kitchenB, 32), stem: best, choices: [NC, 'Many of the guests are regulars, others', 'Many of the guests are regulars others', 'Many of the guests are regulars; while others'], answer: 0, explanation: 'Each side of the semicolon is a complete sentence, so the semicolon is correct. A comma alone (B) is a comma splice, no punctuation (C) is a run-on, and D puts a semicolon before a dependent clause beginning with "while."' },
  { skill: U, d: 4, stimulus: at(kitchenB, 33), stem: best, choices: [NC, 'who prefers', 'whom prefer', 'who prefer'], answer: 1, explanation: 'The pronoun is the subject of "prefers," so it must be "who," and it refers to one guest, matching "who likes." "Whom" is an object pronoun, and "prefer" is plural.' },
  { skill: ORG, d: 2, stimulus: plain(kitchenB) + '\n\n' + at(kitchenC, 34), stem: 'Which choice provides the most effective transition from the previous paragraph to this one?', choices: [NC, 'The guests seem to enjoy the stew.', 'Onions and garlic are healthy foods.', 'Some volunteers have worked at the kitchen for years.'], answer: 0, explanation: 'The new paragraph is about paying for food and supplies. "Running the kitchen costs money, of course" moves from the guests to that topic. The other sentences do not lead into the discussion of money.' },
  { skill: CL, d: 3, stimulus: at(kitchenC, 35), stem: best, choices: [NC, 'which was enough to buy supplies for the entire winter season of the whole winter', 'which, being enough, bought supplies enough for the entire winter', 'enough to buy, for the entire winter, supplies'], answer: 0, explanation: 'The original is clear and concise. B repeats "winter," C is awkward and repeats "enough," and D scrambles the word order so the meaning is hard to follow.' },

  // Bees
  { skill: ST, d: 1, stimulus: at(beeA, 36), stem: best, choices: [NC, 'have a remarkable way', 'got a super cool way', 'have a way that is totally way cool'], answer: 1, explanation: 'The passage explains science in a clear, informative tone. "Have a remarkable way" matches it. The other choices are too casual for this essay.' },
  { skill: CL, d: 2, stimulus: at(beeB, 38), stem: best, choices: [NC, 'closely watching bees', 'watching bees very closely and carefully, observing them closely', 'carefully observing and watching bees very closely'], answer: 1, explanation: '"Watching… closely" and "carefully observing" say the same thing. "Closely watching bees" states it once. C and D still repeat the idea.' },
  { skill: U, d: 2, stimulus: at(beeB, 39), stem: best, choices: [NC, 'complicatedly', 'complication', 'complicating'], answer: 0, explanation: 'An adjective is needed to describe the noun "information," and "complicated" is that adjective. "Complicatedly" is an adverb, "complication" is a noun, and "complicating" means "making something more complicated."' },

  // Mammoth
  { skill: ST, d: 2, stimulus: at(mammothA, 42), stem: best, choices: [NC, 'smushing together', 'throwing together', 'hooking up'], answer: 0, explanation: '"Piecing together" precisely describes fitting bones into place one by one. "Smushing" suggests crushing, "throwing together" suggests a careless job, and "hooking up" is too casual and vague.' },
  { skill: ST, d: 3, stimulus: at(mammothB, 43), stem: best, choices: [NC, 'clutch', 'grip', 'seize'], answer: 0, explanation: 'Here "grasp" means "understand," which fits the designers\' goal of helping visitors understand the mammoth\'s size. "Clutch," "grip," and "seize" all mean physically holding something, which does not make sense here.' },
  { skill: ST, d: 2, stimulus: at(mammothC, 45), stem: best, choices: [NC, 'like, whoa, a total time trip', 'similar to a temporal relocation of an extended duration', 'kind of old'], answer: 0, explanation: 'The original is vivid and fits the essay\'s tone. B is slangy, C is stiff and wordy, and D is vague and too casual.' },

  // Pool
  { skill: ORG, d: 3, stimulus: poolA, stem: 'The writer wants to add this sentence to the paragraph:\n\nThe fundraising took two years, and the pool opened the summer the campaign ended.\n\nThe sentence would most logically be placed:', choices: ['after Sentence 1.', 'after Sentence 2.', 'after Sentence 3.', 'after Sentence 4.'], answer: 3, explanation: '"The fundraising" refers to the money parents began raising in Sentence 4, so the new sentence must come after it. It also completes the timeline: the near-drowning in 1996, two years of fundraising, and the pool opening in 1998.' },
  { skill: ORG, d: 3, stimulus: at(poolB, 47), stem: best, choices: [NC, 'Indeed,', 'Nevertheless,', 'Instead,'], answer: 1, explanation: "The swim team's success supports the claim that the pool became the center of summer life, so a transition that reinforces the point, \"Indeed,\" fits. \"In contrast,\" \"Nevertheless,\" and \"Instead\" all signal a contrast that isn't there." },
  { skill: TOP, d: 3, stimulus: 'The pool quickly became the center of summer life in Millbrook. Indeed, the swim team that formed in its first year has won three regional championships.', stem: 'The writer wants to add a sentence after the first sentence that best supports the claim that the pool became the center of summer life. Which choice best accomplishes this goal?', choices: ['On hot afternoons, it seemed as if half the town was splashing in the water or picnicking on the lawn beside it.', 'The pool is 25 meters long and 4 meters deep at one end.', 'Chlorine helps keep pool water clean.', 'The pool closes each year at the end of the summer.'], answer: 0, explanation: 'Describing half the town spending hot afternoons at the pool directly supports the claim that it was the center of summer life. Its size, chlorine, and its closing date say nothing about how central it was to the town.' },
  { skill: CL, d: 1, stimulus: at(poolC, 54), stem: best, choices: [NC, 'in October', 'in the fall month of October season', 'during October in the autumn of the fall'], answer: 1, explanation: 'October is a fall month, so "in the month of October, during the fall season" says the same thing twice. "In October" is clear and concise.' },
  { skill: CL, d: 3, stimulus: at(poolC, 55), stem: best, choices: [NC, 'will feature cannonball contests for both children and adults', 'it features cannonball contests, contests for both adults and children, and cannonballs', 'featuring for adults and children cannonball contests'], answer: 1, explanation: 'The original repeats "contest" and "cannonball" awkwardly. "Will feature cannonball contests for both children and adults" is concise and keeps the verb in the same tense as "will be held." C is repetitive and changes the tense, and D has a scrambled word order.' },

  // Hike
  { skill: S, d: 4, stimulus: at(hikeA, 48), stem: best, choices: [NC, 'As we hiked up the steep trail, the view of the valley', 'Hiking up the steep trail the view of the valley', 'The view of the valley, hiking up the steep trail,'], answer: 1, explanation: 'As written, "Hiking up the steep trail" seems to describe "the view," which cannot hike (a dangling modifier). "As we hiked up the steep trail" names who was hiking. C and D still make the view do the hiking.' },
  { skill: S, d: 2, stimulus: at(hikeA, 49), stem: best, choices: [NC, ', where we ate', ' we were eating', ', we ate'], answer: 1, explanation: 'As written, two complete sentences run together. ", where we ate" turns the second part into a clause describing the summit. C is still a run-on, and D joins the sentences with only a comma (a comma splice).' },
  { skill: U, d: 4, stimulus: at(hikeB, 50), stem: best, choices: [NC, 'were', 'is', 'has been'], answer: 1, explanation: 'With "neither… nor," the verb agrees with the nearer subject. "Cousins" is plural, so the verb is "were." The other choices are singular.' },
  { skill: S, d: 3, stimulus: at(hikeB, 52), stem: best, choices: [NC, 'a meadow full of wildflowers, and a wooden footbridge', 'a meadow full of wildflowers, and it crossed a wooden footbridge', 'full of wildflowers in a meadow, and crossing a wooden footbridge'], answer: 1, explanation: 'The loop passed three things, so all three should be nouns: "a waterfall, a meadow…, and a wooden footbridge." The other choices break the parallel list with a verb phrase or a clause.' },
  { skill: U, d: 3, stimulus: at(hikeB, 53), stem: best, choices: [NC, 'has already set', 'already sets', 'will have already set'], answer: 0, explanation: 'The sunset happened before a past event (returning to the car), so the past perfect "had already set" is correct. The other choices use present or future tenses that do not fit the past-tense story.' },
];

const PASSAGES = [seedA, seedB, seedC, seedD, radioA, radioB, radioC, radioD, bridgeA, bridgeB, bridgeC, bridgeD, skyA, skyB, skyC, kitchenA, kitchenB, kitchenC, beeA, beeB, mammothA, mammothB, mammothC, poolA, poolB, poolC, hikeA, hikeB];

export default shuffledNoChange(finalize(items, PASSAGES, FLIPS));
