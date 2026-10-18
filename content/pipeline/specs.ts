// Per-skill item patterns for generation, distilled from reports/SAT and ACT question patterns.md
// (clean-room: abstract templates and generic functional stems only; no official items).
// Every distractor must carry one of the skill's error codes, so a wrong choice is always wrong
// for a reason a teacher can name.

export interface SkillSpec {
  /** Generic functional stems; use one verbatim (bracketed slots filled). */
  stems: string[];
  /** Shape of the passage / given / context. */
  stimulus: string;
  /** How the single defensible key is built. */
  key: string;
  /** Error-type codes to draw the three distractors from, with what each means. */
  distractors: Record<string, string>;
  /** Skill-specific difficulty dials (added to the section-level knobs). */
  hard?: string;
  /** Allow student-produced response (SAT Math only). */
  spr?: boolean;
  never?: string[];
}

export interface SectionSpec {
  format: string;
  knobs: { easy: string; medium: string; hard: string };
  never: string[];
}

const SEC_STEM = 'Which choice completes the text so that it conforms to the conventions of Standard English?';

export const SECTION_SPEC: Record<string, SectionSpec> = {
  'sat.rw': {
    format:
      'Digital SAT Reading and Writing. One discrete item on its own passage of 25–150 "standard words" (characters ÷ 6; a Text 1/Text 2 pair counts combined). Exactly four choices, parallel in grammar and length, single best answer. Subjects: literature, history/social studies, humanities, science. All passages are original and written for PrepPath (no attribution line, no real quotations). Graphics only as a Markdown table (no calculation needed). A blank is written exactly as ______ (six underscores). Stems are short and functional; difficulty comes from the reasoning and the foils, never from convoluted wording.',
    knobs: {
      easy: 'grade 6–8 text; explicit clue or signal word; distractors from clearly different categories',
      medium: 'grade 9–11 text; one inference step; one near-miss foil',
      hard: 'grade 12–14 academic text; implicit clue or two-step logic; two near-miss foils (same-category transition, half-right, accurate-but-off-goal); buried subject or negation in the passage',
    },
    never: [
      'NO CHANGE options',
      'NOT / EXCEPT / LEAST stems',
      'paired "which quotation supports the previous answer" items',
      'sentence placement, add/delete or concision items',
      'rare "SAT vocabulary" words',
      'all/none of the above',
      'a key that is systematically the longest choice',
    ],
  },
  'sat.math': {
    format:
      'Digital SAT Math (Desmos and the reference sheet are available). Discrete items. Multiple choice has exactly four choices; numeric choices are usually ascending (occasionally descending), all in the same form. Student-produced response (SPR) has no choices. "Given" items display the equation or expression first on its own line, then a one-line stem; constants are introduced in a separate sentence ("In the given equation, k is a constant."). Context items stay at or under about 50 words. Figures are drawn to scale unless the stem says "Note: Figure not drawn to scale." Math uses LaTeX inside $...$; write money as \\$12 (escaped) and never put words inside $...$.',
    knobs: {
      easy: 'one or two steps, concrete numbers, Desmos-friendly',
      medium: 'translate a context, interpret a coefficient or intercept, elimination with scaling',
      hard: 'all-letter constants, discriminant or no-solution parameters, a derived-quantity target (not x), structure beats graphing',
    },
    never: [
      'complex numbers',
      'the polynomial remainder theorem',
      'a fifth choice',
      'SPR keys longer than 5 characters (6 if negative) or needing %, $ or commas (percent items ask "what percent" and key the bare number)',
      'all/none of the above',
    ],
  },
  'act.math': {
    format:
      'Enhanced ACT Math. Discrete multiple-choice items (no shared stimulus sets) with exactly four choices, no formula sheet, calculator allowed but a four-function calculator must suffice. Supply any unusual formula (law of sines, conic standard form, sphere/cone volume) in the item; do not supply must-know formulas (area, circumference, prism/cylinder volume, Pythagorean theorem, SOHCAHTOA, slope, quadratic formula, nth term, nPr/nCr). Units sit in the stem between commas ("what is the height, in feet, of"); non-standard conversions appear as "(Note: 1 [unit] = n [unit])". Standing conventions: figures not necessarily drawn to scale, "line" means straight line, "average" means arithmetic mean, the standard (x,y) coordinate plane. Choices are monotonic (mostly ascending), radicals as a√b, π kept symbolic, all four in the same form. Math uses LaTeX inside $...$; write money as \\$12 (escaped) and never put words inside $...$.',
    knobs: {
      easy: 'single concept; one-step procedures (advanced topics like matrices, complex numbers and radicals belong here as one-step items)',
      medium: 'two- or three-step chains; table or unit chains',
      hard: 'three or more chained steps; bounds or extremes; composition from a table; weighted expectation; representation shifts; foils from the most common errors. Difficulty comes from chaining and abstraction, NOT from an exotic topic.',
    },
    never: ['"Cannot be determined"', 'all/none of the above', 'a fifth choice', 'anything needing more than a four-function calculator', 'NOT / EXCEPT stems'],
  },
};

