import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSession, getSessionPhotos, getAllSessionPhotos, uploadPhoto, getMyUploadStats, downloadSessionPhotos, deletePhoto } from '../services/api';
import { devLog, devWarn, devError } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';
import { formatDateOnly } from '../utils/i18nHelpers';
import Layout from '../components/Layout';
import PCCamera from '../components/PCCamera';
import MobileCamera from '../components/MobileCamera';
import NotificationToast from '../components/NotificationToast';
import ConnectionStatus from '../components/ConnectionStatus';
import useWebSocketWithFallback from '../hooks/useWebSocketWithFallback';

const SessionPage = () => {
  const { t } = useTranslation(['session', 'common']);
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userStats, setUserStats] = useState(null);
  
  // WebSocket with fallback for real-time notifications (only for session owners)
  const { isConnected, connectionType, isPollingActive } = useWebSocketWithFallback(sessionId);
  
  // Device detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  // Enhanced camera component handles all camera monitoring internally

  const loadUserStats = async () => {
    try {
      const statsResponse = await getMyUploadStats(sessionId);
      devLog('User stats:', statsResponse.data);
      setUserStats(statsResponse.data);
    } catch (err) {
      devError('Error loading user stats:', err);
      // Don't set error state here, just log it - user stats are not critical
    }
  };

  const loadSessionData = async () => {
    try {
      devLog('Loading session data for:', sessionId);
      const sessionResponse = await getSession(sessionId);
      
      // Check if current user is the session owner
      const isOwner = user && sessionResponse.data.owner_id === user.user_id;
      
      // For now, load regular photos for everyone until we fix owner authentication
      // TODO: Fix owner authentication and enable getAllSessionPhotos
      const photosResponse = await getSessionPhotos(sessionId);
      devLog('Loaded photos:', photosResponse.data);
      
      devLog('Session:', sessionResponse.data);
      devLog('Photos:', photosResponse.data);
      
      setSession(sessionResponse.data);
      setPhotos(photosResponse.data);
      
      // Load user stats
      await loadUserStats();
    } catch (err) {
      devError('Error loading session:', err);
      setError(t('session:errors.loadingError') + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Enhanced camera handles all camera operations

  const confirmUpload = async () => {
    if (!capturedPhoto || !session) {
      setError(t('session:errors.noPhotoData'));
      return;
    }
    
    // Validate file size
    if (capturedPhoto.size === 0) {
      setError(t('session:errors.emptyPhoto'));
      return;
    }
    
    if (capturedPhoto.size < 100) { // Less than 100 bytes is likely corrupted
      setError(t('session:errors.corruptedPhoto'));
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      devLog('Uploading photo for session:', sessionId);
      devLog('File details - Name:', capturedPhoto.name, 'Size:', capturedPhoto.size, 'Type:', capturedPhoto.type);
      
      const response = await uploadPhoto(sessionId, capturedPhoto);
      devLog('Upload response:', response);
      setCapturedPhoto(null);
      await loadSessionData(); // Refresh photos with proper owner/user logic
      await loadUserStats(); // Refresh user stats
    } catch (err) {
      devError('Upload error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to upload photo';
      setError(t('session:errors.uploadError') + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadPhotos = async () => {
    try {
      const response = await downloadSessionPhotos(sessionId);
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename
      const photoCount = photos.length;
      const filename = photoCount > 0 
        ? `session_${sessionId.substring(0, 8)}_photos_${photoCount}_items.zip`
        : `session_${sessionId.substring(0, 8)}_photos_empty.zip`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      devLog(`Downloaded ${photoCount} photos successfully!`);
    } catch (error) {
      devError('Error downloading photos:', error);
      if (error.response?.status === 403) {
        setError(t('session:errors.downloadUnauthorized'));
      } else {
        setError(t('session:errors.downloadFailed'));
      }
    }
  };

  const handleDeletePhoto = async (photoId, photoIndex) => {
    if (!window.confirm(t('session:actions.confirmDelete'))) {
      return;
    }

    try {
      devLog('Deleting photo:', photoId);
      await deletePhoto(sessionId, photoId);
      
      // Remove photo from local state
      setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
      
      // Refresh session data to update photo count
      await loadSessionData();
      
      devLog('Photo deleted successfully');
    } catch (error) {
      devError('Error deleting photo:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete photo';
      alert(t('session:errors.deleteFailed') + errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-dark-300 font-medium">{t('session:status.loadingInfo')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-2 sm:px-4 py-8">
        <div className="max-w-md sm:max-w-lg md:max-w-xl w-full">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl dark:shadow-dark-900/50 p-6 sm:p-8 text-center border border-gray-200 dark:border-dark-600">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-dark-100 mb-4">{t('session:errors.title')}</h3>
            <div className="bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6 text-sm sm:text-base">
              {error}
            </div>
            <button 
              onClick={loadSessionData}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-semibold py-3 sm:py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('common:buttons.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-2 sm:px-4 py-8">
        <div className="max-w-md sm:max-w-lg md:max-w-xl w-full">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl dark:shadow-dark-900/50 p-6 sm:p-8 text-center border border-gray-200 dark:border-dark-600">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-dark-100 mb-4">{t('session:errors.sessionNotFound')}</h3>
            <div className="bg-yellow-50 dark:bg-yellow-500/20 border border-yellow-200 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-xl mb-6 text-sm sm:text-base">
              {t('session:errors.sessionNotFoundDescription')}
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 dark:from-gray-500 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white font-semibold py-3 sm:py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {t('common:navigation.home')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use per-user limits instead of session limits
  const canTakeMorePhotos = session.is_active && userStats && userStats.can_upload;

  return (
    <Layout>
      {/* Mobile Camera - render outside constrained container for full screen */}
      {isMobile && (
        <MobileCamera
          isActive={cameraActive}
          capturedPhoto={capturedPhoto}
          uploading={uploading}
          onPhotoCapture={(photo) => {
            setCapturedPhoto(photo);
            setError('');
          }}
          onRetakePhoto={() => {
            setCapturedPhoto(null);
            setError('');
          }}
          onConfirmUpload={confirmUpload}
          onClose={() => setCameraActive(false)}
        />
      )}
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6 lg:py-8">
      {/* Session Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3 sm:mb-4">
          <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 rounded-full text-xs sm:text-sm font-medium">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t('session:liveSession')}
          </div>
          
          {user && (
            <ConnectionStatus 
              isConnected={isConnected}
              connectionType={connectionType}
              isPollingActive={isPollingActive}
            />
          )}
        </div>
        
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 dark:from-dark-100 dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent mb-2 sm:mb-3 md:mb-4 px-2">
          {t('session:captureYourMoments')}
        </h1>
        
        <div className="flex flex-col space-y-2 sm:space-y-3 md:flex-row md:items-center md:justify-center md:space-y-0 md:space-x-4 lg:space-x-6 xl:space-x-8 text-gray-600 dark:text-dark-300 px-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm md:text-base font-medium">
              {userStats ? (
                <>{t('session:userStats.yourPhotos')}{userStats.upload_count}{t('session:userStats.of')}{userStats.photos_per_user_limit}</>
              ) : (
                <>{t('session:status.loadingProgress')}</>
              )}
            </span>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm md:text-base font-medium">{t('session:sessionInfo.session')}{session.session_id.slice(0, 8)}...</span>
          </div>
          
          {userStats && (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm md:text-base font-medium">
                {userStats.remaining_uploads}{t('session:userStats.remaining')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Session Status Alert */}
      {!canTakeMorePhotos && (
        <div className="max-w-4xl mx-auto mb-4 sm:mb-6 md:mb-8 px-2 sm:px-4 md:px-6 lg:px-0">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-500/10 dark:to-orange-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-yellow-100 dark:bg-yellow-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-dark-100 mb-2 sm:mb-3">
              {!session.is_active ? t('session:status.expired') : t('session:status.limitReached')}
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-dark-300">
              {!session.is_active 
                ? t('session:status.expiredDescription')
                : userStats 
                  ? t('session:status.limitDescription', { limit: userStats.photos_per_user_limit })
                  : t('session:status.loadingUploadStatus')
              }
            </p>
            {userStats && session.is_active && (
              <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 dark:text-dark-400">
                <p>{t('session:status.othersCanUpload')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Camera Interface */}
      {canTakeMorePhotos && (
        <div className="max-w-4xl mx-auto mb-4 sm:mb-6 md:mb-8 px-2 sm:px-4 md:px-6 lg:px-0">
          <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl dark:shadow-dark-900/50 border border-gray-200/50 dark:border-dark-600/50 overflow-hidden p-3 sm:p-4 md:p-6">
            {!cameraActive ? (
              <div className="text-center py-4 sm:py-6 md:py-8">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-dark-100 mb-2">
                  {isMobile ? t('session:camera.mobile') : t('session:camera.pc')}
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-dark-300 mb-4 sm:mb-6">
                  {isMobile 
                    ? t('session:camera.mobileDescription')
                    : t('session:camera.pcDescription')
                  }
                </p>
                
                <button
                  onClick={() => setCameraActive(true)}
                  className="flex items-center justify-center space-x-2 sm:space-x-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-bold py-2.5 sm:py-3 md:py-4 px-4 sm:px-6 md:px-8 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl mx-auto text-xs sm:text-sm md:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{t('session:camera.startCamera', { type: isMobile ? t('session:camera.mobile') : t('session:camera.pc') })}</span>
                </button>
              </div>
            ) : (
              <>
                {!isMobile && (
                  <PCCamera
                    isActive={cameraActive}
                    capturedPhoto={capturedPhoto}
                    uploading={uploading}
                    onPhotoCapture={(photo) => {
                      setCapturedPhoto(photo);
                      setError('');
                    }}
                    onRetakePhoto={() => {
                      setCapturedPhoto(null);
                      setError('');
                    }}
                    onConfirmUpload={confirmUpload}
                  />
                )}
              </>
            )}
            
            {cameraActive && !capturedPhoto && (
              <div className="mt-3 sm:mt-4 text-center">
                <button
                  onClick={() => setCameraActive(false)}
                  className="flex items-center justify-center space-x-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-800 dark:text-dark-100 font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-200 mx-auto text-xs sm:text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  <span>{t('session:camera.stopCamera')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Photos Gallery */}
      {photos.length > 0 && (
        <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-0">
          <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl dark:shadow-dark-900/50 border border-gray-200/50 dark:border-dark-600/50 p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('session:photoGallery')}
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-dark-100 dark:to-dark-300 bg-clip-text text-transparent mb-2">
                {t('session:capturedMemories')}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-dark-300">
                {user && session?.owner_id === user.user_id 
                  ? `${photos.length} photo${photos.length !== 1 ? 's' : ''} from all users in this session`
                  : `${photos.length} photo${photos.length !== 1 ? 's' : ''} you uploaded to this session`
                }
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {photos.map((photo, index) => (
                <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg sm:rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-600 dark:to-dark-700 shadow-lg hover:shadow-xl dark:shadow-dark-900/50 transition-all duration-300 transform hover:scale-105">
                  <img 
                    src={photo.url} 
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-2 sm:p-4">
                    <div className="text-white">
                      <p className="text-xs sm:text-sm font-medium">{t('session:gallery.photo')}{index + 1}</p>
                      <p className="text-xs opacity-90 hidden sm:block">
                        {formatDateOnly(photo.uploaded_at || Date.now())}
                      </p>
                      {/* Show uploader info for session owners */}
                      {user && session?.owner_id === user.user_id && photo.user_identifier && (
                        <p className="text-xs opacity-80 text-blue-200 hidden sm:block">
                          {t('session:gallery.by')}{photo.user_identifier}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(photo.url, '_blank')}
                        className="bg-white/20 dark:bg-dark-900/40 backdrop-blur-sm text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-white/30 dark:hover:bg-dark-900/60 transition-all duration-200 transform hover:scale-110"
                        title={t('session:actions.viewFullSize')}
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photo.id, index);
                        }}
                        className="bg-red-500/20 dark:bg-red-500/30 backdrop-blur-sm text-red-200 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-red-500/40 dark:hover:bg-red-500/50 transition-all duration-200 transform hover:scale-110"
                        title={t('session:actions.deletePhoto')}
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Loading shimmer effect for images that haven't loaded yet */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                </div>
              ))}
            </div>
            
            {/* Gallery Stats */}
            <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-dark-600/50">
              <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 dark:text-dark-300 mb-4">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{photos.length}{t('session:gallery.photosStored')}</span>
                  </span>
                  
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>{t('session:gallery.cloudSynchronized')}</span>
                  </span>
                </div>
                
                <div className="text-xs opacity-75 dark:opacity-60">
                  {t('session:gallery.clickToView')}
                </div>
              </div>
              
              {/* Download Button for Session Owners */}
              {user && session?.owner_id === user.user_id && photos.length > 0 && (
                <div className="text-center">
                  <button
                    onClick={handleDownloadPhotos}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-purple-500 dark:to-indigo-500 dark:hover:from-purple-600 dark:hover:to-indigo-600 text-white font-semibold py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 md:px-6 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-xs sm:text-sm md:text-base"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">{t('session:actions.downloadAll', { count: photos.length })}</span>
                    <span className="sm:hidden">{t('session:actions.downloadShort', { count: photos.length })}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default SessionPage;
