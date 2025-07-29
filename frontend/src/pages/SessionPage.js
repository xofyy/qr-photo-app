import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSession, getSessionPhotos, uploadPhoto, getMyUploadStats, downloadSessionPhotos } from '../services/api';
import { devLog, devWarn, devError } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

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
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  // Monitor when camera view becomes visible again (after upload/retake)
  useEffect(() => {
    if (cameraActive && !capturedPhoto && videoRef.current) {
      const video = videoRef.current;
      
      devLog('Camera view became visible, checking status...');
      
      // Multiple checks with increasing delays to catch various timing issues
      const checks = [100, 300, 500];
      const timeouts = [];
      
      checks.forEach((delay) => {
        const timeout = setTimeout(() => {
          if (video && video.srcObject) {
            devLog(`Check at ${delay}ms:`, {
              readyState: video.readyState,
              paused: video.paused,
              videoWidth: video.videoWidth
            });
            
            if (video.paused) {
              devLog(`Resuming video after ${delay}ms delay...`);
              video.play().catch(err => devLog('Auto-resume error:', err));
            }
          }
        }, delay);
        timeouts.push(timeout);
      });
      
      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [cameraActive, capturedPhoto]);

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

  const startCamera = async () => {
    try {
      devLog('Starting camera...');
      devLog('Video element exists:', !!videoRef.current);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      // First try with environment camera, fallback to any camera
      let stream;
      try {
        devLog('Requesting environment camera...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          } 
        });
        devLog('Environment camera obtained');
      } catch (envError) {
        devLog('Environment camera failed, trying any camera:', envError);
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          } 
        });
        devLog('Any camera obtained');
      }
      
      devLog('Stream obtained:', stream);
      devLog('Stream tracks:', stream.getTracks());
      
      if (videoRef.current && stream) {
        const video = videoRef.current;
        devLog('Setting up video element...');
        
        // Stop any existing stream
        if (video.srcObject) {
          devLog('Stopping existing stream');
          const tracks = video.srcObject.getTracks();
          tracks.forEach(track => track.stop());
        }
        
        // Reset video element
        video.srcObject = null;
        video.load();
        
        // Set properties before assigning stream
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        
        devLog('Assigning stream to video element...');
        video.srcObject = stream;
        
        // Create a promise that resolves when video starts playing
        const videoReady = new Promise((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds
          
          const checkVideo = () => {
            attempts++;
            devLog(`Attempt ${attempts}: readyState=${video.readyState}, dimensions=${video.videoWidth}x${video.videoHeight}, paused=${video.paused}`);
            
            if (video.readyState >= 1 && video.videoWidth > 0 && video.videoHeight > 0) {
              devLog('Video is ready!');
              resolve();
            } else if (attempts >= maxAttempts) {
              devLog('Video setup timeout');
              resolve(); // Resolve anyway to not block the UI
            } else {
              setTimeout(checkVideo, 100);
            }
          };
          
          // Start checking
          checkVideo();
          
          // Also listen to events
          video.addEventListener('loadedmetadata', () => {
            devLog('loadedmetadata event fired');
            resolve();
          }, { once: true });
          
          video.addEventListener('canplay', () => {
            devLog('canplay event fired');
            resolve();
          }, { once: true });
          
          video.addEventListener('error', (e) => {
            devError('Video error event:', e);
            reject(e);
          }, { once: true });
        });
        
        // Try to play the video
        try {
          devLog('Attempting to play video...');
          const playPromise = video.play();
          if (playPromise) {
            await playPromise;
            devLog('Video play() succeeded');
          }
        } catch (playError) {
          devError('Video play error:', playError);
        }
        
        // Wait for video to be ready
        await videoReady;
        
        devLog('Final video state:', {
          readyState: video.readyState,
          dimensions: `${video.videoWidth}x${video.videoHeight}`,
          paused: video.paused,
          muted: video.muted,
          playsInline: video.playsInline
        });
      }
      
      setCameraActive(true);
      setError('');
      devLog('Camera setup completed');
    } catch (err) {
      devError('Camera error:', err);
      setCameraActive(false);
      setError(`Camera error: ${err.message}. Please allow camera permissions and try refreshing the page.`);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    devLog('Attempting to capture photo...');
    
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready. Please try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    devLog('Video readyState:', video.readyState);
    devLog('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    devLog('Video playing:', !video.paused);
    
    // More lenient check - allow readyState >= 2 instead of only HAVE_ENOUGH_DATA
    if (video.readyState < 2) {
      setError('Video not ready. Please wait a moment and try again.');
      return;
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Video dimensions not available. Please restart the camera.');
      return;
    }
    
    try {
      devLog('Setting canvas dimensions...');
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      devLog('Drawing video to canvas...');
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      devLog('Checking canvas content...');
      // Check if canvas has content - sample fewer pixels for performance
      const imageData = ctx.getImageData(canvas.width/4, canvas.height/4, canvas.width/2, canvas.height/2);
      const data = imageData.data;
      let hasContent = false;
      
      // Check every 10th pixel for non-black content
      for (let i = 0; i < data.length; i += 40) {
        if (data[i] > 20 || data[i + 1] > 20 || data[i + 2] > 20) {
          hasContent = true;
          break;
        }
      }
      
      if (!hasContent) {
        devWarn('Canvas appears to be black, but proceeding anyway...');
        // Don't return error, just log warning
      }
      
      // Convert to blob with quality setting
      canvas.toBlob((blob) => {
        if (blob && blob.size > 1000) { // Ensure minimum file size
          devLog('Captured blob size:', blob.size);
          devLog('Canvas dimensions:', canvas.width, 'x', canvas.height);
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          setCapturedPhoto(file);
          setError(''); // Clear any previous errors
        } else {
          setError('Failed to capture photo or photo is too small. Please try again.');
          devError('Captured blob is too small:', blob?.size);
        }
      }, 'image/jpeg', 0.9);
      
    } catch (err) {
      devError('Error capturing photo:', err);
      setError('Error capturing photo. Please try again.');
    }
  };

  const retakePhoto = () => {
    devLog('Retaking photo...');
    setCapturedPhoto(null);
    setError('');
    
    // Force camera refresh after retake to ensure video shows
    if (cameraActive && videoRef.current) {
      const video = videoRef.current;
      devLog('Retake camera check:', {
        srcObject: !!video.srcObject,
        readyState: video.readyState,
        paused: video.paused,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
      
      // Always restart camera after retake to ensure reliable video display
      devLog('Forcing camera restart after retake for reliability...');
      const currentStream = video.srcObject;
      
      // Stop current stream
      if (currentStream) {
        const tracks = currentStream.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      // Clear video and restart
      video.srcObject = null;
      setCameraActive(false);
      
      // Restart after UI updates
      setTimeout(() => {
        startCamera();
      }, 200);
    }
  };

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
      
      // Ensure camera is still active after upload
      if (cameraActive && videoRef.current) {
        const video = videoRef.current;
        devLog('Post-upload camera check:', {
          srcObject: !!video.srcObject,
          readyState: video.readyState,
          paused: video.paused
        });
        
        // If video is paused or has no source, restart it
        if (video.paused || !video.srcObject || video.readyState === 0) {
          devLog('Camera needs restart after upload');
          setCameraActive(false);
          // Small delay to ensure UI updates, then restart camera
          setTimeout(() => {
            startCamera();
          }, 100);
        }
      }
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="mt-4">
          <button 
            onClick={loadSessionData}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Session not found
        </div>
      </div>
    );
  }

  // Use per-user limits instead of session limits
  const canTakeMorePhotos = session.is_active && userStats && userStats.can_upload;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Session Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Live Photo Session
        </div>
        
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3 sm:mb-4 px-2">
          Capture Your Moments
        </h1>
        
        <div className="flex flex-col space-y-3 sm:space-y-2 lg:flex-row lg:items-center lg:justify-center lg:space-y-0 lg:space-x-6 text-gray-600 px-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm sm:text-base font-medium">
              {userStats ? (
                <>Your photos: {userStats.upload_count} of {userStats.photos_per_user_limit}</>
              ) : (
                <>Loading your progress...</>
              )}
            </span>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm sm:text-base font-medium">Session {session.session_id.slice(0, 8)}...</span>
          </div>
          
          {userStats && (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <span className="text-sm sm:text-base font-medium">
                {userStats.remaining_uploads} remaining
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Session Status Alert */}
      {!canTakeMorePhotos && (
        <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-3 sm:px-0">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {!session.is_active ? 'Session Expired' : 'Upload Limit Reached'}
            </h3>
            <p className="text-gray-700">
              {!session.is_active 
                ? 'This session has expired and is no longer accepting photos.'
                : userStats 
                  ? `You have uploaded your maximum of ${userStats.photos_per_user_limit} photos. Thank you for sharing your moments!`
                  : 'Loading your upload status...'
              }
            </p>
            {userStats && session.is_active && (
              <div className="mt-4 text-sm text-gray-600">
                <p>Other users can still upload their photos to this session.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camera Interface */}
      {canTakeMorePhotos && (
        <div className="max-w-3xl mx-auto mb-6 sm:mb-8 px-3 sm:px-0">
          <div className="bg-white/80 backdrop-blur-md rounded-xl sm:rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
            {/* Camera Viewport */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden w-full">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${
                  cameraActive && !capturedPhoto 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-95 pointer-events-none absolute inset-0'
                }`}
              />
              
              {/* Photo Preview */}
              {capturedPhoto && (
                <div className="absolute inset-0 transition-all duration-500 ease-in-out">
                  <img 
                    src={URL.createObjectURL(capturedPhoto)} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Camera Status Indicators */}
              {cameraActive && !capturedPhoto && (
                <>
                  <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/40 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm font-medium transition-all duration-300">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>LIVE</span>
                  </div>
                  
                  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white px-3 py-2 rounded-full text-xs transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{videoRef.current?.videoWidth || 0}×{videoRef.current?.videoHeight || 0}</span>
                    </div>
                  </div>
                </>
              )}
              
              {/* Empty State */}
              {!cameraActive && !capturedPhoto && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium">Camera Ready</p>
                    <p className="text-sm">Start your camera to begin taking photos</p>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="p-4 sm:p-6">
              {capturedPhoto ? (
                <div className="animate-fade-in">
                  <div className="text-center mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Photo Preview</h3>
                    <p className="text-sm sm:text-base text-gray-600">Review your photo before uploading</p>
                    <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm mt-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {(capturedPhoto.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 justify-center">
                    <button
                      onClick={retakePhoto}
                      className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Retake Photo</span>
                    </button>
                    
                    <button
                      onClick={confirmUpload}
                      disabled={uploading}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 sm:px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100 relative overflow-hidden text-sm sm:text-base"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>Upload Photo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  {!cameraActive ? (
                    <div className="text-center">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Ready to Capture</h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Start your camera to begin taking photos for this session</p>
                      
                      <button
                        onClick={startCamera}
                        className="flex items-center justify-center space-x-2 sm:space-x-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl mx-auto text-sm sm:text-base"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Start Camera</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Camera Active</h3>
                      <p className="text-gray-600 mb-6">Frame your shot and capture the perfect moment</p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={stopCamera}
                          className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                          </svg>
                          <span>Stop Camera</span>
                        </button>
                        
                        <button
                          onClick={capturePhoto}
                          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Capture Photo</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Photos Gallery */}
      {photos.length > 0 && (
        <div className="max-w-4xl mx-auto px-3 sm:px-0">
          <div className="bg-white/80 backdrop-blur-md rounded-xl sm:rounded-3xl shadow-xl border border-gray-200/50 p-4 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-100 text-purple-800 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Photo Gallery
              </div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                Captured Memories
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded to this session
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm sm:text-base"
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