export const SKILL_SPEC: Record<string, SkillSpec> = {
  // ---------------------------------------------------------------- SAT RW
  'sat.rw.cs.words': {
    stems: ['Which choice completes the text with the most logical and precise word or phrase?'],
    stimulus: '1–3 sentences: a claim containing ______ plus a clue clause that pins the meaning (restatement after a colon or semicolon, contrast with "although"/"rather than", or an example).',
    key: 'A tier-two, high-utility academic word whose meaning matches the clue; all four choices are the same part of speech.',
    distractors: {
      antonymTone: 'opposite in tone or direction to the clue',
      topicAssociated: 'a word that fits the topic but does not match the clue',
      commonDictionarySense: 'right for another sense of the idea, wrong in this context',
      unlicensedConnotation: 'adds an implication the text does not support (hard items)',
    },
    hard: 'clue inferred from the whole passage; four sophisticated but common academic words; a familiar word in a secondary sense',
  },
  'sat.rw.cs.structure': {
    stems: [
      'Which choice best states the main purpose of the text?',
      'Which choice best describes the function of the underlined sentence in the text as a whole?',
      'Which choice best describes the overall structure of the text?',
    ],
    stimulus: 'A conventional view → challenge → evidence, or general claim → example → qualification. For the function variant, one sentence is underlined with Markdown __like this__.',
    key: 'An abstract, verb-led function description ("To present … and then …"), not a topic summary.',
    distractors: {
      topicNotPurpose: 'names the topic instead of the job the text does',
      wrongFunctionVerb: 'assigns a function the text does not perform',
      otherSentenceFunction: 'describes what a different sentence does',
      halfRightTwoPart: 'two-part description with only one half accurate',
      overstatedStance: 'e.g. "to refute" when the text only qualifies',
      falseLinkToPrior: 'claims a relationship to a sentence it has no logical link to',
    },
  },
  'sat.rw.cs.crosstext': {
    stems: [
      'Based on the texts, how would [the author of Text 2 / the researchers in Text 2] most likely respond to [the underlined claim / the view presented] in Text 1?',
      'Based on the texts, how would [the author of Text 1] most likely describe [the finding / approach] in Text 2?',
    ],
    stimulus: 'Labeled "Text 1" (~60 words: a view or hypothesis, optionally an underlined claim) and "Text 2" (~60 words: a named researcher, a study, a result bearing on Text 1). At most 150 standard words combined.',
    key: 'Names the relationship precisely: qualifies, challenges, supports, or accepts the observation but rejects the explanation.',
    distractors: {
      wrongDirection: 'support where Text 2 challenges, or the reverse',
      rightDirectionTooStrong: 'right direction, wrong strength ("entirely wrong" vs "incomplete")',
      pointNotInText1: 'responds to a point Text 1 never made',
      swappedAuthors: 'attributes one author’s view to the other',
    },
    hard: 'both texts share the phenomenon and disagree only about its cause',
  },
  'sat.rw.ii.central': {
    stems: ['Which choice best states the main idea of the text?', 'According to the text, what is true about [subject]?'],
    stimulus: 'A profile or explanation: who/what → characteristic practice or finding → example → significance; or an original literary-style narrative excerpt revealing a character’s state of mind.',
    key: 'A faithful paraphrase at whole-text scope.',
    distractors: {
      unstatedEvaluative: 'a plausible evaluative claim the text never makes ("widely acclaimed") — include one in every item',
      contradictedDetail: 'contradicts a detail in the text',
      tooNarrow: 'true of one detail only',
      tooBroad: 'overgeneralizes beyond the text',
    },
  },
  'sat.rw.ii.evidence_text': {
    stems: [
      'Which finding, if true, would most directly support [the researcher’s hypothesis / the claim]?',
      'Which finding, if true, would most directly weaken [the researcher’s hypothesis / the claim]?',
      'Which quotation from [an original text described in the passage] most effectively illustrates the claim?',
    ],
    stimulus: 'Hypothesis family: a named (fictional) researcher, a hypothesis that M causes O, and a study design. Quotation family: a two-part claim about an original work ending with a colon (no real works).',
    key: 'The result predicted only if the hypothesis is true, on the hypothesized dimension; never a restatement of the claim. For quotations, the one covering both parts of the claim.',
    distractors: {
      oppositeResult: 'the result the hypothesis predicts against',
      unrelatedMeasuredVariable: 'a difference on a variable with no link to the hypothesis',
      nonDiscriminating: 'a result expected whether the hypothesis or its rival is true (hard)',
      nearbyHypothesis: 'supports a related but different claim (hard)',
      partAOnly: 'quotation showing only the first part of the claim',
      partBOnly: 'quotation showing only the second part of the claim',
    },
  },
  'sat.rw.ii.evidence_quant': {
    stems: [
      'Which choice most effectively uses data from the table to complete the example?',
      'Which choice most effectively uses data from the table to support the [researcher’s] claim?',
      'Which choice most effectively uses data from the table to complete the statement?',
    ],
    stimulus: 'Named (fictional) researchers and a comparative claim, then a Markdown table of 2–4 series × 2–5 columns with units in the headers. The text ends with ______. Real-world plausible values; no calculation beyond reading and comparing values.',
    key: 'The only choice that is accurate to the table AND instantiates the exact claim.',
    distractors: {
      wrongComparisonPair: 'accurate data, compares the wrong groups',
      wrongDirection: 'accurate data, opposite direction to the claim',
      singleSeries: 'accurate about one series only when the claim compares',
      irrelevantSeries: 'accurate but about a series the claim is not about',
      finalValueNotChange: 'reports the highest final value when the claim is about change',
      countVsPercent: 'mixes counts and percents',
    },
    never: ['any distractor that misreports the table (every choice must be data-accurate)'],
  },
  'sat.rw.ii.inferences': {
    stems: ['Which choice most logically completes the text?'],
    stimulus: 'An unfinished argument ending at ______: a puzzle with explanations ruled out one by one, a premise chain, or a new finding that limits an old assumption.',
    key: 'The most modest conclusion the premises force.',
    distractors: {
      overgeneralization: 'extends one case to "many" or "most"',
      knownUnknownReversed: 'misidentifies what is known vs unknown',
      needsUnstatedPremise: 'depends on an assumption the text does not support',
      recycledWordsNewClaim: 'reuses passage words to make a different claim',
    },
    hard: 'a second inferential step, or a negation ("cannot be ruled out")',
  },
  'sat.rw.ei.synthesis': {
    stems: ['The student wants to [plain goal]. Which choice most effectively uses relevant information from the notes to accomplish this goal?'],
    stimulus: 'Starts exactly "While researching a topic, a student has taken the following notes:" then 4–6 one-fact bullets ("- "), one or two irrelevant to the goal. The goal sentence goes in the stem.',
    key: 'The only choice that meets the stated goal. All four choices are grammatical and accurate to the notes.',
    distractors: {
      otherGoalMet: 'accomplishes a different plausible goal',
      wrongConnector: 'contrast connector for a similarity goal, or the reverse',
      generalVsSpecific: 'general when the goal asks for specifics, or the reverse',
      oneItemOnly: 'covers one item when the goal compares two',
      methodNotFindings: 'presents method when the goal asks for findings',
      audienceMismatch: 'assumes knowledge an unfamiliar audience lacks',
    },
    never: ['ungrammatical or inaccurate choices'],
  },
  'sat.rw.ei.transitions': {
    stems: ['Which choice completes the text with the most logical transition?'],
    stimulus: '2–4 sentences; the blank ______ opens the final sentence (followed by a comma).',
    key: 'The transition matching the relationship between the previous and the final sentence (contrast, continuation/addition, cause/effect, example, sequence, concession, emphasis).',
    distractors: {
      wrongCategory: 'a transition from a different logical category (one per wrong category on easy items)',
      sameCategoryNearMiss: 'same broad category, wrong nuance (however vs instead; for example vs in other words) — hard items',
    },
    never: ['choices that differ in punctuation'],
  },
  'sat.rw.sec.boundaries': {
    stems: [SEC_STEM],
    stimulus: '1–2 sentences (no more); the blank ______ sits at a clause or phrase junction. Tag the subskill: between sentences, within sentences, supplements, or no punctuation needed.',
    key: 'The single correct punctuation, which can be "no punctuation". The four choices contain identical words and differ only in punctuation (sometimes with a conjunctive adverb).',
    distractors: {
      commaSplice: 'comma alone between independent clauses',
      fragmentPeriod: 'period that leaves a fragment',
      commaBeforeConjAdverb: 'comma before "however/therefore" joining clauses',
      colonAfterIncomplete: 'colon after an incomplete clause',
      mismatchedSupplementPair: 'dash opening, comma closing (or similar)',
      subjectVerbComma: 'punctuation between a subject and its verb',
    },
    never: ['two equivalent correct options (e.g. period and semicolon both valid)'],
  },
  'sat.rw.sec.form': {
    stems: [SEC_STEM],
    stimulus: '1–2 sentences with a governor (subject, antecedent, time marker, or modified noun) separated from the blank ______. Tag the subskill: subject-verb, pronoun-antecedent, finiteness, tense-aspect, modifier placement, or genitives-plurals.',
    key: 'The form that matches the governor; choices vary one word’s form (or, for modifiers, four main-clause openings).',
    distractors: {
      nearestNounAgreement: 'agrees with an intervening noun of the opposite number',
      wrongTenseForTimeline: 'tense inconsistent with the time markers',
      nonfiniteMainVerb: 'participle or infinitive where a finite verb is needed',
      danglingModifier: 'clause opening that does not name the modified noun',
      possessivePluralSwap: 'plural where possessive is needed or the reverse',
      itsItsSwap: "its/it's, their/they're confusion",
    },
    hard: 'long intervening phrases, inverted order, collective nouns',
  },

  // -------------------------------------------------------------- SAT Math
  'sat.math.alg.lin1': {
    stems: ['What value of $x$ is the solution to the given equation?', 'Which equation represents this situation?', 'How many solutions does the given equation have?', 'If [equation], what is the value of [expression in x]?'],
    stimulus: 'A given linear equation in one variable, or a short context (fee plus rate, etc.).',
    key: 'Solve, build, or interpret; or the no/one/infinitely-many-solutions condition.',
    distractors: {
      halfwayValue: 'the value after the first step',
      distributionSign: 'sign error distributing a negative',
      partialLcd: 'LCD applied to only some terms',
      swappedRateFee: 'rate and fixed amount swapped',
      solutionCountSwap: 'the infinite-solution value offered in a no-solution item',
    },
    hard: 'a parameter with nonobvious scaling, all-letter coefficients, or the target is an expression like $3x-2$',
    spr: true,
  },
  'sat.math.alg.lin2': {
    stems: ['Which equation represents this situation?', 'What is the slope of the line in the xy-plane defined by the given equation?', 'Which of the following equations defines a line that is perpendicular to line $\\ell$?', 'What is the best interpretation of [coefficient] in this context?'],
    stimulus: 'Ax + By = C constraint context, two points, or a given line.',
    key: 'Build, read slope/intercept, parallel/perpendicular, or interpret a coefficient.',
    distractors: {
      swappedCoefficients: 'coefficients swapped between item types',
      slopeSign: 'slope +A/B instead of −A/B',
      perpendicularHalf: 'negated but not reciprocated (or the reverse)',
      interceptSwap: 'x- and y-intercept confused',
    },
    hard: '−A/B as a tradeoff rate; fractional perpendicular slopes',
    spr: true,
  },
  'sat.math.alg.linfn': {
    stems: ['What is the value of $f([a])$?', 'For what value of $x$ is $f(x) = [c]$?', 'Which equation defines $f$?', 'What is the best interpretation of [number] in this context?'],
    stimulus: 'A linear function rule, a table of values, two points, or a context model.',
    key: 'Evaluate, solve, build the rule, or interpret slope and intercept.',
    distractors: {
      inverseSlope: 'Δx/Δy instead of Δy/Δx',
      singlePointSlope: 'slope from one point',
      firstRowIntercept: 'table’s first row taken as the intercept',
      rateAsTotal: 'rate described as a total',
      scalingSlip: 'per-10-units scaling slip',
    },
    hard: 'shifted-input forms $m(x-h)+k$; nonunit table spacing; product-of-rates coefficients',
    spr: true,
  },
  'sat.math.alg.systems': {
    stems: ['If $(x, y)$ is the solution to the given system of equations, what is the value of [x / y / x + y]?', 'Which system of equations represents this situation?', 'For what value of $k$ does the given system have no solution?', 'How many solutions does the given system of equations have?'],
    stimulus: 'A given system of two linear equations, or a two-constraint context.',
    key: 'Solve, combine for a requested quantity, build, or parameter condition.',
    distractors: {
      otherVariable: 'the value of the other variable',
      sumVsDifference: 'a sum when a difference was asked',
      unscaledConstant: 'equation scaled without scaling its constant',
      couldNotMisread: '"could NOT be" condition misread',
    },
    hard: 'two-constant conditions; a request for a/b; system as one equation plus a graph',
    spr: true,
  },
  'sat.math.alg.ineq': {
    stems: ['Which inequality represents this situation?', 'Which point $(x, y)$ is a solution to the given system of inequalities?', 'What is the greatest possible [integer] value of [x] that satisfies the given inequality?'],
    stimulus: 'A word constraint ("at most", "no more than"), a given inequality or system.',
    key: 'Build, test a point, or find the max/min count.',
    distractors: {
      atMostAtLeast: 'at most ↔ at least',
      strictSwap: 'strict ↔ non-strict',
      noFlip: 'sign not flipped when dividing by a negative',
      boundRounding: 'bound rounded the wrong way',
    },
    hard: 'a system with a constant k; integer maximization under compound constraints',
    spr: true,
  },
  'sat.math.adv.equiv': {
    stems: ['Which expression is equivalent to the given expression?', 'The given equation is true for all values of $x$, where $a$ and $b$ are constants. What is the value of $a$?'],
    stimulus: 'A given polynomial, rational expression or rational-exponent expression.',
    key: 'Expand, factor, simplify, or match coefficients.',
    distractors: {
      freshmansDream: '$(a+b)^2 = a^2 + b^2$',
      subtractionSign: 'sign error subtracting a polynomial',
      exponentRule: 'exponent rule misapplied',
      cancelTerms: 'cancelling terms rather than factors',
      rightProductWrongSum: 'right product, wrong sum of factors',
    },
    hard: 'identity matching with parameters so a Desmos overlay does not settle it',
    spr: true,
  },
  'sat.math.adv.nonlineq': {
    stems: ['What is the positive solution to the given equation?', 'How many distinct real solutions does the given equation have?', 'What is the sum of the solutions to the given equation?', 'In the given equation, $k$ is a constant. For what value of $k$ does the equation have exactly one real solution?'],
    stimulus: 'A quadratic in any form, absolute value, radical or rational equation, a linear–quadratic system, or a literal equation.',
    key: 'Solve, count roots, discriminant condition, or a derived quantity.',
    distractors: {
      negativeRoot: 'the negative root when positive was asked',
      extraneousKept: 'an extraneous root kept',
      discriminantInverted: 'discriminant sign rule inverted',
      missingPlusMinus: 'missing ±',
      rootNotSum: 'a root instead of the sum or product',
    },
    hard: 'k inside a, b, c; tangency (Δ = 0); sum of irrational roots via −b/a',
    spr: true,
  },
  'sat.math.adv.nonlinfn': {
    stems: ['Which equation could define $f$?', 'What is the minimum value of $f(x)$?', 'Which of the following is the best interpretation of [number] in this context?', 'Which equivalent form of the equation displays [the vertex / the initial value] as a constant or coefficient?'],
    stimulus: 'A quadratic or exponential model, a graph described in words or a table, or a transformation.',
    key: 'Model, most-suitable form, transformation, f(0) or zeros.',
    distractors: {
      growthFactor: 'p instead of 1 + p/100',
      periodSlip: 't vs t/period',
      vertexSign: 'vertex sign flipped',
      maxVsLocation: 'location of the max instead of the max',
      linearInExponential: 'a linear model in an exponential context',
    },
    hard: 'two-point exponential with a product of constants; period-adjusted percent; completing the square with a ≠ 1',
    spr: true,
  },
  'sat.math.psda.ratios': {
    stems: ['What is the [quantity], in [units], of …?', 'At this rate, how many [units] …?'],
    stimulus: 'A rate, scale, or derived-unit context with a multistep conversion.',
    key: 'Correct chain of conversions.',
    distractors: {
      invertedFactor: 'conversion factor inverted',
      linearForArea: 'linear factor applied to square or cubic units',
      partWhole: 'part:part vs part:whole',
      skippedLink: 'a link in the chain skipped',
    },
    hard: 'multidimensional conversions; combined rates',
    spr: true,
  },
  'sat.math.psda.percent': {
    stems: ['[x] is what percent of [y]?', 'What percent [greater / less] is …?', 'Which expression represents … after the two changes?'],
    stimulus: 'Percent change, reverse percent, successive changes, or percent of percent.',
    key: 'Multipliers, not added percents. SPR percent items key the bare number.',
    distractors: {
      percentDifference: 'p − q or p + q instead of a multiplier',
      ratioInverted: 'q/p instead of p/q',
      newValueBase: 'new value used as the denominator',
      addedPercents: 'successive percents added',
    },
    hard: 'lettered chains; increases of 100% or more; reverse after two changes',
    spr: true,
  },
  'sat.math.psda.onevar': {
    stems: ['What is the median of the data?', 'Which of the following is true about the means / standard deviations of the two data sets?'],
    stimulus: 'A frequency table, dot plot or list (rendered as a Markdown table or text).',
    key: 'Mean, median, range, SD comparison, or outlier effect.',
    distractors: {
      medianOfFrequencies: 'median of the frequency column',
      unweightedMean: 'mean ignoring frequencies',
      rangeVsIqr: 'range and IQR confused',
    },
    hard: 'even-count frequency median; average-sum with an unknown (mean × n)',
    spr: true,
  },
  'sat.math.psda.twovar': {
    stems: ['Based on the line of best fit, what is the predicted [y] when [x] is …?', 'What is the best interpretation of the slope of the line of best fit in this context?'],
    stimulus: 'A scatterplot described with a stated line of best fit, or a table with a model.',
    key: 'Prediction, slope interpretation, residual, or model choice.',
    distractors: {
      residualNotPrediction: 'the residual or an actual point instead of the prediction',
      adjacentX: 'reading at the adjacent x-value',
      exponentialAsLinear: 'exponential described as constant change',
    },
    hard: 'counting points above the line; linear vs exponential comparison',
    spr: true,
  },
  'sat.math.psda.prob': {
    stems: ['If one of these [people / items] is selected at random, what is the probability that …?', 'Given that … , what is the probability that …?'],
    stimulus: 'A two-way table (Markdown) or a described sample space.',
    key: 'P(A) or P(A | B) with the right denominator; or find a missing cell.',
    distractors: {
      grandTotalDenominator: 'grand total used for a conditional probability',
      rowColumnSwap: 'row and column swapped',
      complement: 'the complement',
    },
    hard: 'conditional built into the selection pool; reverse problems',
    spr: true,
  },
  'sat.math.psda.inference': {
    stems: ['Which of the following is the most plausible conclusion …?', 'Based on the margin of error, which value is a plausible …?'],
    stimulus: 'A random sample, an estimate and a margin of error.',
    key: 'Interval about the population parameter, only for the sampled population.',
    distractors: {
      intervalForIndividuals: 'interval applied to individuals',
      estimateAsExact: 'estimate treated as exact',
      sampleSizeMargin: '"larger sample, larger margin"',
      tooBroadPopulation: 'generalizes beyond the sampled population',
    },
  },
  'sat.math.psda.claims': {
    stems: ['Which of the following is the most appropriate conclusion?'],
    stimulus: 'A study description: whether participants were randomly selected and whether treatments were randomly assigned.',
    key: 'The cell of {causal or not} × {sample only or broader population} the design supports.',
    distractors: { wrongCell: 'one of the three other cells of the causal × population grid' },
    hard: 'random assignment present but sampling not random',
  },
  'sat.math.geo.area': {
    stems: ['What is the volume, in cubic [units], of …?', 'What is the area, in square [units], of …?'],
    stimulus: 'A described figure or solid with labeled dimensions; or a scale-factor relation.',
    key: 'Correct formula (reference sheet available) and scaling k, k², k³.',
    distractors: {
      wrongPower: 'k or k² used instead of k³',
      diameterAsRadius: 'diameter used as the radius',
      missingThird: 'missing 1/3 for cones and pyramids',
      missingFaces: 'faces missing from surface area',
    },
    hard: 'scale factor inferred from an area ratio, then applied to volume',
    spr: true,
  },
  'sat.math.geo.lines': {
    stems: ['What is the value of $x$?', 'Which additional piece of information is sufficient to prove that …?'],
    stimulus: 'Parallel lines with a transversal, a triangle, or similar triangles described in words.',
    key: 'Angle relationships, angle sum, or similarity correspondence.',
    distractors: {
      supplementaryVsEqual: 'supplementary and equal angles confused',
      mismatchedCorrespondence: 'wrong vertex correspondence',
      additiveSimilarity: 'additive instead of multiplicative reasoning',
    },
    hard: 'proof-sufficiency items; nested triangles',
    spr: true,
  },
  'sat.math.geo.trig': {
    stems: ['What is the value of $\\sin [A]$?', 'What is the length of [side]?', 'In the given equation, what is the value of $x$? [sin/cos complementary relation]'],
    stimulus: 'A right triangle described with side lengths or angles; special right triangles; radians.',
    key: 'Pythagorean theorem, special right triangles, SOHCAHTOA, sin x = cos(90° − x).',
    distractors: {
      reciprocalRatio: 'reciprocal ratio',
      oppositeAdjacentSwap: 'opposite and adjacent swapped',
      hypotenuseAsLeg: 'hypotenuse used as a leg',
      degreeRadianMix: 'degrees and radians mixed',
    },
    hard: 'complementary-angle equation in x; structure-only fraction answers',
    spr: true,
  },
  'sat.math.geo.circles': {
    stems: ['What is the radius of the circle?', 'What are the coordinates of the center of the circle?', 'What is the length of arc [AB]?'],
    stimulus: 'A circle equation in standard or general form, or a described circle with an arc or sector.',
    key: 'Complete the square, arc/sector proportion, inscribed angle.',
    distractors: {
      rSquaredAsR: 'r² reported as r',
      centerSigns: 'center signs flipped',
      arcVsSector: 'arc and sector confused',
      degreeForRadian: 'degree answer when radians were asked',
    },
    hard: 'general form with constant k; radian arc and sector',
    spr: true,
  },
};

