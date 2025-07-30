import React, { useState, useEffect, useRef } from 'react';
import { devLog, devWarn, devError } from '../utils/helpers';

const MobileCamera = ({ 
  onPhotoCapture, 
  capturedPhoto,
  onRetakePhoto,
  uploading,
  onConfirmUpload,
  isActive 
}) => {
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [showSettings, setShowSettings] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    enumerateCameraDevices();
  }, []);

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
  }, [isActive, facingMode]);

  const enumerateCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraDevices(videoDevices);
      devLog('Mobile Camera: Available cameras:', videoDevices.length);
    } catch (error) {
      devError('Mobile Camera: Error enumerating devices:', error);
    }
  };

  const startCamera = async () => {
    try {
      devLog('Mobile Camera: Starting camera with facing mode:', facingMode);
      setError('');
      setCameraReady(false);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Mobile-optimized constraints
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 24, min: 15 },
          aspectRatio: { ideal: 16/9 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        
        try {
          await videoRef.current.play();
          devLog('Mobile Camera: Video playing');
        } catch (playError) {
          devWarn('Mobile Camera: Video play error (may be normal):', playError);
        }
        
        // Wait for video to be ready
        const checkReady = () => {
          if (videoRef.current && videoRef.current.videoWidth > 0) {
            devLog('Mobile Camera: Video ready, dimensions:', 
                   `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
            setCameraReady(true);
          } else {
            setTimeout(checkReady, 100);
          }
        };
        
        videoRef.current.onloadedmetadata = checkReady;
        videoRef.current.oncanplay = checkReady;
        setTimeout(checkReady, 100); // Fallback check
      }
      
      devLog('Mobile Camera: Stream started successfully');
      
    } catch (err) {
      devError('Mobile Camera: Error starting camera:', err);
      setError(`Camera error: ${err.message}. Please allow camera permissions.`);
      setCameraReady(false);
    }
  };

  const stopCamera = () => {
    devLog('Mobile Camera: Stopping camera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        devLog('Mobile Camera: Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraReady(false);
  };

  const switchCamera = () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    devLog('Mobile Camera: Switching to:', newFacingMode);
    setFacingMode(newFacingMode);
  };

  const capturePhoto = () => {
    try {
      devLog('Mobile Camera: Capturing photo...');
      
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
      
      // Draw video frame to canvas with mobile optimizations
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob with mobile-optimized quality
      canvas.toBlob((blob) => {
        if (blob && blob.size > 1000) {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          devLog('Mobile Camera: Photo captured successfully, size:', blob.size);
          onPhotoCapture(file);
          setError('');
        } else {
          setError('Failed to capture photo. Please try again.');
        }
      }, 'image/jpeg', 0.85); // Slightly lower quality for mobile
      
    } catch (err) {
      devError('Mobile Camera: Error capturing photo:', err);
      setError('Error capturing photo. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="relative w-full">
        <div className="relative aspect-video bg-red-100 rounded-xl flex items-center justify-center">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-red-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-red-800 mb-2">Camera Error</h3>
            <p className="text-red-700 text-xs mb-3">{error}</p>
            <button
              onClick={startCamera}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
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
      <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden w-full rounded-xl">
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
            <div className="absolute top-3 left-3 flex items-center space-x-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1.5 rounded-full text-xs font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Mobile Ready</span>
            </div>
            
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1.5 rounded-full text-xs">
              {videoRef.current?.videoWidth || 0}×{videoRef.current?.videoHeight || 0}
            </div>
          </>
        )}
        
        {/* Loading State */}
        {!cameraReady && !capturedPhoto && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
              <p className="text-sm font-medium">Starting Mobile Camera...</p>
            </div>
          </div>
        )}
        
        {/* Mobile Camera Controls */}
        {cameraReady && !capturedPhoto && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-black/60 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-200 hover:bg-black/80 active:scale-95 touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Capture Button - Large for mobile */}
            <button
              onClick={capturePhoto}
              className="bg-white text-gray-900 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation"
            >
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </button>

            {/* Switch Camera Button */}
            {cameraDevices.length > 1 && (
              <button
                onClick={switchCamera}
                className="bg-black/60 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-200 hover:bg-black/80 active:scale-95 touch-manipulation"
                title="Switch Camera"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && cameraReady && !capturedPhoto && (
          <div className="absolute bottom-24 left-3 right-3 bg-black/80 backdrop-blur-md text-white rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm mb-2">Camera Settings</h3>
            
            {/* Facing Mode */}
            <div>
              <label className="block text-xs font-medium mb-2">Camera Direction</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFacingMode('environment')}
                  className={`px-3 py-2 rounded-lg text-sm transition-all touch-manipulation ${
                    facingMode === 'environment'
                      ? 'bg-white text-black'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  Back Camera
                </button>
                <button
                  onClick={() => setFacingMode('user')}
                  className={`px-3 py-2 rounded-lg text-sm transition-all touch-manipulation ${
                    facingMode === 'user'
                      ? 'bg-white text-black'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  Front Camera
                </button>
              </div>
            </div>

            {/* Close Settings */}
            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-white/20 hover:bg-white/30 active:bg-white/40 py-2 rounded-lg text-sm transition-all touch-manipulation"
            >
              Close Settings
            </button>
          </div>
        )}
      </div>

      {/* Photo Preview Controls */}
      {capturedPhoto && (
        <div className="mt-4 space-y-3">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Photo Preview</h3>
            <p className="text-sm text-gray-600 mb-2">Review your photo before uploading</p>
            <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {(capturedPhoto.size / 1024).toFixed(1)} KB
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={onRetakePhoto}
              className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform active:scale-95 touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Retake Photo</span>
            </button>
            
            <button
              onClick={onConfirmUpload}
              disabled={uploading}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 disabled:active:scale-100 touch-manipulation"
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

export default MobileCamera;