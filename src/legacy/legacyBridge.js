// src/legacy/legacyBridge.js
// Centralized Bridge Adapter for all Legacy Global Functions
// Enables React components to call legacy services through a typed, safe adapter
// instead of direct window.* references.

function safeCall(fnName, ...args) {
  if (typeof window !== 'undefined' && typeof window[fnName] === 'function') {
    try {
      return window[fnName](...args);
    } catch (err) {
      console.error(`[LegacyBridge] Error calling window.${fnName}:`, err);
    }
  } else {
    console.warn(`[LegacyBridge] window.${fnName} is not available.`);
  }
}

function safeMethodCall(objName, methodName, ...args) {
  if (typeof window !== 'undefined' && window[objName] && typeof window[objName][methodName] === 'function') {
    try {
      return window[objName][methodName](...args);
    } catch (err) {
      console.error(`[LegacyBridge] Error calling window.${objName}.${methodName}:`, err);
    }
  } else {
    console.warn(`[LegacyBridge] window.${objName}.${methodName} is not available.`);
  }
}

/**
 * 1. Navigation & Study Flow Bridge
 */
export const navigate = (page, preserveHash = false) => safeCall('navigateTo', page, preserveHash);
export const startSession = (...args) => safeCall('startSession', ...args);
export const startSinglePractice = (modeIndex) => safeCall('startSinglePractice', modeIndex);
export const startBilingualReading = () => safeCall('startBilingualReading');
export const closeBilingualReading = () => safeCall('closeBilingualReading');

/**
 * 2. Modals & Feedback Dialogs Bridge
 */
export const openPricingModal = () => safeCall('openPricingModal');
export const openForgotPasswordModal = () => safeCall('openForgotPasswordModal');
export const openAuthErrorModal = (desc) => safeCall('openAuthErrorModal', desc);
export const openBugReportModal = (meta) => safeCall('openBugReportModal', meta);
export const openCreateTopicModal = () => safeCall('openCreateTopicModal');
export const openAddWordModal = (topicId, passageId) => {
  const tId = topicId !== undefined ? topicId : (typeof window !== 'undefined' ? window._currentTopicId : undefined);
  const pId = passageId !== undefined ? passageId : (typeof window !== 'undefined' ? window._currentPassageId : undefined);
  return safeCall('openAddWordModal', tId, pId);
};
export const openVocabAddModal = () => safeCall('openVocabAddModal');
export const openVocabBulkAddModal = () => safeCall('openVocabBulkAddModal');
export const openSRSExplainerModal = () => safeCall('openSRSExplainerModal');
export const closeThreadDetail = (flag) => safeCall('closeThreadDetail', flag);

/**
 * 3. Profile & Auth UI Bridge
 */
export const toggleMobileProfileDropdown = () => safeCall('toggleMobileProfileDropdown');
export const handleProfileClick = () => safeCall('handleProfileClick');
export const handleMobileDropdownAuth = () => safeCall('handleMobileDropdownAuth');
export const handleGoogleLogin = () => safeCall('handleGoogleLogin');
export const handleLogout = () => safeCall('handleLogout');
export const toggleDevMode = () => safeCall('toggleDevMode');
export const handleStartNow = () => safeCall('handleStartNow');
export const copyZaloSupport = () => safeCall('copyZaloSupport');
export const handleSupportSubmit = (e) => safeCall('handleSupportSubmit', e);

/**
 * 4. Vocabulary & Dashboard Bridge
 */
export const filterVocabLevel = (level) => safeCall('filterVocabLevel', level);
export const loadVocabularyPage = (page = 1) => safeCall('_loadVocabularyPage', page);
export const filterVocabList = () => safeCall('_filterVocabList');
export const clearVocabSearch = () => safeCall('clearVocabSearch');
export const onVocabTopicFilterChange = (val) => safeCall('onVocabTopicFilterChange', val);
export const filterLessonWords = () => safeCall('filterLessonWords');
export const refreshDashboard = () => safeMethodCall('HiDashboard', 'refresh');
export const getDashboardStats = async () => {
  if (typeof window !== 'undefined' && window.HiDashboard && typeof window.HiDashboard.getDashboardStats === 'function') {
    return window.HiDashboard.getDashboardStats();
  }
  return null;
};
export const showDayDetail = (dateStr) => safeMethodCall('HiDashboard', 'showDayDetail', dateStr);

/**
 * 5. Audio, Sound & Speech Bridge
 */
export const playWord = (word, rate = 0.9, lang = 'en') => {
  if (typeof window !== 'undefined' && window.HiAudio && typeof window.HiAudio.playWord === 'function') {
    return window.HiAudio.playWord(word, rate, lang);
  }
  return false;
};
export const speakWord = (word) => safeCall('HiSpeak', word);
export const toggleSoundMute = () => safeMethodCall('HiSound', 'toggleMute');

/**
 * 6. Learning & Practice Exercises Bridge
 */
export const flipCard = () => safeCall('flipCard');
export const rateCard = (grade) => safeCall('rateCard', grade);
export const handleExerciseComplete = () => safeCall('handleExerciseComplete');
export const selectMCQ = (element) => safeCall('selectMCQ', element);
export const getAIHint = () => safeCall('getAIHint');
export const checkFillInBlank = () => safeCall('checkFillInBlank');
export const reportCurrentLearningError = () => safeCall('reportCurrentLearningError');

/**
 * 7. Dictionary Bridge
 */
