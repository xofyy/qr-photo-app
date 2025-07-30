import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { devLog, devError } from '../utils/helpers';

const QRScannerComponent = ({ 
  isActive,
  onClose,
  onScanSuccess
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [currentCamera, setCurrentCamera] = useState(null);
  const [scanResult, setScanResult] = useState('');
  
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  // Initialize QR Scanner when component becomes active
  useEffect(() => {
    if (isActive && videoRef.current) {
      initializeScanner();
    }
    
    // Cleanup when component unmounts or becomes inactive
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [isActive]);

  const initializeScanner = async () => {
    try {
      setError('');
      setIsScanning(true);
      
      devLog('QR Scanner: Initializing...');
      
      // Check for camera permissions
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Get available cameras
      const availableCameras = await QrScanner.listCameras(true);
      setCameras(availableCameras);
      devLog('QR Scanner: Available cameras:', availableCameras);

      // Create QR Scanner instance
      const scanner = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result),
        {
          onDecodeError: (error) => {
            // Don't log every decode error as it's normal when no QR code is visible
            // devLog('QR Scanner: Decode attempt (normal)'); // Commented out to reduce noise
          },
          preferredCamera: 'environment', // Use back camera on mobile
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
          calculateScanRegion: (video) => {
            // Optimize scanning region for better performance
            const smallerDimension = Math.min(video.videoWidth, video.videoHeight);
            const scanRegionSize = Math.round(0.7 * smallerDimension);
            return {
              x: Math.round((video.videoWidth - scanRegionSize) / 2),
              y: Math.round((video.videoHeight - scanRegionSize) / 2),
              width: scanRegionSize,
              height: scanRegionSize,
            };
          },
        }
      );

      scannerRef.current = scanner;

      // Start scanning
      await scanner.start();
      setHasPermission(true);
      devLog('QR Scanner: Started successfully');
      
    } catch (err) {
      devError('QR Scanner: Error initializing:', err);
      setError(getErrorMessage(err));
      setHasPermission(false);
      setIsScanning(false);
    }
  };

  const handleScanResult = (result) => {
    try {
      devLog('QR Scanner: Scan result:', result);
      setScanResult(result);
      
      // Stop scanning
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
      setIsScanning(false);
      
      // Always try to navigate with the result - let the parent handle validation
      onScanSuccess(result);
      
    } catch (err) {
      devError('QR Scanner: Error processing result:', err);
      setError('Error processing scan result');
    }
  };

  const restartScanning = async () => {
    try {
      setError('');
      setScanResult('');
      
      if (scannerRef.current) {
        // Stop current scanner first
        await scannerRef.current.stop();
        setIsScanning(true);
        await scannerRef.current.start();
        devLog('QR Scanner: Restarted successfully');
      } else {
        // Reinitialize scanner if it doesn't exist
        await initializeScanner();
      }
    } catch (err) {
      devError('QR Scanner: Error restarting:', err);
      setError('Error restarting scanner. Please close and reopen.');
      setIsScanning(false);
    }
  };

  const switchCamera = async () => {
    if (scannerRef.current && cameras.length > 1) {
      try {
        const currentIndex = cameras.findIndex(camera => camera.id === currentCamera?.id);
        const nextIndex = (currentIndex + 1) % cameras.length;
        const nextCamera = cameras[nextIndex];
        
        await scannerRef.current.setCamera(nextCamera.id);
        setCurrentCamera(nextCamera);
        devLog('QR Scanner: Switched to camera:', nextCamera.label);
      } catch (err) {
        devError('QR Scanner: Error switching camera:', err);
      }
    }
  };

  const isValidURL = (string) => {
    try {
      const url = new URL(string);
      // Check if it's a valid HTTP/HTTPS URL and contains 'session'
      return (url.protocol === 'http:' || url.protocol === 'https:') && 
             url.pathname.includes('/session/');
    } catch (_) {
      return false;
    }
  };

  const getErrorMessage = (error) => {
    if (error.name === 'NotAllowedError') {
      return 'Camera access denied. Please allow camera permissions and try again.';
    } else if (error.name === 'NotFoundError') {
      return 'No camera found. Please check your device camera.';
    } else if (error.name === 'NotSupportedError') {
      return 'Camera not supported in this browser.';
    } else {
      return `Camera error: ${error.message}`;
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 z-50 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8">
        
        {error ? (
          /* Error State */
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md md:max-w-lg w-full text-center shadow-2xl my-2 sm:my-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Scanner Error</h3>
            <p className="text-sm sm:text-base text-red-700 mb-6 leading-relaxed">{error}</p>
            <div className="space-y-3">
              <button
                onClick={initializeScanner}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Close Scanner
              </button>
            </div>
          </div>
        ) : scanResult ? (
          /* Success State */
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md md:max-w-lg w-full text-center shadow-2xl my-2 sm:my-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">QR Code Scanned!</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">Redirecting to photo session...</p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-800 font-mono break-all">{scanResult}</p>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : (
          /* Scanner Interface */
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl w-full shadow-2xl my-2 sm:my-4">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">📱 QR Code Scanner</h2>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Point your camera at a QR code to scan it
              </p>
            </div>

            {/* Camera Viewport */}
            <div className="relative bg-black rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6" style={{ aspectRatio: '4/3' }}>
              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 border-2 border-blue-500 rounded-xl sm:rounded-2xl opacity-50"></div>
              
              {/* Corner guidelines */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
              
              {/* Status indicators */}
              {isScanning && (
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center space-x-2 bg-black/60 backdrop-blur-sm text-white px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Scanning...</span>
                </div>
              )}
              
              {cameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/60 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full hover:bg-black/80 transition-colors"
                  title="Switch Camera"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="text-blue-800 font-medium mb-1">
                    {isScanning ? 'Scanning for QR codes...' : 'How to scan:'}
                  </p>
                  {isScanning ? (
                    <p className="text-blue-700 text-xs">
                      Point your camera at any QR code. The scanner works with all QR codes, not just photo session codes.
                    </p>
                  ) : (
                    <ol className="text-blue-700 space-y-1 text-xs">
                      <li>• Position the QR code within the frame</li>
                      <li>• Keep your device steady</li>
                      <li>• Ensure good lighting</li>
                      <li>• Wait for automatic detection</li>
                    </ol>
                  )}
                </div>
              </div>
            </div>

            {/* Control buttons */}
            <div className="space-y-3">
              <button
                onClick={restartScanning}
                disabled={!isScanning}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Restart Scanner</span>
              </button>
              
              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Close Scanner
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScannerComponent;