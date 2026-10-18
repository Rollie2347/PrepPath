// ACT Science, set 2. Original passages written for PrepPath (Claude Code session, 2026-10-17).
// Experiments, places and data are invented but physically plausible: amylase pH/temperature
// optimum near 7 and 37°C with denaturation at 70°C, constant coefficient of restitution per
// surface, an ocean oxygen-minimum zone near 500 m, and electromagnet strength rising with turns
// and voltage and with ferromagnetic cores only.
import type { Authored } from '../pipeline/ingest';

import { shuffled } from './helpers';

const LOCATE = 'act.sci.iod.locate';
const INFER = 'act.sci.iod.infer';
const EXTEND = 'act.sci.iod.extend';
const S_LOCATE = 'act.sci.sin.locate';
const DESIGN = 'act.sci.sin.design';
const S_EXTEND = 'act.sci.sin.extend';
const S_EDT = 'act.sci.sin.edt';
const RESULTS = 'act.sci.eam.results';
const COMPARE = 'act.sci.eam.models_compare';
const M_EXTEND = 'act.sci.eam.models_extend';
const E_EDT = 'act.sci.eam.edt';

const filters = `Students built gravity water filters from plastic bottles to clean muddy water. Their design criteria were:

- Output turbidity of 5 NTU or less (turbidity measures cloudiness; lower values mean clearer water)
- Flow rate of at least 100 mL/min
- Cost of no more than 6 dollars

Every filter had the same total depth of filter material (20 cm) and was tested with the same muddy water, which had a turbidity of 120 NTU. Table 1 shows the results.

Table 1

| Filter | Layers (top to bottom) | Output turbidity (NTU) | Flow rate (mL/min) | Cost (dollars) |
|---|---|---|---|---|
| 1 | Gravel only | 64 | 410 | 1 |
| 2 | Gravel, coarse sand | 18 | 240 | 2 |
| 3 | Gravel, coarse sand, fine sand | 4 | 130 | 3 |
| 4 | Gravel, coarse sand, fine sand, activated charcoal | 2 | 85 | 7 |
| 5 | Fine sand only | 3 | 40 | 2 |`;

const amylase = `Amylase is an enzyme that breaks down starch. Iodine solution turns blue-black when starch is present and stays brown when no starch remains. In each trial, students mixed amylase with a starch solution, tested drops of the mixture with iodine every minute, and recorded the time until no starch remained.

Experiment 1

Trials were run at 37°C. The pH of the mixture was varied (see Table 1).

Table 1

| pH | Time until no starch remained (min) |
|---|---|
| 3 | Starch still present after 30 |
| 5 | 12 |
| 6 | 6 |
| 7 | 4 |
| 8 | 7 |
| 9 | 15 |

Experiment 2

Trials were run at pH 7. The temperature was varied (see Table 2).

Table 2

| Temperature (°C) | Time until no starch remained (min) |
|---|---|
| 10 | 20 |
| 25 | 9 |
| 37 | 4 |
| 50 | 6 |
| 70 | Starch still present after 30 |`;

const bounce = `Students dropped the same rubber ball from four heights onto three different surfaces and measured the height of the ball's first bounce. Table 1 shows the average of five drops for each combination.

Table 1

| Drop height (cm) | Bounce on concrete (cm) | Bounce on wood (cm) | Bounce on carpet (cm) |
|---|---|---|---|
| 50 | 40 | 34 | 18 |
| 100 | 79 | 67 | 35 |
| 150 | 118 | 101 | 53 |
| 200 | 158 | 134 | 70 |`;

const seeds = `Students studied how temperature and watering affect the germination (sprouting) of bean seeds. In every trial, 50 seeds were planted in a tray of the same potting soil. After 10 days, the students recorded the percent of seeds that had germinated.

Experiment 1

Each tray received 20 mL of water per day. The trays were kept at different temperatures (see Table 1).

Table 1

| Temperature (°C) | Germination (%) |
|---|---|
| 10 | 12 |
| 15 | 46 |
| 20 | 78 |
| 25 | 92 |
| 30 | 88 |
| 35 | 54 |

Experiment 2

All trays were kept at 25°C. The amount of water given each day was varied (see Table 2).

Table 2

| Water per day (mL) | Germination (%) |
|---|---|
| 0 | 0 |
| 10 | 64 |
| 20 | 92 |
| 40 | 90 |
| 80 | 38 |`;

const rail = `The Kestrel Island rail, a flightless bird found only on Kestrel Island, was common when sailors first visited the island in 1820. By 1900 it was extinct. Records show that sailors released goats on the island in 1830 and that ship rats reached the island around 1860. Forest covered about 80% of the island in 1830 but only 20% in 1900. Three students explain the extinction.

Student 1

Rats caused the extinction. Rats eat the eggs and chicks of ground-nesting birds. The rail nested on the ground and had evolved with no mammal predators, so it had no defenses against rats. Bird counts recorded by visiting naturalists fell slowly from 1830 to 1860 and then fell sharply after 1860.

Student 2

Goats caused the extinction by destroying the forest. The rail fed on insects in the leaf litter on the forest floor and hid from storms in dense undergrowth. As goats ate seedlings and stripped bark from trees, the forest shrank, and the rail lost its food and shelter.

Student 3

Both goats and rats caused the extinction. Goats shrank the forest and reduced the rail to a small, scattered population. Rats then destroyed most of the remaining nests. Neither goats alone nor rats alone would have caused the rail's extinction by 1900.`;

