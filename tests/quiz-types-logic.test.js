// tests/quiz-types-logic.test.js
// Standalone & Integration unit test runner for 4-Type MCQ Generator and Interleaver

import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import {
  MCQ_SUBTYPES,
  MCQ_TYPES,
  FALLBACK_ENGLISH_DISTRACTORS,
  FALLBACK_VIETNAMESE_DISTRACTORS,
  blankAnswerInSentence,
  pickEnglishDistractors,
  pickVietnameseDistractors,
  rotateMCQType,
  generateInterleavedMCQTypes,
  generateMCQQuestion,
  evaluateMCQAnswer,
} from '../src/utils/quizGenerators.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`    ✅ [PASS] ${message}`);
  } else {
    console.error(`    ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runQuizTypesLogicTests() {
  console.log('===============================================================');
  console.log('🧪 HIVOCAB 4-TYPE MCQ GENERATOR & LOGIC UNIT TEST SUITE');
  console.log('===============================================================\n');

  // Sample Test Fixtures
  const sampleWords = [
    {
      id: 'w1',
      word: 'meticulous',
      phonetic: 'məˈtɪkjələs',
      pos: 'adjective',
      meaning: 'tỉ mỉ, cẩn thận',
      example_sentence: 'She made a meticulous record of all expenses.',
    },
    {
      id: 'w2',
      word: 'abandon',
      phonetic: 'əˈbændən',
      pos: 'verb',
      meaning: 'từ bỏ, ruồng bỏ',
      example_sentence: 'The crew was forced to abandon the sinking ship.',
    },
    {
      id: 'w3',
      word: 'resilient',
      phonetic: 'rɪˈzɪliənt',
      pos: 'adjective',
      meaning: 'kiên cường, có khả năng phục hồi',
      example_sentence: 'Children are surprisingly resilient to hardship.',
    },
    {
      id: 'w4',
      word: 'collaborate',
      phonetic: 'kəˈlæbəreɪt',
      pos: 'verb',
      meaning: 'hợp tác, cộng tác',
      example_sentence: 'Scientists collaborate across international borders.',
    },
    {
      id: 'w5',
      word: 'scrutinize',
      phonetic: 'ˈskruːtənaɪz',
      pos: 'verb',
      meaning: 'xem xét kỹ lưỡng',
      example_sentence: 'Inspectors scrutinize every component before release.',
    },
  ];

  // ── GROUP 1: 4-Type MCQ Generation Contract & Invariants ──────────────
  console.log('🔹 GROUP 1: 4-Type MCQ Generation Contract & Invariants');
  {
    // 1.1 Type 1: Meaning to Word
    const q1 = generateMCQQuestion(sampleWords[0], sampleWords, 'meaning_to_word');
    assert(q1 && q1.type === 'meaning_to_word', 'G1.1.1: Generates Type 1 meaning_to_word question');
    assert(q1.options.length === 4, 'G1.1.2: Type 1 produces exactly 4 options');
    const correctOptions1 = q1.options.filter(o => o.isCorrect);
    assert(correctOptions1.length === 1, 'G1.1.3: Type 1 contains exactly 1 correct option');
    assert(correctOptions1[0].text === 'meticulous', 'G1.1.4: Type 1 correct option matches target English word');
    assert(q1.prompt.text === sampleWords[0].meaning, 'G1.1.5: Type 1 prompt text displays Vietnamese meaning');
    const uniqueOptions1 = new Set(q1.options.map(o => o.text));
    assert(uniqueOptions1.size === 4, 'G1.1.6: Type 1 option texts are all distinct');

    // 1.2 Type 2: Audio to Word
    const q2 = generateMCQQuestion(sampleWords[1], sampleWords, 'audio_to_word');
    assert(q2 && q2.type === 'audio_to_word', 'G1.2.1: Generates Type 2 audio_to_word question');
    assert(q2.options.length === 4, 'G1.2.2: Type 2 produces exactly 4 options');
    assert(q2.prompt.audioWord === 'abandon', 'G1.2.3: Type 2 prompt contains audioWord for speech synthesis');
    assert(q2.prompt.showAudioButton === true, 'G1.2.4: Type 2 prompt flags showAudioButton');
    assert(q2.word === '???', 'G1.2.5: Type 2 masks English word in main display to enforce auditory recall');
    const correctOptions2 = q2.options.filter(o => o.isCorrect);
    assert(correctOptions2.length === 1 && correctOptions2[0].text === 'abandon', 'G1.2.6: Type 2 correct option text matches target word');

    // 1.3 Type 3: Word to Audio
    const q3 = generateMCQQuestion(sampleWords[2], sampleWords, 'word_to_audio');
    assert(q3 && q3.type === 'word_to_audio', 'G1.3.1: Generates Type 3 word_to_audio question');
    assert(q3.options.length === 4, 'G1.3.2: Type 3 produces exactly 4 options');
    assert(q3.word === 'resilient', 'G1.3.3: Type 3 prominently displays English target word');
    assert(q3.phonetic === 'rɪˈzɪliənt', 'G1.3.4: Type 3 includes IPA phonetic guide');
    const correctOptions3 = q3.options.filter(o => o.isCorrect);
    assert(correctOptions3.length === 1, 'G1.3.5: Type 3 contains exactly 1 correct option');
    assert(correctOptions3[0].audioWord === 'resilient', 'G1.3.6: Type 3 correct option has matching audioWord');
    const distOptions3 = q3.options.filter(o => !o.isCorrect);
    assert(distOptions3.every(o => o.audioWord && o.audioWord !== 'resilient'), 'G1.3.7: Type 3 distractors have distinct non-target audio words');
    assert(q3.options.every((o, i) => o.label === String.fromCharCode(65 + i)), 'G1.3.8: Type 3 options have labels A, B, C, D in order');

    // 1.4 Type 4: Sentence Cloze
    const q4 = generateMCQQuestion(sampleWords[3], sampleWords, 'sentence_cloze');
    assert(q4 && q4.type === 'sentence_cloze', 'G1.4.1: Generates Type 4 sentence_cloze question');
    assert(q4.options.length === 4, 'G1.4.2: Type 4 produces exactly 4 options');
    assert(q4.sentence.includes('___________'), 'G1.4.3: Type 4 sentence contains blank placeholder');
    assert(!q4.sentence.includes('collaborate'), 'G1.4.4: Type 4 sentence replaces target word');
    const correctOptions4 = q4.options.filter(o => o.isCorrect);
    assert(correctOptions4.length === 1 && correctOptions4[0].text === 'collaborate', 'G1.4.5: Type 4 correct option matches target word');
  }

  // ── GROUP 2: Sentence Cloze Blanking & Resilience ─────────────────────
  console.log('\n🔹 GROUP 2: Sentence Cloze Blanking & Resilience');
  {
    // 2.1 Exact word match (meticulous: 10 chars -> 10 underscores)
    const b1 = blankAnswerInSentence('He made a meticulous record.', 'meticulous');
    assert(b1 && b1.sentence === 'He made a __________ record.', 'G2.1: Replaces exact word with matching blank length');

    // 2.2 Case-insensitivity at sentence beginning (abandon: 7 chars)
    const b2 = blankAnswerInSentence('Abandon was the only option.', 'abandon');
    assert(b2 && b2.sentence.startsWith('_______ was the'), 'G2.2: Case-insensitively blanks word at start of sentence');

    // 2.3 Regular plural (-s) (indicators: 10 chars)
    const b3 = blankAnswerInSentence('The system has several indicators here.', 'indicator');
    assert(b3 && b3.sentence === 'The system has several __________ here.', 'G2.3: Blanks inflected regular plural (-s)');

    // 2.4 Past tense (-ed) (collaborated: 12 chars)
    const b4 = blankAnswerInSentence('They collaborated with global partners.', 'collaborate');
    assert(b4 && b4.sentence === 'They ____________ with global partners.', 'G2.4: Blanks inflected past tense (-d/-ed)');

    // 2.5 Continuous (-ing) (scrutinizing: 12 chars)
    const b5 = blankAnswerInSentence('She is scrutinizing the data.', 'scrutinize');
    assert(b5 && b5.sentence === 'She is ____________ the data.', 'G2.5: Blanks inflected continuous form (-ing)');

    // 2.6 Ending in -y (-ies / -ied) (studies: 7 chars)
    const b6 = blankAnswerInSentence('He studies every night.', 'study');
    assert(b6 && b6.sentence === 'He _______ every night.', 'G2.6: Blanks inflected form ending in -ies');

    // 2.7 Doubled consonants (stopped: 7 chars)
    const b7a = blankAnswerInSentence('The car stopped abruptly.', 'stop');
    assert(b7a && b7a.sentence === 'The car _______ abruptly.', 'G2.7a: Blanks inflected form with doubled consonant (-ped)');

    // 2.8 Punctuation preservation
    const b7 = blankAnswerInSentence('In summary, abandon, immediately!', 'abandon');
    assert(b7 && b7.sentence === 'In summary, _______, immediately!', 'G2.8: Preserves adjacent commas and exclamation marks');

    // 2.9 Missing sentence graceful fallback
    const wordNoSentence = { id: 'w_no_sent', word: 'zenith', meaning: 'đỉnh cao', example_sentence: null };
    const qFallback1 = generateMCQQuestion(wordNoSentence, sampleWords, 'sentence_cloze');
    assert(qFallback1 && qFallback1.type !== 'sentence_cloze', 'G2.9.1: Gracefully falls back when example_sentence is null');
    assert(qFallback1.options.length === 4, 'G2.9.2: Fallback question still produces 4 valid options');

    // 2.10 Unmatched sentence graceful fallback
    const wordUnmatched = {
      id: 'w_unmatch',
      word: 'prolific',
      meaning: 'năng suất',
      example_sentence: 'The sun is shining brightly today.',
    };
    const qFallback2 = generateMCQQuestion(wordUnmatched, sampleWords, 'sentence_cloze');
    assert(qFallback2 && qFallback2.type !== 'sentence_cloze', 'G2.10: Gracefully falls back when word does not appear in sentence');

    // 1.5 Degraded Word Fallbacks: Missing meaning & missing word text
    const wordNoMeaning = { id: 'w_no_meaning', word: 'solitude', meaning: null };
    const qNoMeaning = generateMCQQuestion(wordNoMeaning, sampleWords, 'meaning_to_word');
    assert(Boolean(qNoMeaning.prompt.text && qNoMeaning.prompt.text.trim().length > 0), 'G1.5.1: Type 1 provides non-empty fallback prompt when meaning is null');
    assert(qNoMeaning.prompt.text === '(Chưa có nghĩa tiếng Việt)', 'G1.5.2: Type 1 fallback prompt indicates missing Vietnamese meaning');

    const wordEmptyMeaning = { id: 'w_empty_meaning', word: 'solitude', meaning: '   ' };
    const qEmptyMeaning = generateMCQQuestion(wordEmptyMeaning, sampleWords, 'meaning_to_word');
    assert(Boolean(qEmptyMeaning.prompt.text && qEmptyMeaning.prompt.text.trim().length > 0), 'G1.5.3: Type 1 provides non-empty fallback prompt when meaning is whitespace');

    const wordClozeNoMeaning = { id: 'w_cloze_no_m', word: 'solitude', meaning: '', example_sentence: null };
    const qClozeNoMeaning = generateMCQQuestion(wordClozeNoMeaning, sampleWords, 'sentence_cloze');
    assert(Boolean(qClozeNoMeaning.prompt.text && qClozeNoMeaning.prompt.text.trim().length > 0), 'G1.5.4: Type 4 fallback provides non-empty prompt when both sentence and meaning are missing');

    const wordEmptyWord = { id: 'w_empty_word', word: '', meaning: 'sự cô đơn' };
    const qEmptyWord = generateMCQQuestion(wordEmptyWord, sampleWords, 'meaning_to_word');
    const correctOptEmptyWord = qEmptyWord.options.find(o => o.isCorrect);
    assert(Boolean(correctOptEmptyWord && correctOptEmptyWord.text && correctOptEmptyWord.text.trim().length > 0), 'G1.5.5: Type 1 fallback provides non-empty option text when word is empty');
  }

  // ── GROUP 3: Distractor Generation & Small Word List Resilience ───────
  console.log('\n🔹 GROUP 3: Distractor Generation & Small Word List Resilience');
  {
    // 3.1 Standard list (>= 4 words)
    const dist1 = pickEnglishDistractors(sampleWords[0], sampleWords, 3);
    assert(dist1.length === 3, 'G3.1.1: Generates exactly 3 English distractors');
    assert(!dist1.includes(sampleWords[0].word), 'G3.1.2: Target word is never included in distractors');
    assert(new Set(dist1).size === 3, 'G3.1.3: Distractors are mutually distinct');

    // 3.2 Small list (3 words)
    const threeWords = sampleWords.slice(0, 3);
    const distSmall = pickEnglishDistractors(threeWords[0], threeWords, 3);
    assert(distSmall.length === 3, 'G3.2.1: Small word list (< 4 words) still yields exactly 3 distractors');
    assert(new Set(distSmall).size === 3, 'G3.2.2: Distractors with fallback padding are mutually distinct');

    // 3.3 Ultra-small list (1 word only)
    const singleWordList = [sampleWords[0]];
    const distSingle = pickEnglishDistractors(singleWordList[0], singleWordList, 3);
    assert(distSingle.length === 3, 'G3.3.1: Single-word list yields 3 distractors from fallback dictionary');
    assert(!distSingle.includes(sampleWords[0].word), 'G3.3.2: Fallback distractors do not duplicate single target word');

    // 3.4 Fallback dictionary integrity
    assert(FALLBACK_ENGLISH_DISTRACTORS.length >= 15, 'G3.4.1: FALLBACK_ENGLISH_DISTRACTORS has >= 15 words');
    assert(FALLBACK_VIETNAMESE_DISTRACTORS.length >= 15, 'G3.4.2: FALLBACK_VIETNAMESE_DISTRACTORS has >= 15 phrases');
    assert(new Set(FALLBACK_ENGLISH_DISTRACTORS).size === FALLBACK_ENGLISH_DISTRACTORS.length, 'G3.4.3: Fallback English dictionary contains zero duplicates');
    assert(new Set(FALLBACK_VIETNAMESE_DISTRACTORS).size === FALLBACK_VIETNAMESE_DISTRACTORS.length, 'G3.4.4: Fallback Vietnamese dictionary contains zero duplicates');

    // 3.5 Vietnamese distractor picker
    const viDist = pickVietnameseDistractors(sampleWords[0].meaning, sampleWords, 3);
    assert(viDist.length === 3, 'G3.5.1: Generates exactly 3 Vietnamese distractors');
    assert(!viDist.includes(sampleWords[0].meaning), 'G3.5.2: Target meaning is never included in Vietnamese distractors');
    assert(new Set(viDist).size === 3, 'G3.5.3: Vietnamese distractors are mutually distinct');

    // 3.6 Non-appearance of "undefined" or "null" in distractors when words have missing properties
    const malformedPool = [
      { id: 'm1', meaning: 'con mèo' }, // missing word property
      { id: 'm2', word: null, meaning: 'con chó' }, // null word
      { id: 'm3', word: undefined, meaning: 'con cá' }, // undefined word
      { id: 'm4', word: '   ', meaning: 'con chim' }, // whitespace word
      { id: 'm5', word: 'elephant', meaning: 'con voi' },
    ];
    const targetCat = { id: 't1', word: 'cat', meaning: 'con mèo' };
    const distractorsWithMalformed = pickEnglishDistractors(targetCat, malformedPool, 3);
    assert(distractorsWithMalformed.length === 3, 'G3.6.1: Generates exactly 3 distractors even with malformed pool words');
    assert(!distractorsWithMalformed.includes('undefined'), 'G3.6.2: Literal string "undefined" is NEVER included in English distractors');
    assert(!distractorsWithMalformed.includes('null'), 'G3.6.3: Literal string "null" is NEVER included in English distractors');
    assert(distractorsWithMalformed.every(d => typeof d === 'string' && d.trim().length > 0), 'G3.6.4: All distractors are non-empty valid strings');

    // Also verify Vietnamese distractors with malformed pool
    const viMalformedPool = [
      { id: 'vm1', word: 'cat' }, // missing meaning
      { id: 'vm2', word: 'dog', meaning: null }, // null meaning
      { id: 'vm3', word: 'bird', meaning: undefined }, // undefined meaning
      { id: 'vm4', word: 'fish', meaning: '   ' }, // whitespace meaning
    ];
    const viDistWithMalformed = pickVietnameseDistractors('con mèo', viMalformedPool, 3);
    assert(viDistWithMalformed.length === 3, 'G3.6.5: Generates exactly 3 Vietnamese distractors even with malformed pool meanings');
    assert(!viDistWithMalformed.includes('undefined'), 'G3.6.6: Literal string "undefined" is NEVER included in Vietnamese distractors');
    assert(!viDistWithMalformed.includes('null'), 'G3.6.7: Literal string "null" is NEVER included in Vietnamese distractors');
  }

  // ── GROUP 4: Random Interleaving & Distribution Across Session ────────
  console.log('\n🔹 GROUP 4: Random Interleaving & Distribution Across Session');
  {
    // 4.1 Even distribution across 20-question session using session interleaver schedule
    const pool = sampleWords;
    const schedule = generateInterleavedMCQTypes(20);
    const generatedTypes = [];
    for (let i = 0; i < 20; i++) {
      const target = pool[i % pool.length];
      const q = generateMCQQuestion(target, pool, schedule[i]);
      generatedTypes.push(q.type);
    }
    const typeCounts = {};
    MCQ_SUBTYPES.forEach(t => { typeCounts[t] = 0; });
    generatedTypes.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1; });

    assert(typeCounts['meaning_to_word'] === 5, 'G4.1.1: Type 1 appears exactly 5 times in 20-item session (25%)');
    assert(typeCounts['audio_to_word'] === 5, 'G4.1.2: Type 2 appears exactly 5 times in 20-item session (25%)');
    assert(typeCounts['word_to_audio'] === 5, 'G4.1.3: Type 3 appears exactly 5 times in 20-item session (25%)');
    assert(typeCounts['sentence_cloze'] === 5, 'G4.1.4: Type 4 appears exactly 5 times in 20-item session (25%)');

    // 4.1b Unforced random dispatch with deterministic PRNG seed
    const originalRandom = Math.random;
    let seed = 42;
    Math.random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    try {
      const unforcedTypes = [];
      for (let i = 0; i < 20; i++) {
        const q = generateMCQQuestion(pool[i % pool.length], pool);
        unforcedTypes.push(q.type);
      }
      assert(MCQ_SUBTYPES.every(t => unforcedTypes.includes(t)), 'G4.1.5: Unforced generateMCQQuestion covers all 4 subtypes deterministically');
    } finally {
      Math.random = originalRandom;
    }

    // 4.2 Non-consecutive interleaving: no adjacent duplicate types in interleaved schedule
    let maxRun = 1;
    let currentRun = 1;
    for (let i = 1; i < generatedTypes.length; i++) {
      if (generatedTypes[i] === generatedTypes[i - 1]) {
        currentRun++;
        if (currentRun > maxRun) maxRun = currentRun;
      } else {
        currentRun = 1;
      }
    }
    assert(maxRun === 1, 'G4.2: Interleaving ensures maximum streak of any single question type is exactly 1');

    // 4.3 Forced subtype support
    const forcedQ = generateMCQQuestion(sampleWords[0], sampleWords, 'meaning_to_word');
    assert(forcedQ.type === 'meaning_to_word', 'G4.3: Supports forcing specific MCQ subtype when requested');

    // 4.4 generateInterleavedMCQTypes validation
    const schedule12 = generateInterleavedMCQTypes(12);
    assert(schedule12.length === 12, 'G4.4.1: generateInterleavedMCQTypes returns exact requested length');
    const schedCounts = {};
    MCQ_SUBTYPES.forEach(t => { schedCounts[t] = 0; });
    schedule12.forEach(t => { schedCounts[t] = (schedCounts[t] || 0) + 1; });
    const countValues = Object.values(schedCounts);
    const maxCount = Math.max(...countValues);
    const minCount = Math.min(...countValues);
    assert(maxCount - minCount <= 1, 'G4.4.2: Interleaved schedule maintains balanced distribution across all subtypes');
    let hasImmediateAdjacentDuplicate = false;
    for (let i = 1; i < schedule12.length; i++) {
      if (schedule12[i] === schedule12[i - 1]) {
        hasImmediateAdjacentDuplicate = true;
        break;
      }
    }
    assert(!hasImmediateAdjacentDuplicate, 'G4.4.3: Interleaved schedule eliminates adjacent identical subtypes');
  }

  // ── GROUP 5: Answer Checking, Scoring, and Requeueing with Subtype Rotation
  console.log('\n🔹 GROUP 5: Answer Checking, Scoring, and Requeueing with Subtype Rotation');
  {
    const q = generateMCQQuestion(sampleWords[0], sampleWords, 'meaning_to_word');
    const correctIdx = q.options.findIndex(o => o.isCorrect);
    const wrongIdx = q.options.findIndex(o => !o.isCorrect);
    const correctOpt = q.options[correctIdx];

    // 5.1 Correct answer evaluation by numerical index
    const resCorrect = evaluateMCQAnswer(q, correctIdx);
    assert(resCorrect.correct === true, 'G5.1.1: evaluateMCQAnswer returns correct: true for correct index');
    assert(resCorrect.correctAnswer === 'meticulous', 'G5.1.2: evaluateMCQAnswer reports correct answer text');

    // 5.2 Correct answer evaluation by option ID
    const resCorrectId = evaluateMCQAnswer(q, correctOpt.id);
    assert(resCorrectId.correct === true, 'G5.2: evaluateMCQAnswer returns correct: true when passed option ID');

    // 5.3 Correct answer evaluation by text string
    const resCorrectText = evaluateMCQAnswer(q, correctOpt.text);
    assert(resCorrectText.correct === true, 'G5.3: evaluateMCQAnswer returns correct: true when passed option text');

    // 5.4 Incorrect answer evaluation
    const resWrong = evaluateMCQAnswer(q, wrongIdx);
    assert(resWrong.correct === false, 'G5.4: evaluateMCQAnswer returns correct: false for incorrect index');

    // 5.5 Out-of-bounds safety
    const resOOB = evaluateMCQAnswer(q, 99);
    assert(resOOB.correct === false, 'G5.5.1: evaluateMCQAnswer safely handles out-of-bounds index without throwing');
    const resNull = evaluateMCQAnswer(q, null);
    assert(resNull.correct === false, 'G5.5.2: evaluateMCQAnswer safely handles null answer');

    // 5.5b Empty string and whitespace rejection (no coercion to index 0)
    const qWithOpt0Correct = {
      options: [
        { id: 'opt_0', text: 'meticulous', isCorrect: true },
        { id: 'opt_1', text: 'abandon', isCorrect: false },
        { id: 'opt_2', text: 'resilient', isCorrect: false },
        { id: 'opt_3', text: 'collaborate', isCorrect: false },
      ],
    };
    const resEmpty = evaluateMCQAnswer(qWithOpt0Correct, '');
    assert(resEmpty.correct === false, 'G5.5.3: evaluateMCQAnswer rejects empty string "" without coercing to index 0');
    assert(resEmpty.selectedOption === null, 'G5.5.4: Empty string results in null selectedOption');

    const resSpaces = evaluateMCQAnswer(qWithOpt0Correct, '   ');
    assert(resSpaces.correct === false, 'G5.5.5: evaluateMCQAnswer rejects whitespace "   " without coercing to index 0');

    const resWhitespace = evaluateMCQAnswer(qWithOpt0Correct, '\n\t  ');
    assert(resWhitespace.correct === false, 'G5.5.6: evaluateMCQAnswer rejects newline/tab whitespace string');

    // 5.6 Subtype rotation on requeue
    const rotated1 = rotateMCQType('meaning_to_word', ['meaning_to_word']);
    assert(rotated1 !== 'meaning_to_word', 'G5.6.1: rotateMCQType returns a different type than current');
    assert(MCQ_SUBTYPES.includes(rotated1), 'G5.6.2: rotateMCQType returns a valid MCQ subtype');

    // 5.7 Simulation: Requeueing flow with subtype rotation
    const sessionQueue = [
      {
        word: sampleWords[0],
        mcqSubtype: 'meaning_to_word',
        question: generateMCQQuestion(sampleWords[0], sampleWords, 'meaning_to_word'),
        usedSubtypes: ['meaning_to_word'],
        attempts: 0,
        failCount: 0,
      },
    ];

    // User answers wrongly:
    const currentItem = sessionQueue[0];
    const wrongIdxInCurrent = currentItem.question.options.findIndex(o => !o.isCorrect);
    const checkWrong = evaluateMCQAnswer(currentItem.question, wrongIdxInCurrent);
    assert(!checkWrong.correct, 'G5.7.1: Simulated user answer is wrong');

    // Requeue logic:
    const nextSubtype = rotateMCQType(currentItem.mcqSubtype, currentItem.usedSubtypes);
    const requeuedItem = {
      ...currentItem,
      mcqSubtype: nextSubtype,
      question: generateMCQQuestion(currentItem.word, sampleWords, nextSubtype),
      usedSubtypes: [...currentItem.usedSubtypes, nextSubtype],
      attempts: currentItem.attempts + 1,
      failCount: currentItem.failCount + 1,
    };
    sessionQueue.push(requeuedItem);

    assert(sessionQueue.length === 2, 'G5.7.2: Wrong answer requeues item to tail of queue');
    assert(sessionQueue[1].mcqSubtype !== 'meaning_to_word', 'G5.7.3: Requeued item rotates to a new subtype');
    assert(sessionQueue[1].question.type === sessionQueue[1].mcqSubtype, 'G5.7.4: Requeued question generated with rotated subtype');

    // Now answer correctly on requeued item:
    const requeuedCorrectIdx = sessionQueue[1].question.options.findIndex(o => o.isCorrect);
    const checkRequeuedCorrect = evaluateMCQAnswer(sessionQueue[1].question, requeuedCorrectIdx);
    assert(checkRequeuedCorrect.correct === true, 'G5.7.5: Answering rotated requeued question correctly succeeds');
  }

  // ── GROUP 6: Hook Integration & Module Exports Contracts ─────────────
  console.log('\n🔹 GROUP 6: Hook Integration & Module Exports Contracts');
  {
    assert(Array.isArray(MCQ_SUBTYPES) && MCQ_SUBTYPES.length === 4, 'G6.1: MCQ_SUBTYPES has exactly 4 question types');
    assert(MCQ_TYPES === MCQ_SUBTYPES, 'G6.2: MCQ_TYPES is aliased to MCQ_SUBTYPES');

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const useStudySessionPath = path.resolve(__dirname, '../src/hooks/useStudySession.js');
    const useStudySessionContent = fs.readFileSync(useStudySessionPath, 'utf8');

    assert(useStudySessionContent.includes('generateMCQQuestion'), 'G6.3: useStudySession imports or integrates generateMCQQuestion');
    assert(useStudySessionContent.includes('generateInterleavedMCQTypes'), 'G6.4: useStudySession imports or exposes generateInterleavedMCQTypes');
    assert(useStudySessionContent.includes('rotateMCQType'), 'G6.5: useStudySession imports or uses rotateMCQType');
    assert(useStudySessionContent.includes('sessionLoggedRef'), 'G6.6: useStudySession preserves sessionLoggedRef guard');
    assert(useStudySessionContent.includes('queueIndex >= session.queue.length'), 'G6.7: useStudySession preserves queue exhaustion check');
  }

  // Summary
  console.log('\n===============================================================');
  console.log(`📊 QUIZ TYPES LOGIC TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log('===============================================================\n');

  return { totalTests, passedTests, failedTests: totalTests - passedTests };
}

// Direct execution runner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runQuizTypesLogicTests().then(({ failedTests }) => {
    if (failedTests === 0) {
      console.log('🎉 ALL QUIZ TYPES LOGIC TESTS PASSED SUCCESSFULLY!\n');
      process.exit(0);
    } else {
      console.error(`💥 ${failedTests} TESTS FAILED!\n`);
      process.exit(1);
    }
  }).catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
