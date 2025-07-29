import { useState, useRef, useCallback } from 'react';
import { devError } from '../utils/helpers';

export const useCamera = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        await new Promise((resolve, reject) => {
          const video = videoRef.current;
          
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = (error) => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(error);
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          video.play().catch(reject);
        });

        setIsActive(true);
        setError('');
      }
    } catch (err) {
      devError('Camera error:', err);
      setError('Camera access denied. Please allow camera permissions and ensure you are using HTTPS.');
      setIsActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setError('');
  }, []);

  const capturePhoto = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !isActive) {
        reject(new Error('Camera not ready'));
        return;
      }

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        reject(new Error('Video not ready. Please wait a moment and try again.'));
        return;
      }
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        reject(new Error('Video dimensions not available. Please restart the camera.'));
        return;
      }

      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Check if canvas has content
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let hasContent = false;
        
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 10 || data[i + 1] > 10 || data[i + 2] > 10) {
            hasContent = true;
            break;
          }
        }
        
        if (!hasContent) {
          reject(new Error('Captured image appears to be black. Please ensure camera is working and try again.'));
          return;
        }
        
        canvas.toBlob((blob) => {
          if (blob && blob.size > 1000) {
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            resolve(file);
          } else {
            reject(new Error('Failed to capture photo or photo is too small. Please try again.'));
          }
        }, 'image/jpeg', 0.9);
        
      } catch (err) {
        reject(new Error('Error capturing photo. Please try again.'));
      }
    });
  }, [isActive]);

  return {
    isActive,
    error,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto
  };
};