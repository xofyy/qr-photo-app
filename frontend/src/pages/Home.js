import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createSession, getQRCode } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import QRScannerComponent from '../components/QRScanner';
import { logger } from '../utils/logger';

const Home = () => {
  const { t } = useTranslation(['home', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [sessionUrl, setSessionUrl] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrScannerActive, setQrScannerActive] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { initiateGoogleLogin, isAuthenticated, user } = useAuth();

  // Check for auth errors
  const authError = searchParams.get('error');

  const handleCreateSession = async () => {
    setIsLoading(true);
    setQrCode(null);
    try {
      const sessionResponse = await createSession();
      const newSessionId = sessionResponse.data.session_id;
      
      if (isAuthenticated) {
        // For authenticated users, redirect to the detailed session info page
        navigate(`/session-info/${newSessionId}`);
      } else {
        // For anonymous users, show QR code inline (keep existing behavior)
        setSessionId(newSessionId);
        
        const qrResponse = await getQRCode(newSessionId);
        setQrCode(qrResponse.data.qr_code);
        setSessionUrl(qrResponse.data.session_url);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(sessionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = sessionUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `qr-session-${sessionId.slice(0, 8)}.png`;
    link.href = `data:image/png;base64,${qrCode}`;
    link.click();
  };

  const handleQRScanSuccess = (scannedResult) => {
    logger.debug('QR Scan Success:', scannedResult);
    
    // Extract the actual data from the scan result
    const scannedUrl = typeof scannedResult === 'string' ? scannedResult : scannedResult.data;
    logger.debug('Extracted URL:', scannedUrl);
    
    try {
      // First check if it's a valid URL
      const url = new URL(scannedUrl);
      
      // Check if it's a session URL
      if (url.pathname.includes('/session/')) {
        const pathSegments = url.pathname.split('/');
        const sessionIndex = pathSegments.indexOf('session');
        
        if (sessionIndex !== -1 && pathSegments[sessionIndex + 1]) {
          const scannedSessionId = pathSegments[sessionIndex + 1];
          logger.info('Navigating to session:', scannedSessionId);
          
          // Close scanner
          setQrScannerActive(false);
          
          // Navigate to the session
          navigate(`/session/${scannedSessionId}`);
          return;
        }
      }
      
      // If we get here, it's not a session URL - ask user what to do
      const userChoice = window.confirm(
        t('home:scanner.invalidSession', { url: scannedUrl })
      );
      
      if (userChoice) {
        // User wants to open the URL anyway
        window.open(scannedUrl, '_blank');
        setQrScannerActive(false);
      } else {
        // User wants to continue scanning - restart the scanner
        setTimeout(() => {
          if (document.querySelector('video')) {
            // Scanner is still active, just continue
            logger.debug('Continue scanning message');
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('Error processing scanned content:', error);
      
      // Not a valid URL - show the raw content and ask user
      const userChoice = window.confirm(
        t('home:scanner.invalidContent', { content: scannedUrl })
      );
      
      if (userChoice) {
        // Copy to clipboard
        navigator.clipboard.writeText(scannedUrl).then(() => {
          alert(t('home:scanner.copiedToClipboard'));
        }).catch(() => {
          alert(`QR code content: ${scannedUrl}`);
        });
        setQrScannerActive(false);
      }
    }
  };

  const openQRScanner = () => {
    setQrScannerActive(true);
  };

  const closeQRScanner = () => {
    setQrScannerActive(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12">
        {/* Hero Section */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 dark:bg-dark-700 text-blue-800 dark:text-dark-100 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t('home:hero.badge')}
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 dark:from-dark-100 dark:via-dark-200 dark:to-dark-300 bg-clip-text text-transparent mb-4 sm:mb-6 px-2">
            {t('home:hero.title')}
            <br />
            <span className="text-blue-600 dark:text-dark-200">{t('home:hero.titleHighlight')}</span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-dark-300 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
            {t('home:hero.description')}
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white/50 dark:bg-dark-800/50 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-gray-200/50 dark:border-dark-600/50">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-dark-700 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-dark-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-dark-100 mb-2">{t('home:features.qrGeneration.title')}</h3>
              <p className="text-gray-600 dark:text-dark-300 text-sm text-center">{t('home:features.qrGeneration.description')}</p>
            </div>

            <div className="flex flex-col items-center p-6 bg-white/50 dark:bg-dark-800/50 rounded-2xl backdrop-blur-sm border border-gray-200/50 dark:border-dark-600/50">
              <div className="w-12 h-12 bg-green-100 dark:bg-dark-700 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-dark-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-dark-100 mb-2">{t('home:features.cameraAccess.title')}</h3>
              <p className="text-gray-600 dark:text-dark-300 text-sm text-center">{t('home:features.cameraAccess.description')}</p>
            </div>

            <div className="flex flex-col items-center p-6 bg-white/50 dark:bg-dark-800/50 rounded-2xl backdrop-blur-sm border border-gray-200/50 dark:border-dark-600/50">
              <div className="w-12 h-12 bg-purple-100 dark:bg-dark-700 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-dark-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-dark-100 mb-2">{t('home:features.cloudStorage.title')}</h3>
              <p className="text-gray-600 dark:text-dark-300 text-sm text-center">{t('home:features.cloudStorage.description')}</p>
            </div>
          </div>
        </div>

        {/* Auth Error Display */}
        {authError && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 dark:bg-dark-800 border border-red-200 dark:border-dark-600 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-dark-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">{t('home:errors.authError')}</h3>
              <p className="text-red-700 dark:text-red-400">
                {authError === 'auth_failed' && t('home:errors.authFailed')}
                {authError === 'no_token' && t('home:errors.noToken')}
              </p>
            </div>
          </div>
        )}

        {/* Role-Based Action Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-dark-100 mb-4">{t('home:hero.getStarted')}</h2>
            <p className="text-xl text-gray-600 dark:text-dark-300">{t('home:hero.chooseRole')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Event Organizer Path */}
            <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 dark:border-dark-600/50 p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 dark:bg-dark-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600 dark:text-dark-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-4">{t('home:organizer.title')}</h3>
              <p className="text-gray-600 dark:text-dark-300 mb-8">{t('home:organizer.description')}</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center text-left">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-dark-200">{t('home:organizer.feature1')}</span>
                </div>
                <div className="flex items-center text-left">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-dark-200">{t('home:organizer.feature2')}</span>
                </div>
                <div className="flex items-center text-left">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-dark-200">{t('home:organizer.feature3')}</span>
                </div>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-dark-600 dark:to-dark-700 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-dark-500 dark:hover:to-dark-600 text-white dark:text-dark-100 font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {t('home:organizer.dashboardButton')}
                </button>
              ) : (
                <button
                  onClick={initiateGoogleLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-dark-600 dark:to-dark-700 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-dark-500 dark:hover:to-dark-600 text-white dark:text-dark-100 font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>{t('home:organizer.signInButton')}</span>
                </button>
              )}
            </div>

            {/* Photo Participant Path */}
            <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 dark:border-dark-600/50 p-8 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-dark-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600 dark:text-dark-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-4">{t('home:participant.title')}</h3>
              <p className="text-gray-600 dark:text-dark-300 mb-8">{t('home:participant.description')}</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center text-left">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-dark-200">{t('home:participant.feature1')}</span>
                </div>
                <div className="flex items-center text-left">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-dark-200">{t('home:participant.feature2')}</span>
                </div>
                <div className="flex items-center text-left">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700 dark:text-dark-200">{t('home:participant.feature3')}</span>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={openQRScanner}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 dark:from-dark-600 dark:to-dark-700 hover:from-green-700 hover:to-emerald-700 dark:hover:from-dark-500 dark:hover:to-dark-600 text-white dark:text-dark-100 font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                  </svg>
                  <span>{t('home:participant.scanButton')}</span>
                </button>
                
                <p className="text-sm text-gray-500 dark:text-dark-400">
                  {t('home:participant.navigate')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Display */}
        {qrCode && (
          <div className="max-w-2xl mx-auto mt-8 animate-fade-in">
            <div className="bg-white/90 dark:bg-dark-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 dark:border-dark-600/50 p-8 sm:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-dark-700 text-green-800 dark:text-green-300 rounded-full text-sm font-medium mb-4">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('home:qrDisplay.successBadge')}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-100 mb-2">{t('home:qrDisplay.title')}</h2>
                <p className="text-gray-600 dark:text-dark-300">{t('home:qrDisplay.description')}</p>
              </div>
              
              <div className="flex flex-col items-center">
                {/* QR Code */}
                <div className="bg-white dark:bg-dark-700 p-6 rounded-2xl shadow-lg mb-6 transform hover:scale-105 transition-transform duration-300">
                  <img 
                    src={`data:image/png;base64,${qrCode}`}
                    alt="QR Code" 
                    className="w-48 h-48 sm:w-64 sm:h-64"
                  />
                </div>
                
                {/* Session Info */}
                <div className="w-full max-w-md space-y-4">
                  <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-xl border border-gray-200 dark:border-dark-600">
                    <p className="text-sm text-gray-500 dark:text-dark-400 mb-2">{t('home:qrDisplay.sessionLink')}</p>
                    <p className="text-sm text-gray-800 dark:text-dark-200 break-all font-mono bg-white dark:bg-dark-800 p-2 rounded border dark:border-dark-600">
                      {sessionUrl}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-dark-700 p-4 rounded-xl border border-blue-200 dark:border-dark-600">
                    <p className="text-sm text-blue-800 dark:text-dark-200">
                      <strong>{t('home:qrDisplay.sessionId')}</strong> {sessionId.slice(0, 8)}...
                    </p>
                    <p className="text-sm text-blue-600 dark:text-dark-300 mt-1">
                      {t('home:qrDisplay.sessionInfo')}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-md">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-800 dark:text-dark-200 font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{copied ? t('home:qrDisplay.copiedButton') : t('home:qrDisplay.copyButton')}</span>
                  </button>
                  
                  <button
                    onClick={downloadQR}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-100 dark:bg-dark-700 hover:bg-blue-200 dark:hover:bg-dark-600 text-blue-800 dark:text-dark-200 font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{t('home:qrDisplay.downloadButton')}</span>
                  </button>
                </div>

                {/* Preview Session Button */}
                <button
                  onClick={() => navigate(`/session/${sessionId}`)}
                  className="mt-4 text-blue-600 dark:text-dark-300 hover:text-blue-800 dark:hover:text-dark-200 font-medium flex items-center space-x-1 transition-colors duration-200"
                >
                  <span>{t('home:qrDisplay.previewButton')}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner Component */}
        <QRScannerComponent
          isActive={qrScannerActive}
          onClose={closeQRScanner}
          onScanSuccess={handleQRScanSuccess}
        />

    </div>
  );
};

export default Home;
