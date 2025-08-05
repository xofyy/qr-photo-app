import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { devLog, devError } from '../utils/logger';
import { formatFileSize } from '../utils/i18nHelpers';

const MobileCamera = ({ 
  onPhotoCapture, 
  capturedPhoto,
  onRetakePhoto,
  uploading,
  onConfirmUpload,
  isActive,
  onClose
}) => {
  const { t } = useTranslation(['camera', 'common']);
  const [error, setError] = useState('');
  const [showWaiting, setShowWaiting] = useState(false);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setShowWaiting(false); // Hide waiting state when file is selected
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(t('camera:errors.selectImageFile'));
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(t('camera:errors.imageTooLarge'));
        return;
      }

      devLog('Native Camera: Photo selected, size:', file.size);
      onPhotoCapture(file);
      setError('');
    }
  };

  const openNativeCamera = () => {
    setShowWaiting(true);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const openGallery = () => {
    setShowWaiting(true);
    setError('');
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  if (!isActive) {
    return null;
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/90 dark:bg-dark-900/95 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md md:max-w-lg w-full text-center shadow-2xl my-2 sm:my-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-50 mb-2">{t('camera:errors.title')}</h3>
          <p className="text-gray-600 dark:text-dark-300 text-sm mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => setError('')}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors font-medium"
            >
              {t('common:buttons.tryAgain')}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-800 dark:text-dark-200 px-6 py-3 rounded-xl transition-colors font-medium"
              >
                {t('common:buttons.close')}
              </button>
            )}
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-dark-900 dark:to-dark-800 z-50 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="gallery-input"
      />

      {!capturedPhoto ? (
        showWaiting ? (
          /* Waiting for Camera/Gallery */
          <div className="bg-white dark:bg-dark-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl w-full text-center shadow-2xl my-2 sm:my-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-dark-50 mb-2 sm:mb-3">📱 {t('camera:opening.title')}</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-dark-300 mb-4 sm:mb-6 leading-relaxed">
              {t('camera:opening.description')}
            </p>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="text-green-800 dark:text-green-300 font-medium">{t('camera:opening.active')}</p>
                  <p className="text-green-700 dark:text-green-400 text-xs mt-1">{t('camera:opening.instructions')}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowWaiting(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-800 dark:text-dark-200 font-medium py-3 px-6 rounded-xl transition-colors"
              >
                {t('camera:ui.goBack')}
              </button>
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-full bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-300 font-medium py-2 px-6 rounded-xl transition-colors"
                >
                  {t('camera:ui.cancel')}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Camera Interface */
          <div className="bg-white dark:bg-dark-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl w-full text-center shadow-2xl my-2 sm:my-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-dark-50 mb-2 sm:mb-3">📱 {t('camera:takePhoto.title')}</h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-dark-300 mb-4 sm:mb-6 leading-relaxed">
            {t('camera:takePhoto.description')}
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm">
                <p className="text-blue-800 dark:text-blue-300 font-medium mb-1">{t('camera:howItWorks.title')}</p>
                <ol className="text-blue-700 dark:text-blue-400 space-y-1 text-xs">
                  <li>{t('camera:howItWorks.steps.step1')}</li>
                  <li>{t('camera:howItWorks.steps.step2')}</li>
                  <li>{t('camera:howItWorks.steps.step3')}</li>
                  <li>{t('camera:howItWorks.steps.step4')}</li>
                  <li>{t('camera:howItWorks.steps.step5')}</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={openNativeCamera}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 text-white font-semibold py-3 sm:py-4 md:py-5 px-4 sm:px-6 md:px-8 rounded-xl sm:rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 sm:space-x-3 text-sm sm:text-base md:text-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{t('camera:actions.takeNewPhoto')}</span>
            </button>
            
            <div className="text-sm text-gray-500 dark:text-dark-400 text-center my-3">{t('camera:ui.or')}</div>
            
            <button
              onClick={openGallery}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-600 dark:to-pink-600 dark:hover:from-purple-700 dark:hover:to-pink-700 text-white font-semibold py-2.5 sm:py-3 md:py-4 px-4 sm:px-6 md:px-8 rounded-xl sm:rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 sm:space-x-3 text-sm sm:text-base md:text-lg"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{t('camera:actions.chooseFromGallery')}</span>
            </button>
            
            <div className="text-xs text-gray-500 dark:text-dark-400 space-y-1">
              <p>{t('camera:ui.features.cameraFeatures')}</p>
              <p>{t('camera:ui.features.portraitMode')}</p>
              <p>{t('camera:ui.features.professionalQuality')}</p>
            </div>
            
            {onClose && (
              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-800 dark:text-dark-200 font-medium py-3 px-6 rounded-xl transition-colors"
              >
                {t('camera:ui.cancel')}
              </button>
            )}
          </div>
        </div>
        )
      ) : (
        /* Photo Preview */
        <div className="bg-white dark:bg-dark-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl w-full shadow-2xl my-2 sm:my-4">
          <div className="text-center mb-4">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-dark-50 mb-2">📸 {t('camera:preview.title')}</h3>
          </div>
          
          {/* Photo Display */}
          <div className="relative mb-4 sm:mb-6 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 dark:bg-dark-700">
            <img 
              src={URL.createObjectURL(capturedPhoto)} 
              alt="Captured" 
              className="w-full max-h-64 sm:max-h-80 md:max-h-96 object-contain"
              onLoad={(e) => {
                URL.revokeObjectURL(e.target.src);
              }}
            />
          </div>
          
          {/* Photo Info */}
          <div className="flex items-center justify-center space-x-4 mb-6 text-sm">
            <div className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-dark-300 rounded-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {formatFileSize(capturedPhoto.size, t)}
            </div>
            <div className="inline-flex items-center px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('camera:preview.ready')}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                onRetakePhoto();
                // Reset file inputs
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
                if (galleryInputRef.current) {
                  galleryInputRef.current.value = '';
                }
              }}
              className="w-full flex items-center justify-center space-x-3 bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-800 dark:text-dark-200 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{t('camera:actions.takeAnotherPhoto')}</span>
            </button>
            
            <button
              onClick={onConfirmUpload}
              disabled={uploading}
              className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-600 dark:to-emerald-600 dark:hover:from-green-700 dark:hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t('camera:status.uploading')}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{t('camera:actions.uploadPhoto')}</span>
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