const turbines = `Students designed rotors for a small wind turbine and tested them in a wind tunnel. Their design criteria were:

- Power output of at least 1.5 W at a wind speed of 6 m/s
- Rotor mass of no more than 150 g
- Blades that bend no more than 5 mm at a wind speed of 10 m/s (a safety test)

All blades were made of the same plastic and had the same shape. Table 1 shows the results.

Table 1

| Rotor | Number of blades | Blade length (cm) | Power at 6 m/s (W) | Mass (g) | Bend at 10 m/s (mm) |
|---|---|---|---|---|---|
| P | 2 | 20 | 1.2 | 90 | 3 |
| Q | 3 | 20 | 1.6 | 120 | 3 |
| R | 3 | 25 | 2.1 | 160 | 6 |
| S | 4 | 20 | 1.7 | 150 | 2 |
| T | 6 | 20 | 1.5 | 210 | 2 |`;

const ocean = `A research ship measured water temperature and dissolved oxygen at several depths at one location in the open ocean. Table 1 shows the results.

Table 1

| Depth (m) | Temperature (°C) | Dissolved oxygen (mg/L) |
|---|---|---|
| 0 | 24 | 6.8 |
| 100 | 19 | 6.1 |
| 300 | 11 | 3.2 |
| 500 | 8 | 1.9 |
| 800 | 6 | 2.6 |
| 1,200 | 4 | 3.9 |`;

const magnets = `Students built electromagnets by wrapping insulated copper wire around a core and connecting the wire to a battery pack. They measured the strength of each electromagnet by counting how many identical steel paper clips it could lift at once.

Experiment 1

An iron nail was used as the core, and the voltage was 3.0 V. The number of turns of wire was varied (see Table 1).

Table 1

| Turns of wire | Paper clips lifted |
|---|---|
| 10 | 3 |
| 20 | 7 |
| 40 | 13 |
| 80 | 25 |

Experiment 2

An iron nail was used as the core, with 40 turns of wire. The voltage was varied (see Table 2).

Table 2

| Voltage (V) | Paper clips lifted |
|---|---|
| 1.5 | 6 |
| 3.0 | 13 |
| 4.5 | 19 |
| 6.0 | 26 |

Experiment 3

Each core had 40 turns of wire, and the voltage was 3.0 V. The core material was varied (see Table 3).

Table 3

| Core | Paper clips lifted |
|---|---|
| Iron nail | 13 |
| Steel bolt | 10 |
| Aluminum rod | 0 |
| Wooden dowel | 0 |`;

