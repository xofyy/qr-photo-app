import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const UnifiedMenu = () => {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isHomePage = location.pathname === '/';
  const isAdminPage = location.pathname === '/admin';
  const isDashboardPage = location.pathname === '/dashboard';
  const isSessionPage = location.pathname.startsWith('/session/');

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  const languages = [
    { 
      code: 'en', 
      name: 'English', 
      flagSrc: '/flags/gb.png',
      flagAlt: 'United Kingdom Flag'
    },
    { 
      code: 'tr', 
      name: 'Türkçe', 
      flagSrc: '/flags/tr.png',
      flagAlt: 'Turkey Flag'
    }
  ];

  // Handle compound language codes like 'tr-TR' -> 'tr'
  const getCurrentLanguage = () => {
    let langCode = i18n.language || localStorage.getItem('i18nextLng') || 'en';
    
    // Handle compound codes like 'tr-TR' -> 'tr'
    if (langCode.includes('-')) {
      langCode = langCode.split('-')[0];
    }
    
    // Language code cleaned and ready to use
    
    return langCode;
  };
  
  const currentLanguage = getCurrentLanguage();

  return (
    <div className="relative" ref={menuRef}>
      {/* Menu Trigger Button */}
      <button
        onClick={toggleMenu}
        className="relative flex items-center space-x-2 p-2 text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-100 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-all duration-200"
      >
        {/* Menu Icon - Animated Hamburger Menu */}
        <div className="w-5 h-5 flex flex-col justify-center items-center">
          <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
          <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm my-0.5 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
          <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
        </div>
        
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-200 dark:border-dark-700 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
          
          {/* Navigation Section */}
          <div className="px-2">
            <div className="text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wide px-3 py-2">
              {t('navigation.title', 'Navigation')}
            </div>
            
            {!isHomePage && (
              <button
                onClick={() => handleNavigation('/')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>{t('navigation.home')}</span>
              </button>
            )}

            {isAuthenticated && !isDashboardPage && (
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>{t('navigation.dashboard')}</span>
              </button>
            )}

            {isAuthenticated && !isAdminPage && (
              <button
                onClick={() => handleNavigation('/admin')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>{t('navigation.admin')}</span>
              </button>
            )}
          </div>

          {/* Preferences Section */}
          <div className="border-t border-gray-200 dark:border-dark-700 mt-2 pt-2 px-2">
            <div className="text-xs font-medium text-gray-500 dark:text-dark-400 uppercase tracking-wide px-3 py-2">
              {t('preferences', 'Preferences')}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isDarkMode ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  )}
                </svg>
                <span>{isDarkMode ? t('theme.lightMode') : t('theme.darkMode')}</span>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${isDarkMode ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}></div>
              </div>
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => handleLanguageChange(currentLanguage === 'en' ? 'tr' : 'en')}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700/50 rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4 text-gray-500 dark:text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <div className="flex items-center space-x-2 flex-1">
                {(() => {
                  const currentLangData = languages.find(lang => lang.code === currentLanguage) || languages[0];
                  return (
                    <>
                      <img 
                        src={currentLangData.flagSrc} 
                        alt={currentLangData.flagAlt}
                        className="w-5 h-5 rounded-full border border-gray-200 dark:border-dark-600 shadow-sm"
                        style={{ minWidth: '20px', minHeight: '20px', objectFit: 'cover' }}
                        onError={(e) => {
                          // Hide broken flag images gracefully
                          e.target.style.display = 'none';
                        }}
                      />
                      <span>{currentLangData.name}</span>
                    </>
                  );
                })()}
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>


          {/* User Section */}
          {isAuthenticated && user && (
            <div className="border-t border-gray-200 dark:border-dark-700 mt-2 pt-2 px-2">
              <div className="flex items-center space-x-3 px-3 py-2 mb-2">
                {user.avatar_url && (
                  <img 
                    src={user.avatar_url} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-dark-600"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-100 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400 truncate">{user.email}</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>{t('navigation.signOut')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedMenu;