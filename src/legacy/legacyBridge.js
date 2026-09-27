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

/**
 * Navigation Bridge
 */
export const navigate = (page, preserveHash = false) => {
  return safeCall('navigateTo', page, preserveHash);
};

/**
 * Learning Session Bridge
 */
export const startSession = (...args) => {
  return safeCall('startSession', ...args);
};

/**
 * Modals & Dialogs Bridge
 */
export const openPricingModal = () => safeCall('openPricingModal');
export const openForgotPasswordModal = () => safeCall('openForgotPasswordModal');
export const openAuthErrorModal = (desc) => safeCall('openAuthErrorModal', desc);
export const closeThreadDetail = (flag) => safeCall('closeThreadDetail', flag);

/**
 * Profile & Auth UI Bridge
 */
export const toggleMobileProfileDropdown = () => safeCall('toggleMobileProfileDropdown');
export const handleProfileClick = () => safeCall('handleProfileClick');
export const handleMobileDropdownAuth = () => safeCall('handleMobileDropdownAuth');
export const handleGoogleLogin = () => safeCall('handleGoogleLogin');
export const handleLogout = () => safeCall('handleLogout');
export const toggleDevMode = () => safeCall('toggleDevMode');
export const handleStartNow = () => safeCall('handleStartNow');

/**
 * Vocabulary & Dashboard Bridge
 */
export const filterVocabLevel = (level) => safeCall('filterVocabLevel', level);
export const refreshDashboard = () => {
  if (typeof window !== 'undefined' && window.HiDashboard && typeof window.HiDashboard.refresh === 'function') {
    return window.HiDashboard.refresh();
  }
};
export const getDashboardStats = async () => {
  if (typeof window !== 'undefined' && window.HiDashboard && typeof window.HiDashboard.getDashboardStats === 'function') {
    return window.HiDashboard.getDashboardStats();
  }
  return null;
};
export const showDayDetail = (dateStr) => {
  if (typeof window !== 'undefined' && window.HiDashboard && typeof window.HiDashboard.showDayDetail === 'function') {
    return window.HiDashboard.showDayDetail(dateStr);
  }
};

/**
 * Audio & TTS Bridge
 */
export const playWord = (word, rate = 0.9, lang = 'en') => {
  if (typeof window !== 'undefined' && window.HiAudio && typeof window.HiAudio.playWord === 'function') {
    return window.HiAudio.playWord(word, rate, lang);
  }
  return false;
};

export default {
  navigate,
  startSession,
  openPricingModal,
  openForgotPasswordModal,
  openAuthErrorModal,
  closeThreadDetail,
  toggleMobileProfileDropdown,
  handleProfileClick,
  handleMobileDropdownAuth,
  handleGoogleLogin,
  handleLogout,
  toggleDevMode,
  handleStartNow,
  filterVocabLevel,
  refreshDashboard,
  getDashboardStats,
  showDayDetail,
  playWord,
};
