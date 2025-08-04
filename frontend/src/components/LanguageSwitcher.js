import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n, ready } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  // localStorage'da dil bilgisi varsa başlangıçta true yap
  const [isLoaded, setIsLoaded] = useState(() => {
    return Boolean(localStorage.getItem('i18nextLng'));
  });
  const dropdownRef = useRef(null);

  const languages = [
    { 
      code: 'en', 
      name: 'English', 
      nativeName: 'English',
      flag: '🇺🇸' 
    },
    { 
      code: 'tr', 
      name: 'Turkish', 
      nativeName: 'Türkçe',
      flag: '🇹🇷' 
    },
  ];

  // i18n yüklenme durumunu takip et
  useEffect(() => {
    if ((ready && i18n.language) || localStorage.getItem('i18nextLng')) {
      setIsLoaded(true);
    }
  }, [ready, i18n.language]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Mevcut dili belirle - i18n'den veya localStorage'dan
  const currentLangCode = i18n.language || localStorage.getItem('i18nextLng') || 'en';
  const currentLanguage = languages.find(lang => lang.code === currentLangCode) || languages[0];

  // i18n hazır değilse bileşeni render etme - tüm hook'lardan sonra
  if (!isLoaded) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center space-x-2 p-2 text-gray-400 dark:text-dark-500 rounded-lg">
          <span className="text-sm">🌐</span>
          <span className="text-sm font-medium hidden sm:block">...</span>
        </div>
      </div>
    );
  }

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Language Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-all duration-200"
        title="Select Language"
      >
        <span className="text-sm">{currentLanguage.flag}</span>
        <span className="text-sm font-medium hidden sm:block">
          {currentLanguage.nativeName}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-200 dark:border-dark-700 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-dark-700">
            <p className="text-xs text-gray-500 dark:text-dark-400 uppercase tracking-wide">
              Select Language
            </p>
          </div>
          
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-dark-700/50 transition-colors duration-200 ${
                currentLanguage.code === language.code 
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-700 dark:text-dark-300'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <div className="flex-1 text-left">
                <div className="font-medium">{language.nativeName}</div>
                <div className="text-xs text-gray-500 dark:text-dark-400">
                  {language.name}
                </div>
              </div>
              {currentLanguage.code === language.code && (
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;