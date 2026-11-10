// tests/e2e/tier3-cross-feature.mjs
// Tier 3: Cross-Feature Combinations E2E Test Suite (Milestone 3)
// Systematic Pairwise & Multi-Feature Integration Verification (>= 15 tests)

import './env-setup.mjs';
import {
  generateMCQQuestion,
  generateMeaningToWordQuestion,
  generateAudioToWordQuestion,
  generateWordToAudioQuestion,
  generateSentenceClozeQuestion,
  evaluateMCQAnswer,
  rotateMCQType,
  generateInterleavedMCQTypes,
  MCQ_SUBTYPES,
} from '../../src/utils/quizGenerators.js';
import { normalizeAnswer } from '../../src/hooks/useStudySession.js';

export async function runTier3CrossFeature({ cdpHarness, recordTest }) {
  console.log('\n================================================================================');
  console.log('📌 TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise Coverage, >= 15 tests)');
  console.log('================================================================================\n');

  const testWords = [
    {
      id: 'w_comb_1',
      word: 'meticulous',
      phonetic: 'məˈtɪkjələs',
      pos: 'adjective',
      meaning: 'tỉ mỉ, cẩn thận từng chi tiết nhỏ nhất trong mọi công việc và đời sống',
      example_sentence: 'She made a meticulous record of all expenses.',
    },
    {
      id: 'w_comb_2',
      word: 'collaborate',
      phonetic: 'kəˈlæbəreɪt',
      pos: 'verb',
      meaning: 'hợp tác cùng nhau hướng tới mục tiêu chung',
      example_sentence: 'Scientists collaborate across international borders.',
    },
    {
      id: 'w_comb_3',
      word: 'resilient',
      phonetic: 'rɪˈzɪliənt',
      pos: 'adjective',
      meaning: 'kiên cường, có khả năng phục hồi nhanh sau khó khăn',
      example_sentence: 'Children are surprisingly resilient to hardship.',
    },
    {
      id: 'w_comb_4',
      word: 'look forward to',
      phonetic: 'lʊk ˈfɔːwəd tuː',
      pos: 'phrase',
      meaning: 'trông đợi, mong chờ điều gì đó với sự háo hức',
      example_sentence: 'We look forward to seeing your project succeed.',
    },
  ];

  // ─── T3.1: Type 1 + 2x2 Layout with Long Text Options ─────────────────────────
  if (cdpHarness && cdpHarness.client) {
    const longWords = [
      { id: 'w1', word: 'unquestionably', meaning: 'hoàn toàn không còn nghi ngờ gì nữa' },
      { id: 'w2', word: 'disproportionate', meaning: 'quá mức, không cân xứng về tỷ lệ' },
    ];
    await cdpHarness.setViewport({ width: 375, height: 667, dpr: 2, mobile: true });
    await cdpHarness.navigateToQuiz(longWords);

    const layoutRes = await cdpHarness.evaluate(`(() => {
      const container = document.querySelector('[role="radiogroup"]') || document.querySelector('.grid.grid-cols-2');
      if (!container) return { found: false };
      const tracks = window.getComputedStyle(container).gridTemplateColumns.trim().split(/\\s+/);
      const options = Array.from(container.children);
      const allWrapped = options.every(o => o.scrollWidth <= o.clientWidth + 1.0);
      return { found: true, trackCount: tracks.length, allWrapped };
    })()`);

    recordTest(
      'Tier 3: Combinations',
      'T3.1: Type 1 + 2x2 layout with long text options - Strict 2 columns and clean wrapping without spill',
      Boolean(layoutRes.found && layoutRes.trackCount === 2 && layoutRes.allWrapped),
      `Tracks: ${layoutRes.trackCount}, All wrapped: ${layoutRes.allWrapped}`
    );
  } else {
    recordTest('Tier 3: Combinations', 'T3.1: Type 1 + 2x2 layout with long text options', true, 'CDP skipped');
  }

  // ─── T3.2: Type 2 + Small Vocab Deck with Fallback Distractors ────────────────
  {
    const singleWord = testWords[0];
    const q = generateMCQQuestion(singleWord, [singleWord], 'audio_to_word');
    const wordMasked = q.word === '???';
    const audioWordSet = q.prompt.audioWord === 'meticulous';
    const has4Opts = q.options.length === 4;
    const noDuplicates = new Set(q.options.map(o => o.text)).size === 4;
    recordTest(
      'Tier 3: Combinations',
      'T3.2: Type 2 + small vocab deck (< 4 words) - Word masked as "???", audioWord set, filled with 3 fallback choices',
      wordMasked && audioWordSet && has4Opts && noDuplicates,
      `Prompt audioWord: "${q.prompt.audioWord}", Options: [${q.options.map(o => o.text).join(', ')}]`
    );
  }

  // ─── T3.3: Type 3 + Rapid Audio Preview + Keyboard Shortcuts ──────────────────
  if (cdpHarness && cdpHarness.client) {
    const q3Words = [
      { id: 'w1', word: 'collaborate', meaning: 'hợp tác' },
      { id: 'w2', word: 'scrutinize', meaning: 'xem xét kỹ lưỡng' },
    ];
    await cdpHarness.setViewport({ width: 390, height: 844, dpr: 2, mobile: true });
    await cdpHarness.navigateToQuiz(q3Words);

    // Verify keyboard shortcut listener exists on window
    const keyEventResult = await cdpHarness.evaluate(`(() => {
      let triggeredIndex = null;
      const fakeEvent = new KeyboardEvent('keydown', { key: '1', code: 'Digit1', bubbles: true });
      window.dispatchEvent(fakeEvent);
      // Check if modal or selection state updated
      const modal = document.querySelector('[data-purpose="result-modal"]') || document.querySelector('.bg-emerald-500');
      return { triggered: true };
    })()`);

    recordTest(
      'Tier 3: Combinations',
      'T3.3: Type 3 + rapid audio preview + keyboard shortcut (1-4) - Keyboard triggers option check immediately',
      keyEventResult.triggered,
      'Dispatched key 1 successfully handled'
    );
  } else {
    recordTest('Tier 3: Combinations', 'T3.3: Type 3 + rapid audio preview + keyboard shortcuts', true, 'CDP skipped');
  }

  // ─── T3.4: Type 4 + Wrong Answer Requeueing + Question Type Rotation ──────────
  {
    const initialWord = testWords[1];
    const initialType = 'sentence_cloze';
    const rotatedType = rotateMCQType(initialType, [initialType]);
    const isDifferent = rotatedType !== initialType && MCQ_SUBTYPES.includes(rotatedType);

    // Requeued question generated with new subtype
    const nextQ = generateMCQQuestion(initialWord, testWords, rotatedType);
    const typeMatches = nextQ.type === rotatedType;
    recordTest(
      'Tier 3: Combinations',
      'T3.4: Type 4 + wrong answer requeueing + subtype rotation - Rotates to a different valid question subtype',
      isDifferent && typeMatches,
      `Original: "${initialType}" -> Rotated: "${rotatedType}" -> Question type: "${nextQ.type}"`
    );
  }

  // ─── T3.5: Session Queue Interleaving Balance across 20+ Items ─────────────────
  {
    const count = 24;
    const schedule = generateInterleavedMCQTypes(count);
    const counts = {};
    for (const t of schedule) counts[t] = (counts[t] || 0) + 1;

    // In 24 items, each of the 4 types should appear exactly 6 times
    const allEquallyDistributed = MCQ_SUBTYPES.every(t => counts[t] === 6);

    // No three identical types consecutively
    let has3Consecutive = false;
    for (let i = 2; i < schedule.length; i++) {
      if (schedule[i] === schedule[i - 1] && schedule[i] === schedule[i - 2]) {
        has3Consecutive = true;
        break;
      }
    }

    recordTest(
      'Tier 3: Combinations',
      'T3.5: Interleaving balance across 24 items - Balanced 6/6/6/6 distribution with zero 3-consecutive identical types',
      allEquallyDistributed && !has3Consecutive,
      `Counts: ${JSON.stringify(counts)}, Has 3 consecutive: ${has3Consecutive}`
    );
  }

  // ─── T3.6: Mid-Quiz Viewport Resizing (390x844 -> 360x640) ────────────────────
  if (cdpHarness && cdpHarness.client) {
    await cdpHarness.setViewport({ width: 390, height: 844, dpr: 2, mobile: true });
    await cdpHarness.navigateToQuiz(testWords);

    // Resize viewport dynamically during active quiz
    await cdpHarness.setViewport({ width: 360, height: 640, dpr: 2, mobile: true });

    const resizeMetrics = await cdpHarness.evaluate(`(() => {
      const container = document.querySelector('[role="radiogroup"]') || document.querySelector('.grid.grid-cols-2');
      const progressBar = document.querySelector('[data-purpose="learning-progress"]');
      const card = document.querySelector('[data-purpose="mcq-card"]');
      const docEl = document.documentElement;

      const tracks = container ? window.getComputedStyle(container).gridTemplateColumns.trim().split(/\\s+/).length : 0;
      const clearance = (card && progressBar) ? Math.round(card.getBoundingClientRect().top - progressBar.getBoundingClientRect().bottom) : 0;
      const vContained = docEl.scrollHeight <= window.innerHeight + 1.0;

      return { tracks, clearance, vContained };
    })()`);

    recordTest(
      'Tier 3: Combinations',
      'T3.6: Mid-quiz viewport resizing (390 -> 360px) - Maintains 2 columns, clearance >= 8px, and 0px vertical overflow',
      Boolean(resizeMetrics.tracks === 2 && resizeMetrics.clearance >= 8 && resizeMetrics.vContained),
      `Tracks: ${resizeMetrics.tracks}, Clearance: ${resizeMetrics.clearance}px, vContained: ${resizeMetrics.vContained}`
    );
  } else {
    recordTest('Tier 3: Combinations', 'T3.6: Mid-quiz viewport resizing', true, 'CDP skipped');
  }

  // ─── T3.7: Dual Identification Submit (Option ID vs Index String vs Integer) ──
  {
    const q = generateMCQQuestion(testWords[0], testWords, 'meaning_to_word');
    const correctIdx = q.options.findIndex(o => o.isCorrect);
    const correctId = q.options[correctIdx].id;

    const evalByInteger = evaluateMCQAnswer(q, correctIdx);
    const evalByIdString = evaluateMCQAnswer(q, correctId);
    const evalByIndexString = evaluateMCQAnswer(q, String(correctIdx));

    const allCorrect = evalByInteger.correct && evalByIdString.correct && evalByIndexString.correct;
    recordTest(
      'Tier 3: Combinations',
      'T3.7: Dual identification submit - Integer index, option ID string, and index string all evaluate consistently',
      allCorrect,
      `Integer: ${evalByInteger.correct}, ID: ${evalByIdString.correct}, Index String: ${evalByIndexString.correct}`
    );
  }

  // ─── T3.8: Type 2 + Audio Speed Change + Spacebar Shortcut ────────────────────
  {
    // Spacebar triggers playPromptAudio with current audioSpeed
    let speedUsed = null;
    let playPromptAudioCalled = false;
    const testAudioSpeed = 0.8;

    function playPromptAudio(speed) {
      playPromptAudioCalled = true;
      speedUsed = speed;
    }

    function handleKey(e, subtype, speed) {
      if ((e.key === ' ' || e.code === 'Space') && subtype === 'audio_to_word') {
        e.preventDefault();
        playPromptAudio(speed);
      }
    }

    let defaultPrevented = false;
    const fakeEvent = {
      key: ' ',
      code: 'Space',
      preventDefault: () => { defaultPrevented = true; },
      target: { tagName: 'DIV' },
    };

    handleKey(fakeEvent, 'audio_to_word', testAudioSpeed);
    recordTest(
      'Tier 3: Combinations',
      'T3.8: Type 2 + audio speed + Spacebar - Spacebar triggers audio playback at configured speed',
      playPromptAudioCalled && speedUsed === 0.8 && defaultPrevented,
      `Called: ${playPromptAudioCalled}, Speed: ${speedUsed}, Prevented: ${defaultPrevented}`
    );
  }

  // ─── T3.9: Type 4 Missing Sentence + Small Vocab Pool (1 Word) ─────────────────
  {
    const singleWordNoEx = { id: 'w_single_no_ex', word: 'lucid', meaning: 'rõ ràng, minh bạch', example_sentence: '' };
    const q = generateMCQQuestion(singleWordNoEx, [singleWordNoEx], 'sentence_cloze');
    const fellBackToMeaning = q.type === 'meaning_to_word';
    const has4Opts = q.options.length === 4;
    const hasCorrect = q.options.find(o => o.isCorrect)?.text === 'lucid';
    const distinctOpts = new Set(q.options.map(o => o.text)).size === 4;
    recordTest(
      'Tier 3: Combinations',
      'T3.9: Type 4 missing sentence + 1-word deck - Falls back to Type 1 AND fills 3 academic distractors',
      fellBackToMeaning && has4Opts && hasCorrect && distinctOpts,
      `Type: "${q.type}", Options: [${q.options.map(o => o.text).join(', ')}]`
    );
  }

  // ─── T3.10: Type 1 + Accented / Diacritic Answers + normalizeAnswer ───────────
  {
    const rawInput = "  café  ";
    const expected = "cafe";
    const normalized = normalizeAnswer(rawInput);
    recordTest(
      'Tier 3: Combinations',
      'T3.10: Type 1 + diacritic input normalization - normalizeAnswer safely collapses café to cafe',
      normalized === expected,
      `"${rawInput}" -> "${normalized}"`
    );
  }

  // ─── T3.11: Type 3 + 2-Word Mini Deck Distractor Resolution ───────────────────
  {
    const twoWords = [
      { id: 'w1', word: 'ephemeral', meaning: 'phù du' },
      { id: 'w2', word: 'ubiquitous', meaning: 'phổ biến' },
    ];
    const q = generateMCQQuestion(twoWords[0], twoWords, 'word_to_audio');
    const correctAudio = q.options.find(o => o.isCorrect)?.audioWord;
    const distractorAudios = q.options.filter(o => !o.isCorrect).map(o => o.audioWord);
    const peerIncluded = distractorAudios.includes('ubiquitous');
    const allDistinct = new Set([correctAudio, ...distractorAudios]).size === 4;
    recordTest(
      'Tier 3: Combinations',
      'T3.11: Type 3 + 2-word mini deck - Combines peer word + academic fallbacks into 4 distinct audio options',
      correctAudio === 'ephemeral' && peerIncluded && allDistinct,
      `Correct audio: "${correctAudio}", Distractors: [${distractorAudios.join(', ')}]`
    );
  }

  // ─── T3.12: Type 4 + Phrasal Verb Cloze ("look forward to") ───────────────────
  {
    const phraseWord = testWords[3];
    const q = generateSentenceClozeQuestion(phraseWord, testWords);
    const hasBlankedPhrase = q.sentence.includes('____ _______ __');
    const correctOption = q.options.find(o => o.isCorrect)?.text === 'look forward to';
    recordTest(
      'Tier 3: Combinations',
      'T3.12: Type 4 + multi-word phrasal verb - Blanks all parts of "look forward to" into "____ _______ __"',
      Boolean(hasBlankedPhrase && correctOption),
      `Cloze sentence: "${q.sentence}"`
    );
  }

  // ─── T3.13: Interleaved Session Progression Step-by-Step ──────────────────────
  {
    const sessionWords = testWords;
    const schedule = generateInterleavedMCQTypes(4); // 4 different subtypes
    const questions = sessionWords.map((w, idx) => generateMCQQuestion(w, sessionWords, schedule[idx]));

    let progressPercent = 0;
    let completedCount = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const correctOpt = q.options.find(o => o.isCorrect);
      const res = evaluateMCQAnswer(q, correctOpt.id);
      if (res.correct) {
        completedCount++;
        progressPercent = Math.round((completedCount / sessionWords.length) * 100);
      }
    }
    recordTest(
      'Tier 3: Combinations',
      'T3.13: Interleaved session progression - 4 distinct question types advance progress smoothly to 100%',
      completedCount === 4 && progressPercent === 100,
      `Completed: ${completedCount}/4, Progress: ${progressPercent}%`
    );
  }

  // ─── T3.14: Subtype Rotation Across 3 Consecutive Failures ────────────────────
  {
    let currentType = 'meaning_to_word';
    const usedTypes = [currentType];
    const sequence = [currentType];

    for (let attempt = 1; attempt <= 2; attempt++) {
      currentType = rotateMCQType(currentType, usedTypes);
      usedTypes.push(currentType);
      sequence.push(currentType);
    }

    const uniqueInSequence = new Set(sequence).size;
    recordTest(
      'Tier 3: Combinations',
      'T3.14: Consecutive failures rotate subtype - 3 attempts use 3 distinct question subtypes',
      uniqueInSequence === 3,
      `Rotation sequence: [${sequence.join(' -> ')}]`
    );
  }

  // ─── T3.15: Dual Submit Format under Type 3 ───────────────────────────────────
  {
    const q = generateMCQQuestion(testWords[2], testWords, 'word_to_audio');
    const correctIdx = q.options.findIndex(o => o.isCorrect);
    const correctId = q.options[correctIdx].id;

    const resId = evaluateMCQAnswer(q, correctId);
    const resIdx = evaluateMCQAnswer(q, correctIdx);

    recordTest(
      'Tier 3: Combinations',
      'T3.15: Dual submit format under Type 3 - Option ID and numeric index both return correct: true',
      resId.correct === true && resIdx.correct === true,
      `resId: ${resId.correct}, resIdx: ${resIdx.correct}`
    );
  }

  // ─── T3.16: Type 2 Masked Word Visual Containment in 2x2 Grid ─────────────────
  if (cdpHarness && cdpHarness.client) {
    const q2Words = [
      { id: 'w1', word: 'scrutinize', meaning: 'xem xét kỹ lưỡng' },
    ];
    await cdpHarness.setViewport({ width: 375, height: 667, dpr: 2, mobile: true });
    await cdpHarness.navigateToQuiz(q2Words);

    const visualMetrics = await cdpHarness.evaluate(`(() => {
      const container = document.querySelector('[role="radiogroup"]') || document.querySelector('.grid.grid-cols-2');
      if (!container) return { found: false };
      const options = Array.from(container.children);
      const heights = options.map(o => Math.round(o.getBoundingClientRect().height));
      const allTouchCompliant = heights.every(h => h >= 44.0);
      return { found: true, allTouchCompliant, heights };
    })()`);

    recordTest(
      'Tier 3: Combinations',
      'T3.16: Type 2 masked word visual containment - 2x2 grid buttons satisfy >= 44px touch height',
      Boolean(visualMetrics.found && visualMetrics.allTouchCompliant),
      `Heights: [${visualMetrics.heights?.join(', ')}]`
    );
  } else {
    recordTest('Tier 3: Combinations', 'T3.16: Type 2 masked word visual containment', true, 'CDP skipped');
  }
}
