// ACT Science, set 1. Original passages written for PrepPath (Claude Code session, 2026-10-17).
// Experiments and data are invented but follow real relationships: pendulum periods from
// T = 2π√(L/g) with the large-angle correction, NaCl/CaCl2/sucrose/ethanol freezing points from
// published freezing-point data, alewife thiaminase and lake stratification as described in the
// fisheries literature, and Moon-origin observations (density, isotopes, early melting) as taught.
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

const plants = `Students grew radish seedlings under light-emitting diodes (LEDs) of a single color. Each group had 20 seedlings in identical pots with the same soil, water, and temperature (22°C). Every group received light of the same intensity for 16 hours per day. After 14 days, the students measured the height of each seedling and the mass of its leaves. Table 1 shows the group averages.

Table 1

| Light color | Wavelength (nm) | Average height (cm) | Average leaf mass (mg) |
|---|---|---|---|
| Violet | 410 | 6.8 | 41 |
| Blue | 450 | 7.9 | 52 |
| Green | 530 | 4.1 | 23 |
| Yellow | 580 | 4.6 | 27 |
| Red | 660 | 8.4 | 49 |
| White (all colors) | — | 9.2 | 58 |`;

const sugar = `Students studied how quickly sugar dissolves in water. In every trial, 5.0 g of sugar was added to 200 mL of water, and the mixture was stirred at the same constant rate until no crystals could be seen. The time this took was recorded as the dissolving time.

Experiment 1

Granulated sugar was dissolved in water at five different temperatures (see Table 1).

Table 1

| Water temperature (°C) | Dissolving time (s) |
|---|---|
| 10 | 148 |
| 20 | 110 |
| 40 | 61 |
| 60 | 37 |
| 80 | 24 |

Experiment 2

Four forms of sugar were each dissolved in water at 20°C (see Table 2).

Table 2

| Form of sugar | Dissolving time (s) |
|---|---|
| Sugar cube | 360 |
| Coarse sugar | 195 |
| Granulated sugar | 110 |
| Powdered sugar | 42 |`;

const trout = `Between 2005 and 2020, the population of lake trout in Lake Mira fell by about 60%. During the same period, the lake's average summer surface temperature rose by 1.8°C, and the alewife, a nonnative fish, became common in the lake. Two scientists explain the decline.

Scientist 1

Warmer water is the main cause. Lake trout need cold water with plenty of dissolved oxygen. As the surface warms, the lake stratifies earlier and longer each summer: a warm upper layer sits on top of a cold bottom layer, and the two layers do not mix. Oxygen in the cold bottom layer, where trout spend the summer, is used up by decomposing material and is not replaced until the layers mix again in the fall. In recent summers, oxygen in the bottom layer has stayed below the level trout need for weeks at a time, causing deaths and poor growth.

Scientist 2

The alewife is the main cause. Alewives eat large numbers of the zooplankton and small fish that young trout depend on. Alewives also contain an enzyme, thiaminase, that breaks down thiamine (vitamin B1). Adult trout that eat many alewives become thiamine-deficient and produce eggs that often fail to hatch or young that die soon after hatching. Adult trout survival has not changed much; the decline is due to the failure of young trout to survive.`;

const lunchbox = `A student team designed an insulated lunch box to keep food cold. The design had to meet three criteria:

- Keep the inside at or below 5°C for 4 hours in a 22°C room, starting from 2°C
- Have a mass of no more than 600 g
- Cost no more than 12 dollars in materials

The team built four prototypes. All four were the same size, and each held an identical frozen ice pack. The team recorded the inside temperature after 4 hours (see Table 1).

Table 1

| Prototype | Insulation material | Wall thickness (mm) | Temperature after 4 h (°C) | Mass (g) | Cost (dollars) |
|---|---|---|---|---|---|
| A | Foam board | 10 | 7.5 | 420 | 6 |
| B | Foam board | 20 | 4.8 | 560 | 9 |
| C | Reflective bubble wrap | 10 | 6.2 | 380 | 8 |
| D | Vacuum panel | 10 | 3.1 | 650 | 18 |`;

