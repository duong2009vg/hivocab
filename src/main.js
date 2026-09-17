/**
 * HiVocab Single Page Application - Modern ESM Entry Point
 */
import { initRouter, navigateTo } from './router.js';
import { showToast } from './components/common/Toast.js';
import { openAddWordModal, closeAddWordModal } from './components/modals/AddWordModal.js';
import { getHiDB } from './services/db.js';
import { getHiSession } from './services/session.js';

console.log('[HiVocab] Initializing modern component SPA architecture v0.2.0');

// Initialize router
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initRouter();
    });
  } else {
    initRouter();
  }
}

export {
  initRouter,
  navigateTo,
  showToast,
  openAddWordModal,
  closeAddWordModal,
  getHiDB,
  getHiSession,
};
