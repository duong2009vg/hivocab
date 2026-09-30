// src/context/ModalContext.jsx
// React context for controlling modal visibility.
// Acts as a thin bridge during migration: React state is source of truth,
// but legacy window.* functions are still called for backward compat.
// Once each modal is rewritten as React, remove its legacyMap entry.
import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  // Each modal: open (bool) + optional data payload
  const [modals, setModals] = useState({
    bugReport:      { open: false, data: null },
    pricingModal:   { open: false },
    createTopic:    { open: false },
    addWord:        { open: false, topicId: null, passageId: null },
    bulkAdd:        { open: false },
    srsExplainer:   { open: false },
    forgotPassword: { open: false },
    authError:      { open: false, desc: '' },
  });

  const openModal = useCallback((modalName, data = {}) => {
    setModals(prev => ({
      ...prev,
      [modalName]: { open: true, ...data },
    }));

    // BRIDGE: also call legacy window handlers for modals not yet React-ified.
    // Delete each entry below once the corresponding modal is migrated.
    const legacyMap = {
      bugReport:      () => window.openBugReportModal?.(data),
      pricingModal:   () => window.openPricingModal?.(),
      createTopic:    () => window.openCreateTopicModal?.(),
      addWord:        () => window.openAddWordModal?.(data.topicId, data.passageId),
      bulkAdd:        () => window.openVocabBulkAddModal?.(),
      srsExplainer:   () => window.openSRSExplainerModal?.(),
      forgotPassword: () => window.openForgotPasswordModal?.(),
      authError:      () => window.openAuthErrorModal?.(data.desc),
    };
    legacyMap[modalName]?.();
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({
      ...prev,
      [modalName]: { ...prev[modalName], open: false },
    }));
  }, []);

  // Expose to window so legacy (non-React) scripts can still trigger modals
  // via window.__modalContext.openModal(name, data).
  React.useEffect(() => {
    window.__modalContext = { openModal, closeModal };
    return () => { delete window.__modalContext; };
  }, [openModal, closeModal]);

  return (
    <ModalContext.Provider value={{ modals, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used inside <ModalProvider>');
  return ctx;
}

export default ModalContext;