/** ACT Math: one shared recipe; the skill name supplies the topic. */
const ACT_MATH: SkillSpec = {
  stems: [
    'What is the value of $x$?',
    'Which of the following is equivalent to [expression]?',
    'If [equation], then $x = $ ?',
    'Which of the following could be [quantity]?',
    'What is the [quantity], to the nearest [unit]?',
    'Which of the following values of $x$, if any, … ?',
    'What is the greatest possible value of … ?',
    'What is the probability that … ?',
    'In the standard $(x,y)$ coordinate plane, … ?',
  ],
  stimulus: 'A short word problem (24–29% of items are in a real-world context), a small table, or a described labeled figure. No shared stimulus.',
  key: 'Computed key. "There is no such value" may be offered (and occasionally keyed) only on an "if any" stem.',
  distractors: {
    intermediate: 'a value from partway through the solution, not the final requested quantity',
    wrongBase: 'wrong base quantity (column or grand total instead of row total)',
    otherQuantity: 'answers a different quantity',
    signFlip: 'sign error',
    inverted: 'inverted proportion or reciprocal ratio',
    freshmansDream: 'distributing a power over a sum',
    offByOne: 'off by one step or index (e.g. n instead of n−1 terms or periods)',
    droppedPi: 'factor of π dropped',
    diameterAsRadius: 'diameter used as the radius',
    skippedConversion: 'a link in a unit chain skipped',
    unweightedAverage: 'unweighted mean in expected value or mean problems',
  },
  hard: 'For hard expression items include a foil that agrees with the key at x = 2 or 3, so plugging in alone does not settle it.',
};

/** Catch-all like College Board's "conceptual or calculation errors" rationale; the rationale must name the error. */
export const OTHER_ERROR = { other: 'a specific conceptual or calculation error not listed above; the rationale must state exactly what wrong step produces this choice' };

export function specFor(skillId: string): SkillSpec | null {
  const base = SKILL_SPEC[skillId] ?? (skillId.startsWith('act.math.') ? ACT_MATH : null);
  return base && { ...base, distractors: { ...base.distractors, ...OTHER_ERROR } };
}

export function sectionSpecFor(sectionId: string): SectionSpec | null {
  return SECTION_SPEC[sectionId] ?? null;
}
