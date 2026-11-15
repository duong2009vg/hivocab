// tests/studio-core.test.js
// Unit tests for cloned PeakFour core algorithms in src/utils/studioCore.js

import {
  compareDictation,
  maskExpectedWord,
  expandDictationLesson,
  getSentenceProgressKey,
  extractYoutubeVideoId,
  resolveActiveCueIndex,
  compareShadowingWords,
  buildSentencePronunciationView,
} from '../src/utils/studioCore.js';

export async function runStudioCoreTests() {
  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  // 1. Dictation edit distance & alignment
  const exact = compareDictation("Hello, Mr. Smith! How's it going?", "hello mr. smith how's it going");
  assert(exact.correct === true && exact.score === 100, 'compareDictation: ignores punctuation/case and keeps contractions');
  assert(exact.counts.correct === 6 && exact.counts.extra === 0, 'compareDictation: counts 6 matched tokens');

  const partial = compareDictation('She lives in London today', 'She live London now extra');
  assert(partial.correct === false, 'compareDictation: detects imperfect submission');
  assert(partial.counts.wrong >= 1 || partial.counts.missing >= 1, 'compareDictation: tracks wrong/missing words');
  assert(partial.counts.extra >= 1, 'compareDictation: tracks extra words');
  assert(maskExpectedWord('London') === '******', 'maskExpectedWord: masks characters for blind retries');

  // 2. Sentence segmentation & title preservation
  const lesson = expandDictationLesson({
    id: 'test-lesson',
    lines: [
      {
        speaker: 'Harvey',
        text: 'Good morning, Mr. Pearson. Did you read the brief?',
        vi: 'Chào buổi sáng, ông Pearson. Ông đã đọc hồ sơ chưa?',
      },
    ],
  });
  assert(lesson._sentenceUnitsVersion === 1, 'expandDictationLesson: marks expanded lesson version');
  assert(lesson.lines.length === 2, 'expandDictationLesson: splits multi-sentence turn while keeping "Mr. Pearson" intact');
  assert(lesson.lines[0].text.includes('Mr. Pearson.'), 'expandDictationLesson: keeps abbreviation title joined to first sentence');
  assert(
    getSentenceProgressKey(lesson, 0).startsWith('sentence:0:0:'),
    'getSentenceProgressKey: produces deterministic hashed sentence key'
  );

  // 3. YouTube ID extractor & cue timeline resolution
  assert(
    extractYoutubeVideoId('https://www.youtube.com/watch?v=ki_DGMh2r0c&t=12s') === 'ki_DGMh2r0c',
    'extractYoutubeVideoId: parses standard watch?v= URL'
  );
  assert(
    extractYoutubeVideoId('https://youtu.be/lwAG7bBg4n8?si=abc') === 'lwAG7bBg4n8',
    'extractYoutubeVideoId: parses youtu.be short URL'
  );
  assert(extractYoutubeVideoId('not-a-valid-url') === null, 'extractYoutubeVideoId: returns null for invalid URL');

  const mockClip = { status: 'published', start_seconds: 0, end_seconds: 30 };
  const mockCues = [
    { start: 0, end: 5, text: 'First sentence' },
    { start: 5, end: 12, text: 'Second sentence' },
    { start: 12, end: 25, text: 'Third sentence' },
  ];
  assert(resolveActiveCueIndex(7.5, mockClip, mockCues) === 1, 'resolveActiveCueIndex: resolves middle cue index via binary search');
  assert(resolveActiveCueIndex(35, mockClip, mockCues) === -1, 'resolveActiveCueIndex: returns -1 past clip end');

  const shCompare = compareShadowingWords('Once upon a time', 'Once a time');
  assert(shCompare.matched.size === 3 && !shCompare.correct, 'compareShadowingWords: tracks partial sequential word matches');

  // 4. OpenPronounce phoneme-to-grapheme alignment view
  const mockPronounce = {
    score: 82.5,
    transcribe: 'the ship sailed',
    differences: {
      expected_phones: [['ð', 'ə'], ['ʃ', 'ɪ', 'p'], ['s', 'eɪ', 'l', 'd']],
      heard_phones: ['ð', 'ə', 's', 'ɪ', 'p', 's', 'eɪ', 'l', 'd'],
      errors: [{ word: 'ship', position: 1, actual: ['s', 'ɪ', 'p'] }],
      word_alignments: [
        {
          position: 0,
          word: 'the',
          expected: ['ð', 'ə'],
          actual: ['ð', 'ə'],
          phones: [
            { expected: 'ð', heard: 'ð', confidence: 0.9 },
            { expected: 'ə', heard: 'ə', confidence: 0.9 },
          ],
        },
        {
          position: 1,
          word: 'ship',
          expected: ['ʃ', 'ɪ', 'p'],
          actual: ['s', 'ɪ', 'p'],
          phones: [
            { expected: 'ʃ', heard: 's', confidence: 0.85 },
            { expected: 'ɪ', heard: 'ɪ', confidence: 0.9 },
            { expected: 'p', heard: 'p', confidence: 0.95 },
          ],
        },
      ],
    },
  };
  const view = buildSentencePronunciationView(mockPronounce, 'the ship sailed');
  assert(view !== null && view.score === 82.5, 'buildSentencePronunciationView: builds valid score view');
  assert(view.mismatchedCount === 1, 'buildSentencePronunciationView: detects 1 mismatched word ("ship")');
  assert(
    view.wordViews[1].segments.some((s) => s.text === 'sh' && s.level === 'bad'),
    'buildSentencePronunciationView: highlights "sh" in "ship" as bad phoneme match'
  );

  return { totalTests, passedTests };
}
