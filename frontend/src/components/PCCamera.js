import React, { useState, useEffect, useRef } from 'react';
import { devLog, devWarn, devError } from '../utils/helpers';

const PCCamera = ({ 
  onPhotoCapture, 
  capturedPhoto,
  onRetakePhoto,
  uploading,
  onConfirmUpload,
  isActive 
}) => {
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const startingRef = useRef(false);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    // Prevent multiple simultaneous starts
    if (startingRef.current) {
      devLog('PC Camera: Already starting, skipping...');
      return;
    }

    try {
      startingRef.current = true;
      devLog('PC Camera: Starting camera...');
      setError('');
      setCameraReady(false);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Reset video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.load(); // Reset the video element
      }

      // Simple, reliable constraints for PC
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set video properties before assigning stream
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        
        // Assign stream
        video.srcObject = stream;
        
        // Wait for video to be ready with promise-based approach
        await new Promise((resolve, reject) => {
          let resolved = false;
          
          const onReady = () => {
            if (!resolved && video.videoWidth > 0 && video.videoHeight > 0) {
              resolved = true;
              devLog('PC Camera: Video ready, dimensions:', `${video.videoWidth}x${video.videoHeight}`);
              setCameraReady(true);
              resolve();
            }
          };
          
          const onError = (error) => {
            if (!resolved) {
              resolved = true;
              reject(error);
            }
          };
          
          // Add event listeners
          video.addEventListener('loadedmetadata', onReady, { once: true });
          video.addEventListener('canplay', onReady, { once: true });
          video.addEventListener('playing', onReady, { once: true });
          video.addEventListener('error', onError, { once: true });
          
          // Try to play the video
          video.play().then(() => {
            devLog('PC Camera: Video play() succeeded');
            onReady();
          }).catch((playError) => {
            devWarn('PC Camera: Video play() failed, but continuing:', playError);
            // Don't reject here, video might still work
            setTimeout(onReady, 500); // Give it a moment
          });
          
          // Timeout fallback
          setTimeout(() => {
            if (!resolved) {
              devLog('PC Camera: Timeout waiting for video, but proceeding...');
              resolved = true;
              setCameraReady(true);
              resolve();
            }
          }, 3000);
        });
      }
      
      devLog('PC Camera: Stream started successfully');
      
    } catch (err) {
      devError('PC Camera: Error starting camera:', err);
      setError(`Camera error: ${err.message}. Please allow camera permissions.`);
      setCameraReady(false);
    } finally {
      startingRef.current = false;
    }
  };

  const stopCamera = () => {
    devLog('PC Camera: Stopping camera...');
    
    // Reset starting flag
    startingRef.current = false;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        devLog('PC Camera: Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Reset video element state
    }
    
    setCameraReady(false);
  };

  const capturePhoto = () => {
    try {
      devLog('PC Camera: Capturing photo...');
      
      if (!videoRef.current || !canvasRef.current || !cameraReady) {
        setError('Camera not ready. Please wait.');
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError('Video not ready. Please try again.');
        return;
      }
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob && blob.size > 1000) {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          devLog('PC Camera: Photo captured successfully, size:', blob.size);
          onPhotoCapture(file);
          setError('');
        } else {
          setError('Failed to capture photo. Please try again.');
        }
      }, 'image/jpeg', 0.9);
      
    } catch (err) {
      devError('PC Camera: Error capturing photo:', err);
      setError('Error capturing photo. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="relative w-full">
        <div className="relative aspect-video bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-red-200 dark:bg-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Camera Error</h3>
            <p className="text-red-700 dark:text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Camera Viewport */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 dark:from-dark-900 dark:to-dark-800 overflow-hidden w-full rounded-lg sm:rounded-xl md:rounded-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Photo Preview */}
        {capturedPhoto && (
          <div className="absolute inset-0 transition-all duration-500 ease-in-out">
            <img 
              src={URL.createObjectURL(capturedPhoto)} 
              alt="Captured" 
              className="w-full h-full object-cover"
              onLoad={(e) => {
                // Clean up object URL after image loads to prevent memory leaks
                URL.revokeObjectURL(e.target.src);
              }}
            />
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Camera Status */}
        {cameraReady && !capturedPhoto && (
          <>
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center space-x-2 bg-black/60 dark:bg-dark-900/80 backdrop-blur-sm text-white px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
              <span>PC Camera Ready</span>
            </div>
            
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/60 dark:bg-dark-900/80 backdrop-blur-sm text-white px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs">
              {videoRef.current?.videoWidth || 0}×{videoRef.current?.videoHeight || 0}
            </div>
          </>
        )}
        
        {/* Loading State */}
        {!cameraReady && !capturedPhoto && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg font-medium">Starting PC Camera...</p>
            </div>
          </div>
        )}
        
        {/* Camera Controls */}
        {cameraReady && !capturedPhoto && (
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 flex justify-center">
            <button
              onClick={capturePhoto}
              className="bg-white dark:bg-dark-100 text-gray-900 dark:text-dark-900 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-900 dark:bg-dark-800 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Photo Preview Controls */}
      {capturedPhoto && (
        <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
          <div className="text-center">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-dark-100 mb-2">Photo Preview</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-dark-300 mb-2">Review your photo before uploading</p>
            <div className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-200 rounded-full text-xs">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {(capturedPhoto.size / 1024).toFixed(1)} KB
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <button
              onClick={onRetakePhoto}
              className="flex items-center justify-center space-x-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-800 dark:text-dark-100 font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Retake Photo</span>
            </button>
            
            <button
              onClick={onConfirmUpload}
              disabled={uploading}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
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
      )}
    </div>
  );
};

export default PCCamera;