import React, { useState, useEffect, useRef } from 'react';
import { devLog, devWarn, devError } from '../utils/helpers';

// Add custom styles for mobile camera
const cameraStyles = `
  .mobile-camera-container {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 9999 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    overflow: hidden !important;
  }
  
  .mobile-camera-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    border-radius: 3px;
    outline: none;
    background: rgba(255, 255, 255, 0.2);
  }
  
  .mobile-camera-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .mobile-camera-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .camera-safe-area-top {
    padding-top: max(1rem, env(safe-area-inset-top));
  }
  
  .camera-safe-area-bottom {
    padding-bottom: max(2rem, env(safe-area-inset-bottom));
  }
  
  /* Prevent any parent container from constraining the mobile camera */
  body.mobile-camera-active {
    overflow: hidden !important;
  }
  
  /* Ensure video fills completely */
  .mobile-camera-video {
    width: 100vw !important;
    height: 100vh !important;
    object-fit: cover !important;
    object-position: center !important;
  }
`;

const MobileCamera = ({ 
  onPhotoCapture, 
  capturedPhoto,
  onRetakePhoto,
  uploading,
  onConfirmUpload,
  isActive,
  onClose
}) => {
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const [showSettings, setShowSettings] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [resolution, setResolution] = useState('1280x720');
  const [fps, setFps] = useState(24);
  const [zoom, setZoom] = useState(1);
  const [flashMode, setFlashMode] = useState('off');
  const [gridLines, setGridLines] = useState(false);
  const [cameraCapabilities, setCameraCapabilities] = useState(null);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Available resolution options for mobile
  const resolutionOptions = [
    { label: 'HD', value: '1280x720', width: 1280, height: 720 },
    { label: 'Full HD', value: '1920x1080', width: 1920, height: 1080 },
    { label: 'QHD', value: '2560x1440', width: 2560, height: 1440 },
    { label: '4K', value: '3840x2160', width: 3840, height: 2160 },
    { label: 'Standard', value: '640x480', width: 640, height: 480 }
  ];

  // Available FPS options
  const fpsOptions = [15, 24, 30, 60];

  // Flash modes
  const flashModes = [
    { value: 'off', label: 'Off', icon: '🔦' },
    { value: 'on', label: 'On', icon: '💡' },
    { value: 'auto', label: 'Auto', icon: '⚡' }
  ];

  useEffect(() => {
    enumerateCameraDevices();
  }, []);

  useEffect(() => {
    if (isActive) {
      // Add body class to prevent scrolling and ensure full screen
      document.body.classList.add('mobile-camera-active');
      startCamera();
    } else {
      // Remove body class
      document.body.classList.remove('mobile-camera-active');
      stopCamera();
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('mobile-camera-active');
      stopCamera();
    };
  }, [isActive, facingMode, selectedDevice, resolution, fps, zoom]);

  const enumerateCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraDevices(videoDevices);
      devLog('Mobile Camera: Available cameras:', videoDevices.length);
      
      // Auto-select appropriate camera based on facing mode
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      const frontCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('front') || 
        device.label.toLowerCase().includes('user') ||
        device.label.toLowerCase().includes('selfie')
      );
      
      if (facingMode === 'environment' && backCamera) {
        setSelectedDevice(backCamera.deviceId);
      } else if (facingMode === 'user' && frontCamera) {
        setSelectedDevice(frontCamera.deviceId);
      } else if (videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
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

      // Get resolution settings
      const selectedResolution = resolutionOptions.find(r => r.value === resolution) || resolutionOptions[0];
      
      // Build constraints with user settings
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: selectedResolution.width, min: 640 },
          height: { ideal: selectedResolution.height, min: 480 },
          frameRate: { ideal: fps, min: 15 },
          aspectRatio: { ideal: selectedResolution.width / selectedResolution.height }
        }
      };
      
      // Add device ID constraint if specific device is selected
      if (selectedDevice) {
        constraints.video.deviceId = { exact: selectedDevice };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Get camera capabilities for advanced features
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.getCapabilities) {
        const capabilities = videoTrack.getCapabilities();
        setCameraCapabilities(capabilities);
        devLog('Mobile Camera: Camera capabilities:', capabilities);
        
        // Apply zoom if supported
        if (capabilities.zoom && zoom !== 1) {
          try {
            await videoTrack.applyConstraints({
              advanced: [{ zoom: zoom }]
            });
          } catch (zoomError) {
            devWarn('Mobile Camera: Zoom not supported or failed:', zoomError);
          }
        }
      }
      
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

  const applyZoom = async (newZoom) => {
    if (!streamRef.current || !cameraCapabilities?.zoom) return;
    
    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        advanced: [{ zoom: newZoom }]
      });
      setZoom(newZoom);
    } catch (error) {
      devWarn('Mobile Camera: Failed to apply zoom:', error);
    }
  };

  const simulateFlash = () => {
    if (flashMode === 'off') return;
    
    // Create flash overlay
    const flashOverlay = document.createElement('div');
    flashOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      z-index: 9999;
      pointer-events: none;
      opacity: 0.8;
    `;
    
    document.body.appendChild(flashOverlay);
    
    // Animate flash
    requestAnimationFrame(() => {
      flashOverlay.style.transition = 'opacity 0.1s ease-out';
      flashOverlay.style.opacity = '0';
      
      setTimeout(() => {
        document.body.removeChild(flashOverlay);
      }, 100);
    });
  };

  const addHapticFeedback = (intensity = 'medium') => {
    if ('vibrate' in navigator) {
      switch (intensity) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'strong':
          navigator.vibrate([50, 50, 50]);
          break;
        default:
          navigator.vibrate(25);
      }
    }
  };

  const getTouchDistance = (touches) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2 && cameraCapabilities?.zoom) {
      setIsZooming(true);
      setLastTouchDistance(getTouchDistance(e.touches));
      e.preventDefault();
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && isZooming && cameraCapabilities?.zoom) {
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / lastTouchDistance;
      
      if (scale > 1.05 || scale < 0.95) { // Threshold to prevent jittery zooming
        const newZoom = Math.max(
          cameraCapabilities.zoom.min || 1,
          Math.min(
            Math.min(cameraCapabilities.zoom.max || 3, 5),
            zoom * scale
          )
        );
        
        if (Math.abs(newZoom - zoom) > 0.1) {
          applyZoom(newZoom);
          setLastTouchDistance(currentDistance);
          addHapticFeedback('light');
        }
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (isZooming) {
      setIsZooming(false);
      setLastTouchDistance(0);
    }
  };

  const capturePhoto = () => {
    try {
      devLog('Mobile Camera: Capturing photo...');
      
      if (!videoRef.current || !canvasRef.current || !cameraReady) {
        setError('Camera not ready. Please wait.');
        return;
      }

      // Add haptic feedback for photo capture
      addHapticFeedback('strong');
      
      // Simulate flash effect
      simulateFlash();

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
      
      // Apply flash brightness if flash is on
      if (flashMode === 'on') {
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }
      
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
      <div className="mobile-camera-container fixed inset-0 bg-red-900 flex items-center justify-center z-[9999]">
        {/* Inject custom styles */}
        <style>{cameraStyles}</style>
        <div className="text-center p-6 max-w-sm mx-4">
          <div className="w-20 h-20 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-4">Camera Error</h3>
          <p className="text-red-200 text-sm mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={startCamera}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-full bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Close Camera
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-camera-container fixed inset-0 bg-black z-[9999]">
      {/* Inject custom styles */}
      <style>{cameraStyles}</style>
      
      {/* Camera Viewport - Full screen for mobile vertical */}
      <div className="relative w-full h-full overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className="mobile-camera-video w-full h-full object-cover"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        
        {/* Grid Lines Overlay */}
        {cameraReady && !capturedPhoto && gridLines && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Rule of thirds grid */}
            <div className="w-full h-full">
              {/* Vertical lines */}
              <div className="absolute left-1/3 top-0 w-px h-full bg-white/30"></div>
              <div className="absolute left-2/3 top-0 w-px h-full bg-white/30"></div>
              {/* Horizontal lines */}
              <div className="absolute top-1/3 left-0 w-full h-px bg-white/30"></div>
              <div className="absolute top-2/3 left-0 w-full h-px bg-white/30"></div>
            </div>
          </div>
        )}

        {/* Photo Preview */}
        {capturedPhoto && (
          <div className="absolute inset-0 transition-all duration-500 ease-in-out z-20">
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
        
        {/* Camera Status - Top area */}
        {cameraReady && !capturedPhoto && (
          <>
            <div className="absolute top-0 left-4 right-4 flex items-center justify-between camera-safe-area-top z-20">
              <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end space-y-2">
                  <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm">
                    {videoRef.current?.videoWidth || 0}×{videoRef.current?.videoHeight || 0}
                  </div>
                  {fps && (
                    <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                      {fps} FPS
                    </div>
                  )}
                  {zoom > 1 && (
                    <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                      {zoom.toFixed(1)}x
                    </div>
                  )}
                  {isZooming && (
                    <div className="bg-blue-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs animate-pulse">
                      Zooming...
                    </div>
                  )}
                </div>
                
                {/* Close Button */}
                {onClose && (
                  <button
                    onClick={() => {
                      addHapticFeedback('light');
                      onClose();
                    }}
                    className="bg-black/60 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-200 hover:bg-black/80 active:scale-95 touch-manipulation"
                    title="Close Camera"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Loading State */}
        {!cameraReady && !capturedPhoto && (
          <div className="absolute inset-0 flex items-center justify-center text-white z-30">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg font-medium">Starting Camera...</p>
              {cameraCapabilities?.zoom && (
                <p className="text-sm text-white/70 mt-2">Pinch to zoom when ready</p>
              )}
            </div>
          </div>
        )}
        
        {/* Mobile Camera Controls - Bottom area */}
        {cameraReady && !capturedPhoto && (
          <div className="absolute bottom-0 left-0 right-0 camera-safe-area-bottom z-30">
            {/* Main control row */}
            <div className="flex items-end justify-between px-6 pb-4">
              {/* Left side controls */}
              <div className="flex flex-col items-center space-y-4">
                <button
                  onClick={() => {
                    addHapticFeedback('light');
                    const nextFlash = flashModes[(flashModes.findIndex(m => m.value === flashMode) + 1) % flashModes.length];
                    setFlashMode(nextFlash.value);
                  }}
                  className="bg-black/60 backdrop-blur-sm text-white p-4 rounded-full transition-all duration-200 hover:bg-black/80 active:scale-95 touch-manipulation"
                  title={`Flash: ${flashModes.find(m => m.value === flashMode)?.label}`}
                >
                  <span className="text-2xl">{flashModes.find(m => m.value === flashMode)?.icon}</span>
                </button>
                
                <button
                  onClick={() => {
                    addHapticFeedback('light');
                    setShowSettings(!showSettings);
                  }}
                  className="bg-black/60 backdrop-blur-sm text-white p-4 rounded-full transition-all duration-200 hover:bg-black/80 active:scale-95 touch-manipulation"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              {/* Center capture button */}
              <button
                onClick={() => {
                  addHapticFeedback('medium');
                  capturePhoto();
                }}
                className="bg-white text-gray-900 w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation"
              >
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </button>

              {/* Right side controls */}
              <div className="flex flex-col items-center space-y-4">
                {cameraDevices.length > 1 && (
                  <button
                    onClick={() => {
                      addHapticFeedback('medium');
                      switchCamera();
                    }}
                    className="bg-black/60 backdrop-blur-sm text-white p-4 rounded-full transition-all duration-200 hover:bg-black/80 active:scale-95 touch-manipulation"
                    title="Switch Camera"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                )}
                
                {cameraCapabilities?.zoom && zoom !== 1 && (
                  <button
                    onClick={() => applyZoom(1)}
                    className="bg-black/60 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-200 hover:bg-black/80 active:scale-95 touch-manipulation"
                    title="Reset Zoom"
                  >
                    <span className="text-sm font-medium">1×</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel - Slide up from bottom */}
        {showSettings && cameraReady && !capturedPhoto && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md text-white camera-safe-area-bottom z-40 transform transition-transform duration-300">
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              <h3 className="font-semibold text-xl mb-4 flex items-center">
                ⚙️ Camera Settings
              </h3>
              
              {/* Resolution Selector */}
              <div>
                <label className="block text-sm font-medium mb-3">Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white touch-manipulation text-base"
                >
                  {resolutionOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-black text-white">
                      {option.label} ({option.width}×{option.height})
                    </option>
                  ))}
                </select>
              </div>

              {/* FPS Selector */}
              <div>
                <label className="block text-sm font-medium mb-3">Frame Rate</label>
                <select
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white touch-manipulation text-base"
                >
                  {fpsOptions.map(option => (
                    <option key={option} value={option} className="bg-black text-white">
                      {option} FPS
                    </option>
                  ))}
                </select>
              </div>

              {/* Zoom Control */}
              {cameraCapabilities?.zoom && (
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Zoom: {zoom.toFixed(1)}×
                  </label>
                  <input
                    type="range"
                    min={cameraCapabilities.zoom.min || 1}
                    max={Math.min(cameraCapabilities.zoom.max || 3, 5)}
                    step="0.1"
                    value={zoom}
                    onChange={(e) => applyZoom(parseFloat(e.target.value))}
                    className="w-full mobile-camera-slider touch-manipulation"
                  />
                </div>
              )}

              {/* Grid Lines Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Grid Lines</label>
                <input
                  type="checkbox"
                  checked={gridLines}
                  onChange={(e) => setGridLines(e.target.checked)}
                  className="w-6 h-6 text-white bg-white/20 border border-white/30 rounded"
                />
              </div>

              {/* Close Settings */}
              <button
                onClick={() => setShowSettings(false)}
                className="w-full bg-white/20 hover:bg-white/30 active:bg-white/40 py-4 rounded-lg text-base font-medium transition-all touch-manipulation"
              >
                ✓ Done
              </button>
            </div>
          </div>
        )}

        {/* Photo Preview - Full screen overlay */}
        {capturedPhoto && (
          <div className="absolute inset-0 bg-black z-50 flex flex-col">
            {/* Photo Preview */}
            <div className="flex-1 flex items-center justify-center p-4">
              <img 
                src={URL.createObjectURL(capturedPhoto)} 
                alt="Captured" 
                className="max-w-full max-h-full object-contain rounded-lg"
                onLoad={(e) => {
                  URL.revokeObjectURL(e.target.src);
                }}
              />
            </div>
            
            {/* Photo Info */}
            <div className="px-6 py-4 text-center">
              <h3 className="text-xl font-bold text-white mb-2">📸 Photo Preview</h3>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="inline-flex items-center px-3 py-2 bg-white/20 text-white rounded-full text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {(capturedPhoto.size / 1024).toFixed(1)} KB
                </div>
                {resolution && (
                  <div className="inline-flex items-center px-3 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                    📐 {resolution}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="px-6 camera-safe-area-bottom space-y-4">
              <button
                onClick={() => {
                  addHapticFeedback('medium');
                  onRetakePhoto();
                }}
                className="w-full flex items-center justify-center space-x-3 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform active:scale-95 touch-manipulation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Retake Photo</span>
              </button>
              
              <button
                onClick={() => {
                  if (!uploading) {
                    addHapticFeedback('medium');
                    onConfirmUpload();
                  }
                }}
                disabled={uploading}
                className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 disabled:active:scale-100 touch-manipulation"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
};

export default MobileCamera;