const pendulum = `A pendulum is a weight (called a bob) hanging from a string. Its period is the time it takes to swing over and back once. In each trial below, students released the bob from rest, timed 10 complete swings with a stopwatch, and divided by 10 to find the period.

Experiment 1

A 200 g bob was released from a starting angle of 10°. The length of the string was varied (see Table 1).

Table 1

| String length (m) | Period (s) |
|---|---|
| 0.25 | 1.00 |
| 0.50 | 1.42 |
| 1.00 | 2.01 |
| 1.50 | 2.46 |
| 2.00 | 2.84 |

Experiment 2

The string length was 1.00 m and the starting angle was 10°. The mass of the bob was varied (see Table 2).

Table 2

| Bob mass (g) | Period (s) |
|---|---|
| 100 | 2.01 |
| 200 | 2.01 |
| 400 | 2.00 |
| 800 | 2.01 |

Experiment 3

The string length was 1.00 m and the bob mass was 200 g. The starting angle was varied (see Table 3).

Table 3

| Starting angle (°) | Period (s) |
|---|---|
| 5 | 2.01 |
| 10 | 2.01 |
| 20 | 2.02 |
| 40 | 2.07 |`;

const freezing = `Students measured the freezing points of water solutions. A solution's concentration is given as percent by mass (grams of dissolved substance per 100 g of solution). Table 1 shows results for table salt (sodium chloride, NaCl). Table 2 shows results for 10% solutions of four different substances.

Table 1

| NaCl concentration (%) | Freezing point (°C) |
|---|---|
| 0 | 0.0 |
| 5 | −3.0 |
| 10 | −6.6 |
| 15 | −10.9 |
| 20 | −16.5 |

Table 2

| Substance (10% by mass) | Freezing point (°C) |
|---|---|
| Sugar (sucrose) | −0.6 |
| Ethanol | −4.4 |
| Calcium chloride | −5.9 |
| Sodium chloride | −6.6 |`;

const moon = `Scientists have proposed several hypotheses for how Earth's Moon formed. Any hypothesis must account for three observations:

1. The Moon's average density (3.3 g/cm³) is much lower than Earth's (5.5 g/cm³), because the Moon has only a small iron core.
2. The ratios of oxygen isotopes in Moon rocks are nearly identical to those in Earth rocks. Bodies that formed in different parts of the solar system usually have different ratios.
3. Moon rocks show that much of the Moon's outer layer was once melted.

Hypothesis 1

The Moon formed in a different part of the solar system. Later, it passed close to Earth and was captured by Earth's gravity.

Hypothesis 2

Earth and the Moon formed at the same time, side by side, from the same disk of material orbiting the young Sun.

Hypothesis 3

Early in Earth's history, a body about the size of Mars collided with Earth. The collision threw off debris, mostly from the rocky outer layers (mantles) of Earth and the impacting body. The heat of the collision melted much of this debris, which then collected in orbit to form the Moon.`;