export const dictOnInput = (val) => safeCall('dictOnInput', val);
export const dictOnKeyDown = (e) => {
  if (typeof window !== 'undefined' && typeof window.dictOnKeyDown === 'function') {
    return window.dictOnKeyDown(e);
  }
  if (e && e.key === 'Enter') {
    return safeCall('dictSearch');
  }
};
export const dictSearch = () => safeCall('dictSearch');
export const dictClearInput = () => safeCall('dictClearInput');
export const dictClearRecent = () => safeCall('dictClearRecent');
export const dictCopyWord = () => safeCall('dictCopyWord');
export const dictOpenSaveModal = () => safeCall('dictOpenSaveModal');
export const dictPlayAudio = () => safeCall('dictPlayAudio');

/**
 * 8. Settings & Themes Bridge
 */
export const toggleTheme = () => safeCall('toggleTheme');
export const applyTheme = (theme) => safeCall('applyTheme', theme);
export const handleSettingsChangePassword = (e) => safeCall('handleSettingsChangePassword', e);

/**
 * 9. Library / Community Bridge
 */
export const switchLibraryTab = (tab) => safeCall('switchLibraryTab', tab);
export const handleLibrarySearch = (val) => safeCall('handleLibrarySearch', val);
export const clearLibrarySearch = () => safeCall('clearLibrarySearch');
export const handleLibrarySortChange = (val) => safeCall('handleLibrarySortChange', val);

/**
 * 10. Bilingual Reading Bridge
 */
export const togglePassageSwitcher = () => safeCall('togglePassageSwitcher');
export const switchBilingualTab = (tab) => safeCall('switchBilingualTab', tab);
export const changeBilingualFontSize = (delta) => safeCall('changeBilingualFontSize', delta);
export const setBilingualViewMode = (mode) => safeCall('setBilingualViewMode', mode);
export const reportBilingualReadingError = () => safeCall('reportBilingualReadingError');

/**
 * 11. THPT Exam CBT Room Bridge
 */
export const thptPrevQuestion = () => safeMethodCall('ThptExam', 'prevQuestion');
export const thptNextQuestion = () => safeMethodCall('ThptExam', 'nextQuestion');
export const thptSetMobileView = (mode) => safeMethodCall('ThptExam', 'setMobileView', mode);
export const thptChangeFontSize = (delta) => safeMethodCall('ThptExam', 'changeFontSize', delta);
export const thptOpenReport = () => {
  if (typeof window !== 'undefined' && window.ThptExam && typeof window.ThptExam.openCurrentQuestionReport === 'function') {
    return window.ThptExam.openCurrentQuestionReport();
  }
  return safeCall('openBugReportModal', { feature: 'thpt_exam' });
};
export const thptToggleFullscreen = () => safeMethodCall('ThptExam', 'toggleFullscreen');
export const thptConfirmSubmit = () => safeMethodCall('ThptExam', 'confirmSubmit');
export const thptShowResultsModal = (results) => {
  const res = results || (typeof window !== 'undefined' && window.ThptExam ? window.ThptExam.results : undefined);
  return safeMethodCall('ThptExam', 'showResultsModal', res);
};
export const thptExitRoom = () => safeMethodCall('ThptExam', 'exitRoom');
export const thptCloseSubmitConfirmModal = () => safeMethodCall('ThptExam', 'closeSubmitConfirmModal');
export const thptSubmitExam = (flag = false) => safeMethodCall('ThptExam', 'submitExam', flag);
export const thptOnSearchInput = (val) => safeMethodCall('ThptExam', 'onSearchInput', val);
export const thptClearSearch = () => safeMethodCall('ThptExam', 'clearSearch');

export default {
  navigate,
  startSession,
  startSinglePractice,
  startBilingualReading,
  closeBilingualReading,
  openPricingModal,
  openForgotPasswordModal,
  openAuthErrorModal,
  openBugReportModal,
  openCreateTopicModal,
  openAddWordModal,
  openVocabAddModal,
  openVocabBulkAddModal,
  openSRSExplainerModal,
  closeThreadDetail,
  toggleMobileProfileDropdown,
  handleProfileClick,
  handleMobileDropdownAuth,
  handleGoogleLogin,
  handleLogout,
  toggleDevMode,
  handleStartNow,
  copyZaloSupport,
  handleSupportSubmit,
  filterVocabLevel,
  loadVocabularyPage,
  filterVocabList,
  clearVocabSearch,
  onVocabTopicFilterChange,
  filterLessonWords,
  refreshDashboard,
  getDashboardStats,
  showDayDetail,
  playWord,
  speakWord,
  toggleSoundMute,
  flipCard,
  rateCard,
  handleExerciseComplete,
  selectMCQ,
  getAIHint,
  checkFillInBlank,
  reportCurrentLearningError,
  dictOnInput,
  dictOnKeyDown,
  dictSearch,
  dictClearInput,
  dictClearRecent,
  dictCopyWord,
  dictOpenSaveModal,
  dictPlayAudio,
  toggleTheme,
  applyTheme,
  handleSettingsChangePassword,
  switchLibraryTab,
  handleLibrarySearch,
  clearLibrarySearch,
  handleLibrarySortChange,
  togglePassageSwitcher,
  switchBilingualTab,
  changeBilingualFontSize,
  setBilingualViewMode,
  reportBilingualReadingError,
  thptPrevQuestion,
  thptNextQuestion,
  thptSetMobileView,
  thptChangeFontSize,
  thptOpenReport,
  thptToggleFullscreen,
  thptConfirmSubmit,
  thptShowResultsModal,
  thptExitRoom,
  thptCloseSubmitConfirmModal,
  thptSubmitExam,
  thptOnSearchInput,
  thptClearSearch,
};
