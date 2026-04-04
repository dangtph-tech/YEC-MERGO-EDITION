import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('vi'); // Default to Vietnamese

  useEffect(() => {
    const savedLang = localStorage.getItem('mergo_lang');
    if (savedLang && (savedLang === 'en' || savedLang === 'vi')) {
      setLang(savedLang);
    }
  }, []);

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('mergo_lang', newLang);
  };

  const t = (path, params = {}) => {
    const keys = path.split('.');
    let value = translations[lang];
    for (const key of keys) {
      if (value === undefined) return path;
      value = value[key];
    }
    if (typeof value !== 'string') return path;
    
    // Replace params (e.g., {count})
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, v);
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
