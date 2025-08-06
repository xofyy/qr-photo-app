import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSession, getQRCode } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/i18nHelpers';
import LoadingSpinner from '../components/LoadingSpinner';
import { logger } from '../utils/logger';

const SessionInfo = () => {
  const { t } = useTranslation(['session', 'common']);
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [sessionUrl, setSessionUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sessionId) {
      loadSessionInfo();
    }
  }, [sessionId]);

  const loadSessionInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load session details and QR code in parallel
      const [sessionResponse, qrResponse] = await Promise.all([
        getSession(sessionId),
        getQRCode(sessionId)
      ]);

      setSession(sessionResponse.data);
      setQrCode(qrResponse.data.qr_code);
      setSessionUrl(qrResponse.data.session_url);
    } catch (error) {
      logger.api.error('Error loading session info:', error);
      setError(t('session:errors.loadingError'));
    } finally {
      setLoading(false);
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
    if (qrCode) {
      const link = document.createElement('a');
      link.download = `qr-session-${sessionId.slice(0, 8)}.png`;
      link.href = `data:image/png;base64,${qrCode}`;
      link.click();
    }
  };

  const goToSession = () => {
    navigate(`/session/${sessionId}`);
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text={t('session:status.loadingInfo')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-8">
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Error Loading Session</h3>
          <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={goToDashboard}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Success Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 rounded-full text-sm font-medium mb-6">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Session Created Successfully!
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 dark:from-dark-100 dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent mb-4">
            Your Photo Session is Ready
          </h1>
          
          <p className="text-gray-600 dark:text-dark-300 text-base sm:text-lg max-w-2xl mx-auto">
            {t('session:info.shareDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* QR Code Section */}
          <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 dark:border-dark-600/50 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-dark-100 mb-6 text-center">QR Code</h2>
            
            <div className="flex flex-col items-center">
              {/* QR Code Display */}
              <div className="bg-white dark:bg-dark-50 p-6 rounded-2xl shadow-lg mb-6 transform hover:scale-105 transition-transform duration-300">
                <img 
                  src={`data:image/png;base64,${qrCode}`}
                  alt="Session QR Code" 
                  className="w-48 h-48 sm:w-56 sm:h-56"
                />
              </div>

              {/* QR Code Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-800 dark:text-dark-100 font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
                
                <button
                  onClick={downloadQR}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 text-blue-800 dark:text-blue-300 font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download QR</span>
                </button>
              </div>
            </div>
          </div>

          {/* Session Details Section */}
          <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 dark:border-dark-600/50 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-dark-100 mb-6">Session Details</h2>
            
            <div className="space-y-6">
              {/* Session ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Session ID</label>
                <div className="bg-gray-50 dark:bg-dark-700 p-3 rounded-lg border border-gray-200 dark:border-dark-600">
                  <p className="text-sm text-gray-800 dark:text-dark-100 font-mono">
                    {session?.session_id}
                  </p>
                </div>
              </div>

              {/* Session URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Session Link</label>
                <div className="bg-gray-50 dark:bg-dark-700 p-3 rounded-lg border border-gray-200 dark:border-dark-600">
                  <p className="text-sm text-gray-800 dark:text-dark-100 break-all font-mono">
                    {sessionUrl}
                  </p>
                </div>
              </div>

              {/* Session Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl border border-blue-200 dark:border-blue-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Current Photos</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-300">{session?.photo_count || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-xl border border-green-200 dark:border-green-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Per-User Limit</p>
                      <p className="text-lg font-bold text-green-900 dark:text-green-300">{session?.photos_per_user_limit || 10}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Status</label>
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                  session?.is_active 
                    ? 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300' 
                    : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    session?.is_active ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  {session?.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">{t('common:dateTime.created')}</label>
                <p className="text-sm text-gray-600 dark:text-dark-300">
                  {session?.created_at ? formatDate(session.created_at) : t('common:errors.unknown')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 sm:mt-12 justify-center">
          <button
            onClick={goToSession}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>View Session</span>
          </button>
          
          <button
            onClick={goToDashboard}
            className="flex items-center justify-center space-x-2 text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-50 hover:bg-gray-100 dark:hover:bg-dark-700/50 py-4 px-8 rounded-xl border border-gray-300 dark:border-dark-600 hover:border-gray-400 dark:hover:border-dark-500 transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Go to Dashboard</span>
          </button>
        </div>

        {/* Share Instructions */}
        <div className="mt-8 sm:mt-12 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to Share
          </h3>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-300">
            <p className="flex items-start">
              <span className="font-medium mr-2">1.</span>
              Share the QR code image or session link with your guests
            </p>
            <p className="flex items-start">
              <span className="font-medium mr-2">2.</span>
              Guests can scan the QR code with their phone camera or visit the link directly
            </p>
            <p className="flex items-start">
              <span className="font-medium mr-2">3.</span>
              {t('session:info.uploadLimit', { limit: session?.photos_per_user_limit || 10 })}
            </p>
            <p className="flex items-start">
              <span className="font-medium mr-2">4.</span>
              {t('session:info.viewDescription')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionInfo;