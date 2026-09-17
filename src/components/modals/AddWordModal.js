/**
 * HiVocab Add Word Modal Component
 * Provides instant 0ms modal opening and non-blocking asynchronous topic fetching
 */

export function openAddWordModal(targetTopicId = null) {
  if (typeof document === 'undefined') return;

  const modal = document.getElementById('modal-add-word') || document.getElementById('add-word-modal');
  if (!modal) return;

  // 1. Instant 0ms open
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  // Lock body scroll safely
  if (typeof window.lockBodyScroll === 'function') {
    window.lockBodyScroll(true);
  }

  // Clear inputs & autofocus
  const wordInput = document.getElementById('add-word-english') || document.getElementById('add-word-input');
  if (wordInput) {
    wordInput.value = '';
    setTimeout(() => wordInput.focus(), 50);
  }
  const meaningInput = document.getElementById('add-word-meaning') || document.getElementById('add-meaning-input');
  if (meaningInput) meaningInput.value = '';
  const exampleInput = document.getElementById('add-word-example') || document.getElementById('add-example-input');
  if (exampleInput) exampleInput.value = '';

  // 2. Background async preparation
  if (typeof window._initAddWordDestination === 'function') {
    window._initAddWordDestination(targetTopicId);
  }
}

export function closeAddWordModal() {
  if (typeof document === 'undefined') return;

  const modal = document.getElementById('modal-add-word') || document.getElementById('add-word-modal');
  if (!modal) return;

  modal.classList.add('hidden');
  modal.classList.remove('flex');

  // Release body scroll
  if (typeof window.lockBodyScroll === 'function') {
    window.lockBodyScroll(false);
  }
}

// Global window bridge
if (typeof window !== 'undefined') {
  window.HiAddWordModal = {
    open: openAddWordModal,
    close: closeAddWordModal,
  };
}

export default {
  open: openAddWordModal,
  close: closeAddWordModal,
};
