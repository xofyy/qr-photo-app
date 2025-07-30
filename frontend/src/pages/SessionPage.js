import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSession, getSessionPhotos, uploadPhoto, getMyUploadStats, downloadSessionPhotos } from '../services/api';
import { devLog, devWarn, devError } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import PCCamera from '../components/PCCamera';
import MobileCamera from '../components/MobileCamera';

const SessionPage = () => {
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
      const photosResponse = await getSessionPhotos(sessionId);
      
      devLog('Session ', sessionResponse.data);
      devLog('Photos ', photosResponse.data);
      
      setSession(sessionResponse.data);
      setPhotos(photosResponse.data);
      
      // Load user stats
      await loadUserStats();
    } catch (err) {
      devError('Error loading session ', err);
      setError('Failed to load session: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Enhanced camera handles all camera operations

  const confirmUpload = async () => {
    if (!capturedPhoto || !session) {
      setError('No photo or session data available');
      return;
    }
    
    // Validate file size
    if (capturedPhoto.size === 0) {
      setError('Photo file is empty. Please retake the photo.');
      return;
    }
    
    if (capturedPhoto.size < 100) { // Less than 100 bytes is likely corrupted
      setError('Photo file appears to be corrupted. Please retake the photo.');
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
      await loadSessionData(); // Refresh photos
      await loadUserStats(); // Refresh user stats
    } catch (err) {
      devError('Upload error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to upload photo';
      setError('Upload failed: ' + errorMessage);
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
        setError('You can only download photos from your own sessions.');
      } else {
        setError('Failed to download photos. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-2 sm:px-4 py-8">
        <div className="max-w-md sm:max-w-lg md:max-w-xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Session Error</h3>
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm sm:text-base">
              {error}
            </div>
            <button 
              onClick={loadSessionData}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 sm:py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
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
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Session Not Found</h3>
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl mb-6 text-sm sm:text-base">
              The session you're looking for doesn't exist or has been removed.
            </div>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 sm:py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go Home
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
        <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Live Photo Session
        </div>
        
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2 sm:mb-3 md:mb-4 px-2">
          Capture Your Moments
        </h1>
        
        <div className="flex flex-col space-y-2 sm:space-y-3 md:flex-row md:items-center md:justify-center md:space-y-0 md:space-x-4 lg:space-x-6 xl:space-x-8 text-gray-600 px-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm md:text-base font-medium">
              {userStats ? (
                <>Your photos: {userStats.upload_count} of {userStats.photos_per_user_limit}</>
              ) : (
                <>Loading your progress...</>
              )}
            </span>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs sm:text-sm md:text-base font-medium">Session {session.session_id.slice(0, 8)}...</span>
          </div>
          
          {userStats && (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <span className="text-xs sm:text-sm md:text-base font-medium">
                {userStats.remaining_uploads} remaining
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Session Status Alert */}
      {!canTakeMorePhotos && (
        <div className="max-w-4xl mx-auto mb-4 sm:mb-6 md:mb-8 px-2 sm:px-4 md:px-6 lg:px-0">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-yellow-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
              {!session.is_active ? 'Session Expired' : 'Upload Limit Reached'}
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-700">
              {!session.is_active 
                ? 'This session has expired and is no longer accepting photos.'
                : userStats 
                  ? `You have uploaded your maximum of ${userStats.photos_per_user_limit} photos. Thank you for sharing your moments!`
                  : 'Loading your upload status...'
              }
            </p>
            {userStats && session.is_active && (
              <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
                <p>Other users can still upload their photos to this session.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Camera Interface */}
      {canTakeMorePhotos && (
        <div className="max-w-4xl mx-auto mb-4 sm:mb-6 md:mb-8 px-2 sm:px-4 md:px-6 lg:px-0">
          <div className="bg-white/80 backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden p-3 sm:p-4 md:p-6">
            {!cameraActive ? (
              <div className="text-center py-4 sm:py-6 md:py-8">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2">
                  {isMobile ? 'Mobile Camera' : 'PC Camera'}
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4 sm:mb-6">
                  {isMobile 
                    ? 'Touch-optimized camera with front/back switching'
                    : 'Simple and reliable camera for desktop'
                  }
                </p>
                
                <button
                  onClick={() => setCameraActive(true)}
                  className="flex items-center justify-center space-x-2 sm:space-x-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2.5 sm:py-3 md:py-4 px-4 sm:px-6 md:px-8 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl mx-auto text-xs sm:text-sm md:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Start {isMobile ? 'Mobile' : 'PC'} Camera</span>
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
                  className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-200 mx-auto text-xs sm:text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  <span>Stop Camera</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Photos Gallery */}
      {photos.length > 0 && (
        <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-0">
          <div className="bg-white/80 backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl border border-gray-200/50 p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-100 text-purple-800 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Photo Gallery
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                Captured Memories
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">
                {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded to this session
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {photos.map((photo, index) => (
                <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg sm:rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <img 
                    src={photo.url} 
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-2 sm:p-4">
                    <div className="text-white">
                      <p className="text-xs sm:text-sm font-medium">Photo {index + 1}</p>
                      <p className="text-xs opacity-90 hidden sm:block">
                        {new Date(photo.uploaded_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => window.open(photo.url, '_blank')}
                      className="bg-white/20 backdrop-blur-sm text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-white/30 transition-all duration-200 transform hover:scale-110"
                      title="View full size"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Loading shimmer effect for images that haven't loaded yet */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                </div>
              ))}
            </div>
            
            {/* Gallery Stats */}
            <div className="mt-8 pt-6 border-t border-gray-200/50">
              <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{photos.length} photos stored</span>
                  </span>
                  
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Cloud synchronized</span>
                  </span>
                </div>
                
                <div className="text-xs opacity-75">
                  Click any photo to view full size
                </div>
              </div>
              
              {/* Download Button for Session Owners */}
              {user && session?.owner_id === user.user_id && photos.length > 0 && (
                <div className="text-center">
                  <button
                    onClick={handleDownloadPhotos}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 md:px-6 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-xs sm:text-sm md:text-base"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Download All Photos ({photos.length})</span>
                    <span className="sm:hidden">Download ({photos.length})</span>
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