const items: Authored[] = [
  // Plants
  { skill: LOCATE, d: 1, stimulus: plants, stem: 'Among the single-color lights, which color produced the greatest average height?', choices: ['Red', 'Blue', 'Violet', 'Yellow'], answer: 0, explanation: 'Red light produced an average height of 8.4 cm, the greatest among the single colors. White light is a mix of all colors.' },
  { skill: LOCATE, d: 2, stimulus: plants, stem: 'According to Table 1, the average leaf mass of seedlings grown under yellow light was:', choices: ['27 mg.', '23 mg.', '4.6 mg.', '580 mg.'], answer: 0, explanation: 'The yellow row lists an average leaf mass of 27 mg. 4.6 is the height in cm and 580 is the wavelength in nm.' },
  { skill: LOCATE, d: 2, stimulus: plants, stem: 'Which light color resulted in the lowest average leaf mass?', choices: ['Green', 'Yellow', 'Violet', 'Red'], answer: 0, explanation: 'Green light gave an average leaf mass of 23 mg, the lowest value in the table.' },
  { skill: INFER, d: 3, stimulus: plants, stem: 'Based on Table 1, as the wavelength of the light increased from 450 nm to 530 nm, the average height of the seedlings:', choices: ['decreased.', 'increased.', 'stayed the same.', 'increased and then decreased.'], answer: 0, explanation: 'At 450 nm (blue) the average height was 7.9 cm; at 530 nm (green) it was 4.1 cm, so height decreased.' },
  { skill: INFER, d: 3, stimulus: plants, stem: 'For which pair of single colors did the average heights differ by less than 1 cm?', choices: ['Blue and red', 'Violet and blue', 'Green and red', 'Violet and yellow'], answer: 0, explanation: 'Blue (7.9 cm) and red (8.4 cm) differ by 0.5 cm. Violet and blue differ by 1.1 cm, green and red by 4.3 cm, and violet and yellow by 2.2 cm.' },
  { skill: INFER, d: 4, stimulus: plants, stem: 'Which statement best describes the relationship between average height and average leaf mass for the single-color groups?', choices: ['In general, groups with greater average height also had greater average leaf mass.', 'Groups with greater average height always had lower average leaf mass.', 'There was no relationship between average height and average leaf mass.', 'Every group had the same average leaf mass.'], answer: 0, explanation: 'Ordered by height (green, yellow, violet, blue, red), leaf mass mostly rises (23, 27, 41, 52, 49 mg). Red is a slight exception, so "in general" is accurate, while "always lower" and "no relationship" are not.' },
  { skill: EXTEND, d: 3, stimulus: plants, stem: 'If seedlings had been grown under orange light with a wavelength of 620 nm, their average height would most likely have been:', choices: ['between 4.6 cm and 8.4 cm.', 'less than 4.1 cm.', 'between 8.4 cm and 9.2 cm.', 'greater than 9.2 cm.'], answer: 0, explanation: '620 nm lies between yellow (580 nm, 4.6 cm) and red (660 nm, 8.4 cm), so the height would most likely fall between those two values.' },
  { skill: EXTEND, d: 2, stimulus: plants, stem: 'If the students had measured the seedlings after 21 days instead of 14 days, the average heights would most likely have been:', choices: ['greater than those in Table 1.', 'less than those in Table 1.', 'exactly the same as those in Table 1.', 'zero for every group.'], answer: 0, explanation: 'Healthy seedlings keep growing, so after a week more under the same conditions they would most likely be taller than at 14 days.' },
  { skill: RESULTS, d: 3, stimulus: plants, stem: 'Do the results support the hypothesis that green light is less effective for radish growth than blue or red light?', choices: ['Yes; green-light seedlings had lower average height and lower average leaf mass than blue- or red-light seedlings.', 'Yes; green-light seedlings had the greatest average height.', 'No; green-light seedlings were taller than blue-light seedlings.', 'No; green-light seedlings had the same leaf mass as red-light seedlings.'], answer: 0, explanation: 'Green gave 4.1 cm and 23 mg, compared with 7.9 cm and 52 mg for blue and 8.4 cm and 49 mg for red. The data support the hypothesis.' },

  // Sugar
  { skill: S_LOCATE, d: 2, stimulus: sugar, stem: 'In Experiment 1, which variable did the students change from trial to trial?', choices: ['Water temperature', 'Form of sugar', 'Mass of sugar', 'Volume of water'], answer: 0, explanation: 'Experiment 1 used granulated sugar at five different water temperatures. The mass of sugar and volume of water were the same in every trial.' },
  { skill: S_LOCATE, d: 3, stimulus: sugar, stem: 'Which factor was held constant in Experiment 2 but varied in Experiment 1?', choices: ['Water temperature', 'Form of sugar', 'Mass of sugar', 'Volume of water'], answer: 0, explanation: 'Experiment 2 used water at 20°C for every trial, while Experiment 1 varied the temperature. The form of sugar varied in Experiment 2, and mass and volume were constant in both.' },
  { skill: DESIGN, d: 3, stimulus: sugar, stem: 'Why did the students most likely stir every mixture at the same constant rate?', choices: ['So that differences in dissolving time could be attributed to the variable being tested', 'So that the sugar would not dissolve at all', 'So that the water temperature would increase', 'So that each trial would use a different mass of sugar'], answer: 0, explanation: 'Stirring affects how fast sugar dissolves. Keeping it the same in every trial controls that factor, so the changes in time reflect temperature or sugar form.' },
  { skill: DESIGN, d: 4, stimulus: sugar, stem: 'The students want to test whether stirring rate affects dissolving time. Which procedure would best accomplish this?', choices: ['Dissolve 5.0 g of granulated sugar in 200 mL of 20°C water in each trial, using a different stirring rate each time.', 'Dissolve granulated sugar at different water temperatures, using a different stirring rate for each temperature.', 'Dissolve each form of sugar using a different stirring rate for each form.', 'Dissolve 5.0 g of granulated sugar in 200 mL of 20°C water without stirring.'], answer: 0, explanation: 'To isolate stirring rate, it must be the only thing that changes. The second and third options change two variables at once, and the last does not vary stirring at all.' },
  { skill: S_EXTEND, d: 3, stimulus: sugar, stem: 'If a trial in Experiment 1 had been done with water at 90°C, the dissolving time would most likely have been:', choices: ['less than 24 s.', 'between 24 s and 37 s.', 'between 37 s and 61 s.', 'greater than 148 s.'], answer: 0, explanation: 'Dissolving time decreased steadily as temperature rose, reaching 24 s at 80°C, so at 90°C it would most likely be less than 24 s.' },
  { skill: S_EXTEND, d: 4, stimulus: sugar, stem: 'If Experiment 2 were repeated with water at 60°C instead of 20°C, the dissolving time for powdered sugar would most likely be:', choices: ['less than 42 s.', 'between 42 s and 110 s.', 'between 110 s and 195 s.', 'greater than 360 s.'], answer: 0, explanation: 'Experiment 1 shows that warmer water dissolves sugar faster (110 s at 20°C vs. 37 s at 60°C for granulated). Powdered sugar took 42 s at 20°C, so at 60°C it would most likely take less.' },
  { skill: INFER, d: 3, stimulus: sugar, stem: 'Based on Experiment 1, granulated sugar in water at 30°C would most likely dissolve in a time between:', choices: ['61 s and 110 s.', '37 s and 61 s.', '110 s and 148 s.', '24 s and 37 s.'], answer: 0, explanation: '30°C lies between 20°C (110 s) and 40°C (61 s), so the dissolving time would most likely fall between those values.' },
  { skill: RESULTS, d: 3, stimulus: sugar, stem: 'Which conclusion is best supported by the results of Experiment 2?', choices: ['Sugar in smaller pieces dissolves faster than sugar in larger pieces.', 'All forms of sugar dissolve in the same amount of time.', 'Sugar cubes dissolve faster than powdered sugar.', 'Water temperature has no effect on dissolving time.'], answer: 0, explanation: 'Dissolving time fell from 360 s (cube) to 42 s (powdered) as the pieces got smaller. Experiment 2 kept the temperature fixed, so it says nothing about temperature.' },
  { skill: RESULTS, d: 4, stimulus: sugar, stem: 'A student claims that doubling the water temperature (in °C) always cuts the dissolving time in half. Do the results of Experiment 1 support this claim?', choices: ['No; increasing the temperature from 10°C to 20°C reduced the time only from 148 s to 110 s.', 'Yes; increasing the temperature from 20°C to 40°C reduced the time from 110 s to exactly 55 s.', 'Yes; every doubling of temperature cut the time exactly in half.', 'No; increasing the temperature made the dissolving time longer.'], answer: 0, explanation: 'Doubling from 10°C to 20°C cut the time by only about a quarter, and from 20°C to 40°C the time went from 110 s to 61 s, not 55 s. Higher temperatures did shorten the time, so the last option is also wrong.' },

  // Trout
  { skill: COMPARE, d: 2, stimulus: trout, stem: "Which scientist attributes the decline mainly to a change in the lake's physical conditions?", choices: ['Scientist 1 only', 'Scientist 2 only', 'Both Scientist 1 and Scientist 2', 'Neither scientist'], answer: 0, explanation: 'Scientist 1 blames warmer water and low oxygen from stratification, which are physical conditions. Scientist 2 blames a living organism, the alewife.' },
  { skill: COMPARE, d: 3, stimulus: trout, stem: 'Both scientists would most likely agree that:', choices: ['the lake trout population declined between 2005 and 2020.', 'alewives increase the oxygen in the bottom layer of the lake.', 'the decline was caused mainly by overfishing.', 'young trout have not been affected by any change in the lake.'], answer: 0, explanation: 'Both scientists accept that the population fell and try to explain why. Neither mentions overfishing, neither says alewives add oxygen, and Scientist 2 says young trout are the ones affected.' },
  { skill: COMPARE, d: 3, stimulus: trout, stem: 'According to Scientist 2, the decline in lake trout is mainly due to:', choices: ['the failure of young trout to survive.', 'the deaths of adult trout in summer.', 'the warming of the lake surface.', 'a lack of zooplankton for adult trout.'], answer: 0, explanation: 'Scientist 2 says adult survival "has not changed much" and that "the decline is due to the failure of young trout to survive."' },
  { skill: COMPARE, d: 3, stimulus: trout, stem: "Scientist 1's explanation depends on the idea that, in summer, the lake's:", choices: ['layers do not mix, so oxygen in the bottom layer is not replaced.', 'surface water becomes colder than the bottom water.', 'alewives eat most of the zooplankton.', 'trout move to the warm upper layer.'], answer: 0, explanation: 'Scientist 1 explains that stratification keeps the layers from mixing, so oxygen used up in the bottom layer "is not replaced until the layers mix again in the fall."' },
  { skill: M_EXTEND, d: 4, stimulus: trout, stem: "Suppose researchers found that adult lake trout in Lake Mira had normal thiamine levels and that their eggs hatched normally. This finding would most weaken the viewpoint of:", choices: ['Scientist 2 only.', 'Scientist 1 only.', 'both Scientist 1 and Scientist 2.', 'neither scientist.'], answer: 0, explanation: "Scientist 2's explanation depends on alewives causing thiamine deficiency and failed hatching. Normal thiamine and hatching would undercut it, but would not affect Scientist 1's oxygen explanation." },
  { skill: M_EXTEND, d: 4, stimulus: trout, stem: "Suppose measurements showed that oxygen in the lake's bottom layer stayed above the level trout need throughout every summer from 2005 to 2020. How would this finding affect the scientists' viewpoints?", choices: ["It would weaken Scientist 1's viewpoint but not Scientist 2's.", "It would weaken Scientist 2's viewpoint but not Scientist 1's.", 'It would weaken both viewpoints.', 'It would strengthen both viewpoints.'], answer: 0, explanation: 'Scientist 1 claims bottom-layer oxygen fell below what trout need for weeks at a time. Adequate oxygen all along would contradict that claim but is irrelevant to the alewife explanation.' },
  { skill: M_EXTEND, d: 3, stimulus: trout, stem: 'Scientist 2 would most likely predict that removing most of the alewives from Lake Mira would:', choices: ['increase the survival of young lake trout.', 'lower the temperature of the lake.', 'decrease the oxygen in the bottom layer.', 'reduce the survival of adult lake trout.'], answer: 0, explanation: 'Scientist 2 says alewives cause thiamine deficiency and compete for the food young trout need. With fewer alewives, more young trout should survive.' },
  { skill: RESULTS, d: 3, stimulus: trout, stem: "Which observation would be consistent with both scientists' explanations?", choices: ['Fewer lake trout were caught in 2020 than in 2005.', 'Many adult trout died each summer from low oxygen.', 'Trout eggs failed to hatch because of thiamine deficiency.', "The lake's surface temperature fell between 2005 and 2020."], answer: 0, explanation: 'Both scientists explain a decline, so fewer trout fits both. Summer oxygen deaths fit only Scientist 1, thiamine-related hatching failure fits only Scientist 2, and a falling temperature contradicts the stated warming.' },

  // Lunch box
  { skill: S_EDT, d: 2, stimulus: lunchbox, stem: 'Which prototypes met the temperature criterion?', choices: ['B and D only', 'A and C only', 'D only', 'A, B, C, and D'], answer: 0, explanation: 'The criterion is 5°C or below after 4 hours. Only B (4.8°C) and D (3.1°C) met it; A (7.5°C) and C (6.2°C) did not.' },
  { skill: S_EDT, d: 3, stimulus: lunchbox, stem: 'Which prototype met all three design criteria?', choices: ['B', 'A', 'C', 'D'], answer: 0, explanation: 'B stayed at 4.8°C, has a mass of 560 g, and cost 9 dollars, meeting every limit. D was colder but has a mass of 650 g and cost 18 dollars, over both limits. A and C were too warm.' },
  { skill: E_EDT, d: 3, stimulus: lunchbox, stem: 'Based on the results, which change to Prototype A would most likely help it meet the temperature criterion while staying within the mass limit?', choices: ['Increasing the foam board thickness to 20 mm', 'Decreasing the foam board thickness to 5 mm', 'Replacing the foam board with a 10 mm vacuum panel', 'Removing the ice pack'], answer: 0, explanation: 'Prototype B is Prototype A with 20 mm foam, and it reached 4.8°C at 560 g. Thinner foam would insulate worse, the vacuum panel version is over the mass limit, and removing the ice pack would make it warmer.' },
  { skill: E_EDT, d: 4, stimulus: lunchbox, stem: 'Which group of prototypes provides the most direct comparison of the effect of insulation material alone?', choices: ['A, C, and D', 'A and B', 'B and D', 'B and C'], answer: 0, explanation: 'A, C, and D all have 10 mm walls but different materials, so material is the only design difference. A and B compare thickness, and the other pairs differ in both material and thickness.' },
  { skill: S_EDT, d: 3, stimulus: lunchbox, stem: 'Why did the team make all four prototypes the same size and give each an identical ice pack?', choices: ['So that differences in temperature would result from the insulation design', 'So that every prototype would have the same mass', 'So that every prototype would cost the same', 'So that the room temperature would stay at 22°C'], answer: 0, explanation: 'Size and cooling source affect the inside temperature. Holding them constant means the temperature differences reflect the insulation. The prototypes still differ in mass and cost.' },
  { skill: E_EDT, d: 4, stimulus: lunchbox, stem: 'Prototype D kept the inside coldest. Why would the team most likely not choose Prototype D?', choices: ['It exceeds both the mass limit and the cost limit.', 'It did not meet the temperature criterion.', 'It has the thinnest walls.', 'It uses the same material as Prototype A.'], answer: 0, explanation: 'D reached 3.1°C, well within the temperature limit, but its 650 g mass is over 600 g and its 18-dollar cost is over 12 dollars. Its walls are the same 10 mm as A and C.' },
  { skill: LOCATE, d: 1, stimulus: lunchbox, stem: 'According to Table 1, what was the mass of Prototype C?', choices: ['380 g', '420 g', '560 g', '650 g'], answer: 0, explanation: 'Prototype C is listed with a mass of 380 g.' },
  { skill: S_EDT, d: 4, stimulus: lunchbox, stem: 'The team builds Prototype E from reflective bubble wrap with 20 mm walls. Based on the foam board results, its temperature after 4 hours would most likely be:', choices: ['lower than 6.2°C.', 'higher than 7.5°C.', 'between 6.2°C and 7.5°C.', 'exactly 6.2°C.'], answer: 0, explanation: 'Doubling foam board thickness lowered the temperature from 7.5°C to 4.8°C. The same change to bubble wrap (6.2°C at 10 mm) should most likely make it colder than 6.2°C.' },

  // Pendulum
  { skill: S_LOCATE, d: 1, stimulus: pendulum, stem: 'In Experiment 2, which variable was changed from trial to trial?', choices: ['Mass of the bob', 'Length of the string', 'Starting angle', 'Number of swings timed'], answer: 0, explanation: 'Experiment 2 kept the length at 1.00 m and the angle at 10° while varying the bob mass from 100 g to 800 g.' },
  { skill: S_LOCATE, d: 3, stimulus: pendulum, stem: 'Which experiments used a string length of 1.00 m in every trial?', choices: ['Experiments 2 and 3 only', 'Experiment 1 only', 'Experiments 1 and 2 only', 'Experiments 1, 2, and 3'], answer: 0, explanation: 'Experiments 2 and 3 both state a string length of 1.00 m. Experiment 1 varied the length from 0.25 m to 2.00 m.' },
  { skill: DESIGN, d: 3, stimulus: pendulum, stem: 'Why did the students time 10 complete swings and divide by 10 instead of timing a single swing?', choices: ['To reduce the effect of errors in starting and stopping the stopwatch', 'To make the bob swing faster', 'To change the length of the string', 'To increase the starting angle'], answer: 0, explanation: 'A reaction-time error of a fraction of a second is large compared with one 2-second swing but small compared with ten swings. Dividing by 10 spreads that error out.' },
  { skill: DESIGN, d: 4, stimulus: pendulum, stem: 'The students want to test whether air resistance affects the period. Which procedure would best accomplish this?', choices: ['Compare bobs of equal mass but very different sizes and shapes, using the same string length and starting angle.', 'Compare bobs of different masses on strings of different lengths.', 'Use the same bob on strings of different lengths.', 'Use the same bob and string but time only one swing.'], answer: 0, explanation: 'Size and shape change how much air the bob pushes against. Keeping mass, length, and angle the same isolates that effect. The other procedures change other variables or do not test air resistance.' },
  { skill: EXTEND, d: 3, stimulus: pendulum, stem: 'Based on Experiment 1, a pendulum with a 4.00 m string would most likely have a period closest to:', choices: ['4.0 s.', '2.84 s.', '3.4 s.', '8.0 s.'], answer: 0, explanation: 'Each time the length quadruples, the period doubles: 0.25 m gives 1.00 s and 1.00 m gives 2.01 s. Quadrupling 1.00 m to 4.00 m should give about 4.0 s.', check: 'Math.abs(2*Math.PI*Math.sqrt(4/9.8) - 4.0) < 0.05' },
  { skill: S_EXTEND, d: 4, stimulus: pendulum, stem: 'If Experiment 3 had included a trial with a starting angle of 60°, the period would most likely have been:', choices: ['greater than 2.07 s.', 'less than 2.01 s.', 'between 2.01 s and 2.02 s.', 'exactly 2.07 s.'], answer: 0, explanation: 'The period rose slightly as the angle increased, from 2.01 s at 5° to 2.07 s at 40°, and the increase grew with larger angles. At 60° it would most likely exceed 2.07 s.' },
  { skill: EXTEND, d: 3, stimulus: pendulum, stem: 'Based on Experiment 1, which string length would give a period of about 1.2 s?', choices: ['Between 0.25 m and 0.50 m', 'Less than 0.25 m', 'Between 0.50 m and 1.00 m', 'Between 1.00 m and 1.50 m'], answer: 0, explanation: 'A period of 1.2 s lies between 1.00 s (0.25 m) and 1.42 s (0.50 m), so the length would be between 0.25 m and 0.50 m.' },
  { skill: INFER, d: 3, stimulus: pendulum, stem: 'Based on Experiments 1 and 2, the period of a pendulum depends on:', choices: ['the length of the string but not noticeably on the mass of the bob.', 'the mass of the bob but not on the length of the string.', 'both the length of the string and the mass of the bob equally.', 'neither the length of the string nor the mass of the bob.'], answer: 0, explanation: 'In Experiment 1 the period rose from 1.00 s to 2.84 s as the length increased. In Experiment 2 it stayed at about 2.01 s for masses from 100 g to 800 g.' },
  { skill: RESULTS, d: 4, stimulus: pendulum, stem: 'A student hypothesized that heavier bobs swing more slowly. Do the results of Experiment 2 support this hypothesis?', choices: ['No; the period stayed at about 2.01 s for every mass.', 'Yes; the 800 g bob had the longest period.', 'Yes; the period doubled each time the mass doubled.', 'No; heavier bobs had much shorter periods.'], answer: 0, explanation: 'The periods were 2.01, 2.01, 2.00, and 2.01 s, with no meaningful change as mass increased from 100 g to 800 g.' },

  // Freezing points
  { skill: LOCATE, d: 1, stimulus: freezing, stem: 'According to Table 1, what is the freezing point of a 15% NaCl solution?', choices: ['−10.9°C', '−6.6°C', '−16.5°C', '−3.0°C'], answer: 0, explanation: 'The 15% row of Table 1 lists a freezing point of −10.9°C.' },
  { skill: LOCATE, d: 2, stimulus: freezing, stem: 'According to Table 2, which 10% solution had the highest freezing point?', choices: ['Sugar (sucrose)', 'Ethanol', 'Calcium chloride', 'Sodium chloride'], answer: 0, explanation: 'Sugar froze at −0.6°C, the highest (least negative) freezing point in Table 2.' },
  { skill: INFER, d: 2, stimulus: freezing, stem: 'Based on Table 1, as the concentration of NaCl increased, the freezing point of the solution:', choices: ['decreased.', 'increased.', 'stayed the same.', 'increased and then decreased.'], answer: 0, explanation: 'The freezing point fell from 0.0°C at 0% to −16.5°C at 20%.' },
  { skill: INFER, d: 4, stimulus: freezing, stem: 'Between which two consecutive concentrations in Table 1 did the freezing point change by the greatest amount?', choices: ['15% and 20%', '10% and 15%', '5% and 10%', '0% and 5%'], answer: 0, explanation: 'The changes are 3.0°C (0–5%), 3.6°C (5–10%), 4.3°C (10–15%), and 5.6°C (15–20%). The largest is between 15% and 20%.', check: 'Math.abs(-16.5 - -10.9) > Math.abs(-10.9 - -6.6) && Math.abs(-10.9 - -6.6) > Math.abs(-6.6 - -3.0)' },
  { skill: EXTEND, d: 3, stimulus: freezing, stem: 'Based on Table 1, a 12% NaCl solution would most likely freeze at about:', choices: ['−8.3°C', '−5.0°C', '−12.0°C', '−16.5°C'], answer: 0, explanation: '12% is 2/5 of the way from 10% (−6.6°C) to 15% (−10.9°C): −6.6 + 0.4 × (−4.3) ≈ −8.3°C.', check: 'Math.abs((-6.6 + 0.4*(-10.9 - -6.6)) - -8.3) < 0.05' },
  { skill: EXTEND, d: 4, stimulus: freezing, stem: 'If the trend in Table 1 continues, a 22% NaCl solution would most likely freeze at a temperature:', choices: ['below −16.5°C.', 'between −10.9°C and −16.5°C.', 'between 0.0°C and −3.0°C.', 'above 0.0°C.'], answer: 0, explanation: 'The freezing point keeps falling, and by larger amounts, as concentration rises. A concentration above 20% should freeze below −16.5°C.' },
  { skill: RESULTS, d: 3, stimulus: freezing, stem: 'Cities spread salt on roads in winter. Which statement is best supported by Table 1?', choices: ['Salt water freezes at a lower temperature than pure water, so salted roads can stay free of ice somewhat below 0°C.', 'Salt water freezes at a higher temperature than pure water.', 'Adding salt has no effect on the freezing point of water.', 'Salt water cannot freeze at any temperature.'], answer: 0, explanation: 'Every NaCl solution froze below 0.0°C, and more salt lowered the freezing point further, down to −16.5°C at 20%. The solutions do freeze, just at lower temperatures.' },
  { skill: RESULTS, d: 4, stimulus: freezing, stem: 'A student claims that, at the same percent by mass, every dissolved substance lowers the freezing point of water by the same amount. Do the data in Table 2 support this claim?', choices: ['No; at 10%, sugar lowered the freezing point to only −0.6°C, while NaCl lowered it to −6.6°C.', 'Yes; all four 10% solutions froze at −6.6°C.', 'Yes; all four solutions froze below 0°C.', 'No; some 10% solutions froze above 0°C.'], answer: 0, explanation: 'The four 10% solutions froze at −0.6, −4.4, −5.9, and −6.6°C, so the effect depends on the substance. None froze above 0°C.' },

  // Moon
  { skill: COMPARE, d: 2, stimulus: moon, stem: 'Which hypothesis proposes that the Moon formed far from Earth?', choices: ['Hypothesis 1', 'Hypothesis 2', 'Hypothesis 3', 'All three hypotheses'], answer: 0, explanation: 'Hypothesis 1 says the Moon formed "in a different part of the solar system" and was later captured.' },
  { skill: COMPARE, d: 3, stimulus: moon, stem: 'According to Hypothesis 3, the Moon formed mostly from:', choices: ['rocky outer-layer material from Earth and the impacting body.', "material from Earth's iron core.", 'material from a distant part of the solar system.', 'a separate disk of gas that never touched Earth.'], answer: 0, explanation: 'Hypothesis 3 says the debris came "mostly from the rocky outer layers (mantles) of Earth and the impacting body."' },
  { skill: COMPARE, d: 3, stimulus: moon, stem: 'Which hypotheses propose that the Moon formed from material near Earth?', choices: ['Hypotheses 2 and 3 only', 'Hypothesis 1 only', 'Hypotheses 1 and 2 only', 'Hypotheses 1, 2, and 3'], answer: 0, explanation: 'Hypothesis 2 has the Moon forming beside Earth from the same disk, and Hypothesis 3 has it forming from debris thrown off Earth. Hypothesis 1 has it forming elsewhere.' },
  { skill: COMPARE, d: 4, stimulus: moon, stem: 'Hypotheses 2 and 3 differ in that only Hypothesis 3:', choices: ['involves a collision whose heat melted the material that formed the Moon.', 'proposes that the Moon formed near Earth.', 'proposes that the Moon was captured by Earth\'s gravity.', 'proposes that Earth and the Moon formed at the same time from the same disk.'], answer: 0, explanation: 'Only Hypothesis 3 describes a collision and melting. Both hypotheses place the Moon\'s formation near Earth, capture is Hypothesis 1, and forming side by side from one disk is Hypothesis 2.' },
  { skill: M_EXTEND, d: 4, stimulus: moon, stem: "The observation that Moon rocks have oxygen isotope ratios nearly identical to Earth's is most difficult to explain under:", choices: ['Hypothesis 1, because bodies that formed in different parts of the solar system usually have different ratios.', 'Hypothesis 2, because Earth and the Moon formed from the same material.', 'Hypothesis 3, because the Moon formed partly from Earth\'s mantle.', 'all three hypotheses equally.'], answer: 0, explanation: 'Observation 2 notes that bodies formed in different places usually differ in isotope ratios. A Moon formed elsewhere and captured would be expected to differ from Earth, but it does not.' },
  { skill: M_EXTEND, d: 4, stimulus: moon, stem: "Which hypothesis best explains why the Moon has only a small iron core?", choices: ['Hypothesis 3, because the Moon formed mostly from rocky mantle material rather than core material', 'Hypothesis 2, because Earth and the Moon formed from the same mix of material', 'Hypothesis 1, because the Moon was captured by Earth\'s gravity', 'None of the hypotheses addresses the Moon\'s composition'], answer: 0, explanation: 'Debris from the rocky outer layers would contain little iron, matching the small core and low density. Forming from the same material as Earth (Hypothesis 2) would predict a similar iron content, and capture says nothing about composition.' },
  { skill: M_EXTEND, d: 3, stimulus: moon, stem: "Evidence that much of the Moon's outer layer was once melted most strongly supports:", choices: ['Hypothesis 3', 'Hypothesis 1', 'Hypothesis 2', 'none of the hypotheses'], answer: 0, explanation: 'Only Hypothesis 3 includes a source of intense heat: the collision "melted much of this debris."' },
  { skill: M_EXTEND, d: 3, stimulus: moon, stem: "Suppose astronomers discovered a planet whose large moon has a very different composition from the planet. This finding would be most consistent with the process described in:", choices: ['Hypothesis 1', 'Hypothesis 2', 'Hypothesis 3', 'none of the hypotheses'], answer: 0, explanation: 'A captured moon formed elsewhere would be expected to differ in composition from its planet. Forming from the same disk or from the planet\'s own mantle would produce a similar composition.' },
];

export default shuffled(items);
