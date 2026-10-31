// src/context/ModalContext.jsx
// 100% Pure React Modal State Management
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modals, setModals] = useState({
    bugReport:      { open: false, data: null },
    pricingModal:   { open: false },
    createTopic:    { open: false },
    addWord:        { open: false, topicId: null, passageId: null },
    saveWordToTopic:{ open: false, wordData: null },
    bulkAdd:        { open: false },
    srsExplainer:   { open: false },
    forgotPassword: { open: false },
    authError:      { open: false, desc: '' },
    ieltsGoal:      { open: false },
    flashcardMode:  { open: false, onSelect: null },
    requireLogin:   { open: false, title: '', message: '', actionName: '' },
  });

  const openModal = useCallback((modalName, data = {}) => {
    // Khi quản trị viên bật chế độ Free toàn hệ thống, tự động tắt/bỏ qua pop-up bảng giá PRO
    if (modalName === 'pricingModal' && typeof window !== 'undefined' && window._hivocabGlobalFree) {
      return;
    }
    setModals((prev) => ({
      ...prev,
      [modalName]: { open: true, ...data },
    }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals((prev) => ({
      ...prev,
      [modalName]: { ...prev[modalName], open: false },
    }));
  }, []);

  // Expose global aliases so any non-React code can still trigger React modals
  useEffect(() => {
    window.__modalContext = { openModal, closeModal };
    window.openPricingModal = () => openModal('pricingModal');
    window.closePricingModal = () => closeModal('pricingModal');
    window.openCreateTopicModal = () => openModal('createTopic');
    window.closeCreateTopicModal = () => closeModal('createTopic');
    window.openAddWordModal = (topicId, passageId) => openModal('addWord', { topicId, passageId });
    window.closeAddWordModal = () => closeModal('addWord');
    window.openSaveWordToTopicModal = (wordData) => openModal('saveWordToTopic', { wordData });
    window.dictOpenSaveModal = (wordData) => openModal('saveWordToTopic', { wordData });
    window.openVocabBulkAddModal = () => openModal('bulkAdd');
    window.closeVocabBulkAddModal = () => closeModal('bulkAdd');
    window.openForgotPasswordModal = () => openModal('forgotPassword');
    window.openAuthErrorModal = (desc) => openModal('authError', { desc });
    window.openIELTSGoalModal = () => openModal('ieltsGoal');
    window.closeIELTSGoalModal = () => closeModal('ieltsGoal');
    window.openFlashcardModeModal = (onSelect) => openModal('flashcardMode', { onSelect });
    window.closeFlashcardModeModal = () => closeModal('flashcardMode');
    window.openRequireLoginModal = (message, title, actionName) => openModal('requireLogin', { message, title, actionName });
    window.closeRequireLoginModal = () => closeModal('requireLogin');
    window.openBugReportModal = (data = {}) => openModal('bugReport', data);
    window.closeBugReportModal = () => closeModal('bugReport');
    window.openFeedbackModal = (data = {}) => openModal('bugReport', { initialType: 'feedback', ...data });

    return () => {
      delete window.__modalContext;
      delete window.openBugReportModal;
      delete window.closeBugReportModal;
      delete window.openFeedbackModal;
    };
  }, [openModal, closeModal]);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used inside ModalProvider');
  return ctx;
}

export default ModalContext;
