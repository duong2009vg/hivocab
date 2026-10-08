// src/context/LandingLangContext.jsx
// Quản lý ngôn ngữ hiển thị cho Landing Page và các trang giới thiệu (Features, Reviews, FAQ, Support)
// Mặc định ban đầu là Tiếng Anh ('en') theo yêu cầu, hỗ trợ chuyển đổi linh hoạt sang Tiếng Việt ('vi')
import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'hivocab_landing_lang';

const LandingLangContext = createContext({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  isEn: true,
});

export function LandingLangProvider({ children }) {
  // Mặc định tạm thời là 'en' (Tiếng Anh)
  const [lang, setLangState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'vi' || saved === 'en') return saved;
      } catch (_) {}
    }
    return 'en';
  });

  const setLang = (newLang) => {
    if (newLang !== 'vi' && newLang !== 'en') return;
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newLang);
      } catch (_) {}
    }
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'vi' : 'en');
  };

  const value = {
    lang,
    setLang,
    toggleLang,
    isEn: lang === 'en',
  };

  return (
    <LandingLangContext.Provider value={value}>
      {children}
    </LandingLangContext.Provider>
  );
}

export function useLandingLang() {
  const context = useContext(LandingLangContext);
  if (!context) {
    return {
      lang: 'en',
      setLang: () => {},
      toggleLang: () => {},
      isEn: true,
    };
  }
  return context;
}

export default LandingLangContext;