const items: Authored[] = [
  // Filters
  { skill: S_EDT, d: 2, stimulus: filters, stem: 'Which filters met the turbidity criterion?', choices: ['Filters 3, 4, and 5 only', 'Filters 1 and 2 only', 'Filter 4 only', 'Filters 1, 2, 3, 4, and 5'], answer: 0, explanation: 'The criterion is 5 NTU or less. Filters 3 (4 NTU), 4 (2 NTU), and 5 (3 NTU) met it; Filters 1 (64 NTU) and 2 (18 NTU) did not.' },
  { skill: S_EDT, d: 3, stimulus: filters, stem: 'Which filter met all three design criteria?', choices: ['Filter 3', 'Filter 4', 'Filter 5', 'Filter 2'], answer: 0, explanation: 'Filter 3 produced 4 NTU, flowed at 130 mL/min, and cost 3 dollars. Filter 4 was too slow and too expensive, Filter 5 was too slow, and Filter 2 left the water too cloudy.' },
  { skill: E_EDT, d: 3, stimulus: filters, stem: 'Compared with Filter 2, adding a fine sand layer (Filter 3):', choices: ['lowered the output turbidity but also lowered the flow rate.', 'raised both the output turbidity and the flow rate.', 'lowered the flow rate without changing the turbidity.', 'had no effect on either turbidity or flow rate.'], answer: 0, explanation: 'Turbidity dropped from 18 to 4 NTU, and flow rate dropped from 240 to 130 mL/min.' },
  { skill: E_EDT, d: 4, stimulus: filters, stem: 'Based on Filters 1 through 4, which trade-off do the data show?', choices: ['Adding more layers made the water clearer but slowed the flow.', 'Adding more layers made the water cloudier but sped up the flow.', 'Adding more layers lowered the cost and sped up the flow.', 'Adding more layers changed neither clarity nor flow.'], answer: 0, explanation: 'From Filter 1 to Filter 4, turbidity fell (64, 18, 4, 2 NTU) while flow rate also fell (410, 240, 130, 85 mL/min), and cost rose.' },
  { skill: E_EDT, d: 3, stimulus: filters, stem: 'If producing the clearest water were the only goal, with no limits on flow rate or cost, which filter would be the best choice?', choices: ['Filter 4', 'Filter 3', 'Filter 5', 'Filter 1'], answer: 0, explanation: 'Filter 4 produced the lowest output turbidity, 2 NTU.' },
  { skill: DESIGN, d: 3, stimulus: filters, stem: 'Why did the students use the same muddy water and the same total depth of filter material for every filter?', choices: ['So that differences in results would be due to the layer materials', 'So that every filter would cost the same', 'So that every filter would have the same flow rate', 'So that the output water would always be clear'], answer: 0, explanation: 'Holding the input water and total depth constant means the differences in turbidity and flow come from which materials were used. The filters still differed in cost and flow.' },
  { skill: S_EDT, d: 3, stimulus: filters, stem: 'Filter 5 produced clear water. Why did it fail to meet all of the criteria?', choices: ['Its flow rate was below 100 mL/min.', 'Its cost was above 6 dollars.', 'Its output turbidity was above 5 NTU.', 'It used more than 20 cm of material.'], answer: 0, explanation: 'Filter 5 met the turbidity (3 NTU) and cost (2 dollars) limits, but its flow rate of 40 mL/min was below the 100 mL/min minimum.' },
  { skill: S_EDT, d: 4, stimulus: filters, stem: 'The students build a Filter 6 with a layer of gravel on top of a layer of fine sand (no coarse sand). Based on the data, its output turbidity would most likely be:', choices: ['less than 18 NTU.', 'greater than 64 NTU.', 'between 64 NTU and 120 NTU.', 'exactly 120 NTU.'], answer: 0, explanation: 'Every filter that included fine sand (Filters 3, 4, and 5) produced 4 NTU or less, and gravel and coarse sand alone gave 18 NTU. A filter with fine sand would most likely be clearer than 18 NTU.' },
  { skill: E_EDT, d: 4, stimulus: filters, stem: 'Which statement about cost is supported by Table 1?', choices: ['Adding activated charcoal to Filter 3\'s design more than doubled the cost.', 'Filter 1 was the most expensive filter.', 'Every filter cost the same amount.', 'Fine sand was the most expensive material.'], answer: 0, explanation: 'Filter 3 cost 3 dollars; Filter 4, which adds activated charcoal to Filter 3\'s layers, cost 7 dollars, more than double. Filter 1 was the cheapest.' },

  // Amylase
  { skill: S_LOCATE, d: 2, stimulus: amylase, stem: 'In Experiment 2, which variable was held constant?', choices: ['pH', 'Temperature', 'Time until no starch remained', 'Color of the iodine'], answer: 0, explanation: 'Experiment 2 ran every trial at pH 7 and varied the temperature.' },
  { skill: S_LOCATE, d: 3, stimulus: amylase, stem: 'Which conditions appear in both Experiment 1 and Experiment 2?', choices: ['pH 7 at 37°C', 'pH 5 at 25°C', 'pH 9 at 50°C', 'pH 3 at 70°C'], answer: 0, explanation: 'Experiment 1 was run at 37°C and includes pH 7; Experiment 2 was run at pH 7 and includes 37°C. Both trials took 4 minutes.' },
  { skill: LOCATE, d: 1, stimulus: amylase, stem: 'In Experiment 1, how long did it take for no starch to remain at pH 6?', choices: ['6 min', '4 min', '7 min', '12 min'], answer: 0, explanation: 'Table 1 lists 6 minutes for pH 6.' },
  { skill: DESIGN, d: 3, stimulus: amylase, stem: 'Why did the students test drops of the mixture with iodine?', choices: ['To detect whether any starch remained', 'To change the pH of the mixture', 'To speed up the breakdown of starch', 'To keep the temperature constant'], answer: 0, explanation: 'Iodine turns blue-black when starch is present, so it showed when the starch was gone.' },
  { skill: DESIGN, d: 4, stimulus: amylase, stem: 'Which additional trial would best show that the amylase, rather than the water or the pH, is responsible for breaking down the starch?', choices: ['Starch solution at pH 7 and 37°C with no amylase added', 'Amylase at pH 7 and 37°C with no starch added', 'Starch and amylase at pH 7 and 100°C', 'Starch and amylase at pH 7 and 37°C, tested every 2 minutes'], answer: 0, explanation: 'A control without amylase under the same conditions shows whether starch disappears without the enzyme. If it remains, the amylase is responsible.' },
  { skill: S_EXTEND, d: 3, stimulus: amylase, stem: 'If a trial in Experiment 1 had been run at pH 6.5, the time until no starch remained would most likely have been:', choices: ['between 4 min and 6 min.', 'less than 4 min.', 'between 6 min and 12 min.', 'more than 30 min.'], answer: 0, explanation: 'pH 6.5 lies between pH 6 (6 min) and pH 7 (4 min), so the time would most likely fall between 4 and 6 minutes.' },
  { skill: S_EXTEND, d: 4, stimulus: amylase, stem: 'If Experiment 1 were repeated at 25°C instead of 37°C, the time at pH 7 would most likely be about:', choices: ['9 min.', '4 min.', '20 min.', 'more than 30 min.'], answer: 0, explanation: 'Experiment 2 already measured pH 7 at 25°C: 9 minutes.' },
  { skill: RESULTS, d: 3, stimulus: amylase, stem: 'Which conclusion is best supported by both experiments?', choices: ['The amylase broke down starch fastest near pH 7 and 37°C.', 'The amylase worked fastest at pH 3 and 70°C.', 'The amylase worked equally fast at every pH.', 'Temperature had no effect on the amylase.'], answer: 0, explanation: 'The shortest time in each experiment, 4 minutes, occurred at pH 7 and at 37°C. At pH 3 and at 70°C, starch was still present after 30 minutes.' },
  { skill: RESULTS, d: 4, stimulus: amylase, stem: 'A student claims the data prove that heating amylase to 70°C permanently destroys it. Is the claim justified by these experiments alone?', choices: ['No; the data show no starch breakdown at 70°C, but not whether the amylase works again after cooling.', 'Yes; the amylase took 4 minutes at 70°C.', 'Yes; the amylase worked fastest at 70°C.', 'No; the amylase broke down starch faster at 70°C than at 37°C.'], answer: 0, explanation: 'At 70°C the starch was still present after 30 minutes, so the enzyme did not work at that temperature. To show the damage is permanent, the students would need to cool the enzyme and test it again.' },
  { skill: EXTEND, d: 3, stimulus: amylase, stem: 'Based on Experiment 2, at 30°C the time until no starch remained would most likely be between:', choices: ['4 min and 9 min.', '9 min and 20 min.', '4 min and 6 min.', '20 min and 30 min.'], answer: 0, explanation: '30°C lies between 25°C (9 min) and 37°C (4 min).' },

  // Bounce
  { skill: LOCATE, d: 1, stimulus: bounce, stem: 'According to Table 1, how high did the ball bounce on wood when dropped from 150 cm?', choices: ['101 cm', '118 cm', '53 cm', '134 cm'], answer: 0, explanation: 'The 150 cm row lists a bounce of 101 cm on wood.' },
  { skill: LOCATE, d: 2, stimulus: bounce, stem: 'Which surface produced the lowest bounce at every drop height?', choices: ['Carpet', 'Concrete', 'Wood', 'Concrete and wood equally'], answer: 0, explanation: 'At each drop height, the carpet bounce (18, 35, 53, 70 cm) was the lowest of the three surfaces.' },
  { skill: INFER, d: 3, stimulus: bounce, stem: 'On concrete, the bounce height was about what fraction of the drop height?', choices: ['0.8', '0.35', '0.67', '1.2'], answer: 0, explanation: 'For example, 79 ÷ 100 = 0.79 and 158 ÷ 200 = 0.79, so the bounce was about 0.8 of the drop height. 0.67 and 0.35 match wood and carpet.', check: 'Math.abs(158/200 - 0.8) < 0.02 && Math.abs(40/50 - 0.8) < 0.02' },
  { skill: INFER, d: 2, stimulus: bounce, stem: 'For each surface, as the drop height increased, the bounce height:', choices: ['increased.', 'decreased.', 'stayed the same.', 'increased and then decreased.'], answer: 0, explanation: 'On every surface, the bounce height rose with each increase in drop height.' },
  { skill: EXTEND, d: 3, stimulus: bounce, stem: 'If the ball were dropped onto concrete from 250 cm, its bounce height would most likely be about:', choices: ['198 cm', '158 cm', '250 cm', '316 cm'], answer: 0, explanation: 'The concrete bounce is about 0.79 of the drop height, and 0.79 × 250 ≈ 198 cm. A bounce cannot exceed the drop height.', check: 'Math.abs(0.79*250 - 198) < 1' },
  { skill: EXTEND, d: 4, stimulus: bounce, stem: 'When dropped from 100 cm onto a fourth surface, the ball bounced 50 cm. Compared with the three tested surfaces, the fourth surface produced a bounce:', choices: ['higher than carpet but lower than wood.', 'higher than concrete.', 'lower than carpet.', 'between wood and concrete.'], answer: 0, explanation: 'From 100 cm, carpet gave 35 cm and wood gave 67 cm. A 50 cm bounce falls between them.' },
  { skill: RESULTS, d: 4, stimulus: bounce, stem: 'A student hypothesizes that softer surfaces absorb more of the ball\'s energy, producing lower bounces. If carpet is the softest surface and concrete is the hardest, do the data support this hypothesis?', choices: ['Yes; carpet produced the lowest bounces and concrete produced the highest.', 'No; carpet produced the highest bounces.', 'No; all three surfaces produced the same bounce.', 'Yes; wood produced the lowest bounces.'], answer: 0, explanation: 'At every height, carpet gave the lowest bounce, wood the middle, and concrete the highest, matching the order from softest to hardest.' },

  // Seeds
  { skill: S_LOCATE, d: 2, stimulus: seeds, stem: 'Which factor was held constant in Experiment 1?', choices: ['The amount of water given per day', 'The temperature', 'The percent of seeds that germinated', 'The number of days before germination'], answer: 0, explanation: 'In Experiment 1, each tray received 20 mL of water per day while the temperature varied.' },
  { skill: S_LOCATE, d: 3, stimulus: seeds, stem: 'Which trial in Experiment 2 had the same conditions as one of the trials in Experiment 1?', choices: ['The trial with 20 mL of water per day', 'The trial with 0 mL of water per day', 'The trial with 40 mL of water per day', 'The trial with 80 mL of water per day'], answer: 0, explanation: 'Experiment 2 was run at 25°C; the 20 mL trial matches Experiment 1\'s 25°C trial, which also used 20 mL. Both gave 92% germination.' },
  { skill: S_LOCATE, d: 1, stimulus: seeds, stem: 'How many seeds were planted in each trial?', choices: ['50', '10', '20', '92'], answer: 0, explanation: 'The passage states that "in every trial, 50 seeds were planted."' },
  { skill: DESIGN, d: 3, stimulus: seeds, stem: 'Why did the students plant 50 seeds in each trial rather than a single seed?', choices: ['To reduce the effect of differences among individual seeds on the results', 'To make the seeds germinate faster', 'To keep the temperature of the soil constant', 'To use more water in each tray'], answer: 0, explanation: 'Individual seeds vary; one seed might fail for reasons unrelated to the conditions. A percent based on 50 seeds is more reliable.' },
  { skill: DESIGN, d: 4, stimulus: seeds, stem: 'To test whether light affects germination, the students should:', choices: ['keep trays at 25°C with 20 mL of water per day, placing some in light and some in darkness.', 'keep all trays in darkness at different temperatures.', 'give trays in light more water than trays in darkness.', 'plant different numbers of seeds in light and in darkness.'], answer: 0, explanation: 'Light must be the only difference between groups. The other procedures change temperature, water, or seed count along with light, or do not vary light at all.' },
  { skill: DESIGN, d: 3, stimulus: seeds, stem: 'Why did the students use the same type of potting soil in every tray?', choices: ['So that differences in germination would be due to the variables being tested', 'So that the seeds would all germinate on the same day', 'So that the trays would need less water', 'So that the temperature would stay at 25°C'], answer: 0, explanation: 'Soil can affect germination. Keeping it the same means the differences reflect temperature (Experiment 1) or water (Experiment 2).' },
  { skill: S_EXTEND, d: 3, stimulus: seeds, stem: 'If a trial in Experiment 1 had been run at 40°C, germination would most likely have been:', choices: ['less than 54%.', 'between 54% and 88%.', 'between 88% and 92%.', 'greater than 92%.'], answer: 0, explanation: 'Germination fell from 92% at 25°C to 88% at 30°C and 54% at 35°C. Continuing that trend, 40°C would most likely give less than 54%.' },
  { skill: S_EXTEND, d: 4, stimulus: seeds, stem: 'If Experiment 2 were repeated at 15°C, germination for trays given 20 mL of water per day would most likely be about:', choices: ['46%', '12%', '92%', '100%'], answer: 0, explanation: 'Experiment 1 already tested 15°C with 20 mL per day: 46% germinated.' },
  { skill: S_EXTEND, d: 4, stimulus: seeds, stem: 'Based on Experiment 2, if trays received 60 mL of water per day, germination would most likely be:', choices: ['between 38% and 90%.', 'less than 38%.', 'greater than 92%.', 'exactly 0%.'], answer: 0, explanation: '60 mL lies between 40 mL (90%) and 80 mL (38%), where germination was falling, so it would most likely fall between those values.' },

  // Rail
  { skill: COMPARE, d: 2, stimulus: rail, stem: 'Which student attributes the extinction to a single introduced species that ate the rail\'s eggs and chicks?', choices: ['Student 1', 'Student 2', 'Student 3', 'None of the students'], answer: 0, explanation: 'Student 1 says rats, which eat eggs and chicks of ground-nesting birds, caused the extinction. Student 2 blames goats, which destroyed habitat, and Student 3 blames both.' },
  { skill: COMPARE, d: 3, stimulus: rail, stem: 'Students 2 and 3 would most likely agree that:', choices: ['goats reduced the forest on Kestrel Island.', 'rats alone caused the extinction.', 'the rail fed mainly on eggs of other birds.', 'the forest grew larger after 1830.'], answer: 0, explanation: 'Student 2 says goats shrank the forest, and Student 3 says "goats shrank the forest" too. The forest fell from 80% to 20% cover, and neither credits rats alone.' },
  { skill: COMPARE, d: 3, stimulus: rail, stem: 'According to Student 2, the rail depended on the forest for:', choices: ['food and shelter.', 'protection from rats.', 'nesting sites high in trees.', 'water.'], answer: 0, explanation: 'Student 2 says the rail fed on insects in the leaf litter and hid in dense undergrowth, so the forest gave it food and shelter. The rail nested on the ground.' },
  { skill: COMPARE, d: 4, stimulus: rail, stem: "How does Student 3's view differ from Student 1's view?", choices: ['Student 3 holds that rats alone would not have caused the extinction by 1900.', 'Student 3 holds that rats played no role in the extinction.', 'Student 3 holds that goats arrived after rats.', 'Student 3 holds that the rail was never common on the island.'], answer: 0, explanation: 'Student 3 says "neither goats alone nor rats alone" would have caused extinction by 1900, while Student 1 says rats were the cause. Student 3 still gives rats a role.' },
  { skill: M_EXTEND, d: 4, stimulus: rail, stem: 'Suppose that on a nearby island with rats but no goats, a closely related ground-nesting rail went extinct within 20 years of rats arriving. This finding would most strengthen the view of:', choices: ['Student 1', 'Student 2', 'Student 3', 'none of the students'], answer: 0, explanation: 'It shows rats alone can wipe out a similar bird quickly, supporting Student 1 and weakening Student 3\'s claim that rats alone would not have been enough.' },
  { skill: M_EXTEND, d: 4, stimulus: rail, stem: 'Suppose a naturalist\'s survey in 1855 found that rail numbers had already fallen by 70% since 1830. This finding would be most consistent with the views of:', choices: ['Students 2 and 3 only', 'Student 1 only', 'Students 1 and 2 only', 'Students 1, 2, and 3'], answer: 0, explanation: 'A 70% drop before rats arrived fits goats driving an early decline (Students 2 and 3). Student 1 says counts fell only slowly before 1860, which a 70% drop contradicts.' },
  { skill: M_EXTEND, d: 3, stimulus: rail, stem: 'Student 2 would most likely predict that if goats had been kept off the island in 1830, the rail would have:', choices: ['kept its forest habitat and survived longer.', 'gone extinct sooner.', 'begun nesting in trees.', 'been unaffected by the forest.'], answer: 0, explanation: 'Student 2 blames forest loss caused by goats. Without goats, the forest, and the rail\'s food and shelter, would have remained.' },
  { skill: M_EXTEND, d: 3, stimulus: rail, stem: 'Which observation would Student 3 most likely cite as support?', choices: ['Rail counts fell slowly as the forest shrank and then dropped sharply after rats arrived.', 'Rail counts stayed constant until rats arrived.', 'The forest grew while rail counts fell.', 'Rail counts rose after rats arrived.'], answer: 0, explanation: 'A slow decline with forest loss followed by a sharp drop after rats matches Student 3\'s two-stage explanation.' },
  { skill: M_EXTEND, d: 4, stimulus: rail, stem: 'If rats had never reached Kestrel Island, Student 3 would most likely predict that by 1900 the rail would have been:', choices: ['still present, though in small numbers.', 'extinct, because of the goats alone.', 'more common than in 1820.', 'extinct, because of a lack of water.'], answer: 0, explanation: 'Student 3 says goats reduced the rail to a small population and that goats alone would not have caused extinction by 1900.' },

  // Turbines
  { skill: LOCATE, d: 1, stimulus: turbines, stem: 'According to Table 1, what was the power output of Rotor S at 6 m/s?', choices: ['1.7 W', '1.6 W', '2.1 W', '1.5 W'], answer: 0, explanation: 'Rotor S is listed with a power output of 1.7 W.' },
  { skill: S_EDT, d: 2, stimulus: turbines, stem: 'Which rotors met the power criterion?', choices: ['Q, R, S, and T', 'R only', 'Q and R only', 'P, Q, R, S, and T'], answer: 0, explanation: 'The criterion is at least 1.5 W. Q (1.6), R (2.1), S (1.7), and T (1.5) met it; P (1.2 W) did not.' },
  { skill: S_EDT, d: 3, stimulus: turbines, stem: 'Which rotors met all three design criteria?', choices: ['Q and S only', 'R only', 'Q, R, and S only', 'S and T only'], answer: 0, explanation: 'Q (1.6 W, 120 g, 3 mm) and S (1.7 W, 150 g, 2 mm) met every limit. R is too heavy and bends 6 mm, T is too heavy, and P lacks power.' },
  { skill: E_EDT, d: 3, stimulus: turbines, stem: 'Comparing Rotors Q and R shows the effect of changing:', choices: ['blade length.', 'the number of blades.', 'the blade material.', 'the wind speed.'], answer: 0, explanation: 'Q and R both have 3 blades of the same plastic and shape; only the blade length differs (20 cm vs. 25 cm).' },
  { skill: E_EDT, d: 4, stimulus: turbines, stem: 'For the rotors with 20 cm blades, how did power change as the number of blades increased beyond 3?', choices: ['It increased only slightly and then decreased.', 'It doubled with each added blade.', 'It decreased steadily.', 'It did not change at all.'], answer: 0, explanation: 'Power went from 1.6 W (3 blades) to 1.7 W (4 blades), then down to 1.5 W (6 blades).' },
  { skill: E_EDT, d: 4, stimulus: turbines, stem: 'If the team chooses the rotor that meets all the criteria and produces the most power, which rotor should they choose?', choices: ['S', 'Q', 'R', 'T'], answer: 0, explanation: 'Only Q and S meet all criteria, and S produces more power (1.7 W vs. 1.6 W). R produces the most power overall but fails two criteria.' },
  { skill: S_EDT, d: 3, stimulus: turbines, stem: 'Why were all rotors tested at the same wind speed in the power test?', choices: ['So that differences in power would be due to rotor design', 'So that every rotor would have the same mass', 'So that the blades would not bend', 'So that every rotor would produce 1.5 W'], answer: 0, explanation: 'Wind speed strongly affects power. Testing all rotors at 6 m/s means the power differences reflect their designs.' },
  { skill: S_EDT, d: 3, stimulus: turbines, stem: 'Which criteria did Rotor R fail?', choices: ['The mass criterion and the bending criterion', 'The power criterion only', 'The mass criterion only', 'The power criterion and the bending criterion'], answer: 0, explanation: 'Rotor R produced 2.1 W (meets power) but weighs 160 g (over 150 g) and bent 6 mm (over 5 mm).' },
  { skill: E_EDT, d: 4, stimulus: turbines, stem: 'A team member argues that adding blades always increases power. Which comparison most directly contradicts this claim?', choices: ['Rotor S (4 blades, 1.7 W) and Rotor T (6 blades, 1.5 W)', 'Rotor P (2 blades, 1.2 W) and Rotor Q (3 blades, 1.6 W)', 'Rotor Q (3 blades, 20 cm) and Rotor R (3 blades, 25 cm)', 'Rotor Q (3 blades, 1.6 W) and Rotor S (4 blades, 1.7 W)'], answer: 0, explanation: 'T has more blades than S but less power, contradicting the claim. P to Q and Q to S show power increasing, and Q and R have the same number of blades.' },

  // Ocean
  { skill: LOCATE, d: 1, stimulus: ocean, stem: 'According to Table 1, what was the water temperature at a depth of 300 m?', choices: ['11°C', '19°C', '8°C', '3.2°C'], answer: 0, explanation: 'The 300 m row lists a temperature of 11°C; 3.2 is the dissolved oxygen in mg/L.' },
  { skill: LOCATE, d: 2, stimulus: ocean, stem: 'At which depth was dissolved oxygen lowest?', choices: ['500 m', '1,200 m', '300 m', '0 m'], answer: 0, explanation: 'Dissolved oxygen was 1.9 mg/L at 500 m, the lowest value in the table.' },
  { skill: INFER, d: 2, stimulus: ocean, stem: 'As depth increased from 0 m to 1,200 m, water temperature:', choices: ['decreased.', 'increased.', 'stayed the same.', 'decreased and then increased.'], answer: 0, explanation: 'Temperature fell at every step, from 24°C at the surface to 4°C at 1,200 m.' },
  { skill: INFER, d: 3, stimulus: ocean, stem: 'As depth increased from 0 m to 1,200 m, dissolved oxygen:', choices: ['decreased to a minimum at 500 m and then increased.', 'increased steadily.', 'decreased steadily.', 'stayed the same.'], answer: 0, explanation: 'Oxygen fell from 6.8 mg/L to 1.9 mg/L at 500 m, then rose to 2.6 and 3.9 mg/L at greater depths.' },
  { skill: INFER, d: 4, stimulus: ocean, stem: 'Over which depth interval did the temperature decrease the most per meter of depth?', choices: ['0 m to 100 m', '100 m to 300 m', '300 m to 500 m', '800 m to 1,200 m'], answer: 0, explanation: 'Per meter: 0–100 m is 5/100 = 0.05°C, 100–300 m is 8/200 = 0.04°C, 300–500 m is 3/200 = 0.015°C, and 800–1,200 m is 2/400 = 0.005°C.', check: '5/100 > 8/200 && 8/200 > 3/200 && 3/200 > 2/400' },
  { skill: EXTEND, d: 3, stimulus: ocean, stem: 'At a depth of 200 m, the water temperature would most likely be:', choices: ['between 11°C and 19°C.', 'between 19°C and 24°C.', 'between 8°C and 11°C.', 'below 4°C.'], answer: 0, explanation: '200 m lies between 100 m (19°C) and 300 m (11°C).' },
  { skill: EXTEND, d: 4, stimulus: ocean, stem: 'If dissolved oxygen were measured at 1,500 m, it would most likely be:', choices: ['greater than 3.9 mg/L.', 'less than 1.9 mg/L.', 'exactly 1.9 mg/L.', 'between 1.9 mg/L and 2.6 mg/L.'], answer: 0, explanation: 'Below 500 m, oxygen rose steadily with depth (1.9, 2.6, 3.9 mg/L). Continuing that trend, 1,500 m would most likely exceed 3.9 mg/L.' },
  { skill: EXTEND, d: 3, stimulus: ocean, stem: 'At a depth of 50 m, dissolved oxygen would most likely be between:', choices: ['6.1 mg/L and 6.8 mg/L.', '3.2 mg/L and 6.1 mg/L.', '1.9 mg/L and 3.2 mg/L.', '3.9 mg/L and 6.1 mg/L.'], answer: 0, explanation: '50 m lies between the surface (6.8 mg/L) and 100 m (6.1 mg/L).' },
  { skill: RESULTS, d: 3, stimulus: ocean, stem: 'A student claims that, at this location, colder water always contained more dissolved oxygen. Do the data support this claim?', choices: ['No; water at 500 m was colder than water at 300 m but contained less oxygen.', 'Yes; oxygen increased at every step as the water got colder.', 'Yes; the coldest water had the most oxygen.', 'No; the warmest water had the least oxygen.'], answer: 0, explanation: 'From 300 m (11°C, 3.2 mg/L) to 500 m (8°C, 1.9 mg/L), the water got colder but oxygen fell. The surface water was the warmest and had the most oxygen.' },
  { skill: RESULTS, d: 4, stimulus: ocean, stem: 'Which conclusion is supported by the data?', choices: ['The lowest dissolved oxygen did not occur at the greatest depth measured.', 'Dissolved oxygen was highest at 1,200 m.', 'Temperature and dissolved oxygen changed in exactly the same pattern.', 'The deepest water was the warmest.'], answer: 0, explanation: 'The minimum oxygen (1.9 mg/L) was at 500 m, not at 1,200 m. Oxygen was highest at the surface, temperature fell steadily while oxygen did not, and the deepest water was the coldest.' },

  // Electromagnets
  { skill: S_LOCATE, d: 1, stimulus: magnets, stem: 'In Experiment 2, which variable was changed?', choices: ['Voltage', 'Number of turns of wire', 'Core material', 'Type of paper clip'], answer: 0, explanation: 'Experiment 2 kept the iron nail and 40 turns while varying the voltage from 1.5 V to 6.0 V.' },
  { skill: S_LOCATE, d: 2, stimulus: magnets, stem: 'Which experiment tested the effect of the core material?', choices: ['Experiment 3', 'Experiment 1', 'Experiment 2', 'None of the experiments'], answer: 0, explanation: 'Experiment 3 compared an iron nail, a steel bolt, an aluminum rod, and a wooden dowel.' },
  { skill: S_LOCATE, d: 3, stimulus: magnets, stem: 'Which trials were run under identical conditions?', choices: ['Experiment 1 with 40 turns, Experiment 2 at 3.0 V, and Experiment 3 with the iron nail', 'Experiment 1 with 10 turns and Experiment 2 at 1.5 V', 'Experiment 2 at 6.0 V and Experiment 3 with the steel bolt', 'Experiment 1 with 80 turns and Experiment 3 with the aluminum rod'], answer: 0, explanation: 'Each of those trials used an iron nail, 40 turns, and 3.0 V, and each lifted 13 paper clips.' },
  { skill: DESIGN, d: 3, stimulus: magnets, stem: 'Why did the students use identical steel paper clips in every trial?', choices: ['So that the number of clips lifted would be a consistent measure of strength', 'So that the voltage would stay the same', 'So that the wire would not overheat', 'So that every electromagnet would lift the same number of clips'], answer: 0, explanation: 'Clips of different sizes or materials would be harder or easier to lift, making the counts impossible to compare.' },
  { skill: DESIGN, d: 4, stimulus: magnets, stem: 'To test whether the thickness of the wire affects the strength of an electromagnet, the students should:', choices: ['wrap 40 turns around iron nails at 3.0 V, using wires of different thicknesses.', 'wrap different numbers of turns of different wires around different cores.', 'use the same wire and change the voltage.', 'use the same wire and change the core material.'], answer: 0, explanation: 'Wire thickness must be the only difference. The second option changes several variables at once, and the last two do not vary thickness.' },
  { skill: DESIGN, d: 3, stimulus: magnets, stem: 'Why did the students keep the number of turns at 40 throughout Experiment 2?', choices: ['So that voltage would be the only variable changed', 'So that the core would stay cool', 'So that every trial would lift 13 clips', 'So that the battery pack would last longer'], answer: 0, explanation: 'Experiment 1 shows that the number of turns affects strength, so holding it constant lets Experiment 2 isolate the effect of voltage.' },
  { skill: S_EXTEND, d: 3, stimulus: magnets, stem: 'Based on Experiment 1, an electromagnet with 160 turns at 3.0 V would most likely lift about:', choices: ['50 paper clips.', '25 paper clips.', '37 paper clips.', '80 paper clips.'], answer: 0, explanation: 'Doubling the turns roughly doubled the clips lifted (13 at 40 turns, 25 at 80 turns). Doubling again to 160 turns would give about 50.' },
  { skill: S_EXTEND, d: 4, stimulus: magnets, stem: 'Based on Experiment 2, an electromagnet with 40 turns at 7.5 V would most likely lift about:', choices: ['32 paper clips.', '26 paper clips.', '40 paper clips.', '52 paper clips.'], answer: 0, explanation: 'Each 1.5 V increase added about 6 or 7 clips (6, 13, 19, 26). Another 1.5 V beyond 6.0 V would give about 32.' },
  { skill: S_EXTEND, d: 4, stimulus: magnets, stem: 'If Experiment 3 were repeated using 80 turns of wire instead of 40, the iron nail would most likely lift about:', choices: ['25 paper clips.', '13 paper clips.', '0 paper clips.', '50 paper clips.'], answer: 0, explanation: 'Experiment 1 already tested an iron nail with 80 turns at 3.0 V, and it lifted 25 clips.' },
  { skill: S_EXTEND, d: 3, stimulus: magnets, stem: 'If Experiment 1 were repeated at 6.0 V instead of 3.0 V, the electromagnet with 40 turns would most likely lift about:', choices: ['26 paper clips.', '13 paper clips.', '6 paper clips.', '52 paper clips.'], answer: 0, explanation: 'Experiment 2 tested 40 turns at 6.0 V with an iron nail, and it lifted 26 clips.' },
];

export default shuffled(items);
