/* global console, process */
// tests/lesson-study-flows.spec.js
// Specification test entry point for HiVocab Lesson Study Flows
// Conforms to TEST_INFRA.md specification mapping

import { fileURLToPath } from 'url';
import { runLessonStudyFlowsTests } from './lesson-study-flows.test.js';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runLessonStudyFlowsTests().then(({ failedTests }) => {
    if (failedTests === 0) {
      console.log('🎉 ALL LESSON STUDY FLOWS SPEC TESTS PASSED SUCCESSFULLY!\n');
      process.exit(0);
    } else {
      console.error(`💥 ${failedTests} SPEC TESTS FAILED!\n`);
      process.exit(1);
    }
  }).catch(err => {
    console.error('Fatal spec test error:', err);
    process.exit(1);
  });
}

export { runLessonStudyFlowsTests };
