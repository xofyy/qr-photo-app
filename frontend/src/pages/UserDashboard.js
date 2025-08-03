import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createSession, getQRCode, getUserSessions, updateSessionPhotoLimit, getSessionUserStats, downloadSessionPhotos } from '../services/api';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import useDashboardWebSocket from '../hooks/useDashboardWebSocket';

const UserDashboard = () => {
  const [userSessions, setUserSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [photoLimitModal, setPhotoLimitModal] = useState({ show: false, session: null, newLimit: 10 });
  const [qrModal, setQrModal] = useState({ show: false, session: null, qrCode: null, sessionUrl: null, loading: false });
  const [sessionStats, setSessionStats] = useState({});
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  
  // WebSocket connections for real-time notifications
  const { connectedSessions } = useDashboardWebSocket(userSessions);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

  useEffect(() => {
    if (user) {
      loadUserSessions();
    }
  }, [user]);

  const loadUserSessions = async () => {
    try {
      const response = await getUserSessions();
      const sessions = response.data;
      setUserSessions(sessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      console.error('Error loading user sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    try {
      const response = await createSession();
      const newSession = response.data;
      
      // Refresh the sessions list
      await loadUserSessions();
      
      // Navigate to session info page to show QR code and details
      navigate(`/session-info/${newSession.session_id}`);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const openPhotoLimitModal = (session) => {
    setPhotoLimitModal({
      show: true,
      session: session,
      newLimit: session.photos_per_user_limit || 10
    });
  };

  const closePhotoLimitModal = () => {
    setPhotoLimitModal({ show: false, session: null, newLimit: 10 });
  };

  const handleUpdatePhotoLimit = async () => {
    try {
      await updateSessionPhotoLimit(photoLimitModal.session.session_id, photoLimitModal.newLimit);
      
      // Update the session in the local state
      setUserSessions(sessions => 
        sessions.map(session => 
          session.session_id === photoLimitModal.session.session_id 
            ? { ...session, photos_per_user_limit: photoLimitModal.newLimit }
            : session
        )
      );
      
      closePhotoLimitModal();
      alert(`Photo limit updated to ${photoLimitModal.newLimit} photos per user`);
    } catch (error) {
      console.error('Error updating photo limit:', error);
      alert('Failed to update photo limit. Please try again.');
    }
  };

  const loadSessionStats = async (sessionId) => {
    try {
      const response = await getSessionUserStats(sessionId);
      setSessionStats(prev => ({
        ...prev,
        [sessionId]: response.data
      }));
    } catch (error) {
      console.error('Error loading session stats:', error);
    }
  };

  const handleDownloadPhotos = async (session) => {
    try {
      // Show loading state
      const sessionId = session.session_id;
      
      // Call download API
      const response = await downloadSessionPhotos(sessionId);
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename
      const photoCount = session.photo_count || 0;
      const filename = photoCount > 0 
        ? `session_${sessionId.substring(0, 8)}_photos_${photoCount}_items.zip`
        : `session_${sessionId.substring(0, 8)}_photos_empty.zip`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      alert(`Downloaded ${photoCount} photos successfully!`);
    } catch (error) {
      console.error('Error downloading photos:', error);
      if (error.response?.status === 403) {
        alert('You can only download photos from your own sessions.');
      } else {
        alert('Failed to download photos. Please try again.');
      }
    }
  };

  const openQrModal = async (session) => {
    setQrModal({
      show: true,
      session: session,
      qrCode: null,
      sessionUrl: null,
      loading: true
    });

    try {
      const response = await getQRCode(session.session_id);
      setQrModal(prev => ({
        ...prev,
        qrCode: response.data.qr_code,
        sessionUrl: response.data.session_url,
        loading: false
      }));
    } catch (error) {
      console.error('Error loading QR code:', error);
      setQrModal(prev => ({
        ...prev,
        loading: false
      }));
      alert('Failed to load QR code. Please try again.');
    }
  };

  const closeQrModal = () => {
    setQrModal({ show: false, session: null, qrCode: null, sessionUrl: null, loading: false });
  };

  const downloadQR = () => {
    if (qrModal.qrCode && qrModal.session) {
      const link = document.createElement('a');
      link.download = `qr-session-${qrModal.session.session_id.slice(0, 8)}.png`;
      link.href = `data:image/png;base64,${qrModal.qrCode}`;
      link.click();
    }
  };

  const copySessionLink = async () => {
    if (qrModal.sessionUrl) {
      try {
        await navigator.clipboard.writeText(qrModal.sessionUrl);
        alert('Session link copied to clipboard!');
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = qrModal.sessionUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Session link copied to clipboard!');
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" text="Loading your dashboard..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {user?.avatar_url && (
                <img 
                  src={user.avatar_url} 
                  alt={user.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-200 dark:border-dark-600 flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-dark-50 dark:to-dark-300 bg-clip-text text-transparent truncate">
                  Welcome back, {user?.name}!
                </h1>
                {connectedSessions.size > 0 && (
                  <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1">
                    🔔 Live notifications active for {connectedSessions.size} session{connectedSessions.size !== 1 ? 's' : ''}
                  </p>
                )}
                <p className="text-sm sm:text-base text-gray-600 dark:text-dark-300 mt-1">Manage your photo sessions and QR codes</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleCreateSession}
                disabled={isCreatingSession}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-bold py-3 px-4 sm:px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isCreatingSession ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New Session</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center justify-center space-x-2 text-gray-600 dark:text-dark-300 hover:text-gray-900 dark:hover:text-dark-50 hover:bg-gray-100 dark:hover:bg-dark-700/50 py-2 px-3 sm:px-4 rounded-lg transition-all duration-200 text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-dark-50 mb-4 sm:mb-6">Your Photo Sessions</h2>
          
          {userSessions.length === 0 ? (
            <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 dark:border-dark-700/50 p-6 sm:p-8 lg:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 dark:bg-blue-500/20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 616 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-dark-50 mb-3 sm:mb-4">No sessions yet</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-dark-300 mb-6 sm:mb-8 px-2">Create your first photo session to start collecting memories from your events.</p>
              <button
                onClick={handleCreateSession}
                disabled={isCreatingSession}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isCreatingSession ? 'Creating...' : 'Create Your First Session'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {userSessions.map((session) => (
                <div 
                  key={session.session_id} 
                  className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50 dark:border-dark-700/50 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-dark-50 text-sm sm:text-base truncate">
                          Session {session.session_id.substring(0, 8)}...
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-400">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      session.is_active 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {session.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4 sm:mb-6">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 dark:text-dark-300">Total photos:</span>
                      <span className="font-medium text-gray-900 dark:text-dark-50">{session.photo_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 dark:text-dark-300">Per-user limit:</span>
                      <span className="font-medium text-gray-900 dark:text-dark-50">{session.photos_per_user_limit || 10} photos</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((session.photo_count / (session.photos_per_user_limit || 10)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => navigate(`/session/${session.session_id}`)}
                        className="flex-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs sm:text-sm font-medium py-2 px-2 sm:px-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        View Session
                      </button>
                      
                      <button
                        onClick={() => openQrModal(session)}
                        className="flex-1 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs sm:text-sm font-medium py-2 px-2 sm:px-3 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-1"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                        </svg>
                        <span>QR Code</span>
                      </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => openPhotoLimitModal(session)}
                        className="flex-1 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 text-xs sm:text-sm font-medium py-2 px-2 sm:px-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        Settings
                      </button>
                      
                      <button
                        onClick={() => handleDownloadPhotos(session)}
                        disabled={session.photo_count === 0}
                        className={`flex-1 text-xs sm:text-sm font-medium py-2 px-2 sm:px-3 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                          session.photo_count === 0
                            ? 'bg-gray-100 dark:bg-dark-700 text-gray-400 dark:text-dark-400 cursor-not-allowed'
                            : 'bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300'
                        }`}
                        title={session.photo_count === 0 ? 'No photos to download' : `Download ${session.photo_count} photos`}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo Limit Modal */}
      {photoLimitModal.show && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-2xl">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-dark-50 mb-2">
                Update Photo Limit
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-dark-300">
                Set the maximum number of photos each user can upload to this session.
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-400 mt-2">
                Session: {photoLimitModal.session?.session_id?.substring(0, 8)}...
              </p>
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                Photos per user limit
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={photoLimitModal.newLimit}
                onChange={(e) => setPhotoLimitModal(prev => ({
                  ...prev,
                  newLimit: parseInt(e.target.value) || 1
                }))}
                className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-base sm:text-sm"
                placeholder="Enter photo limit (1-100)"
              />
              <p className="text-xs text-gray-500 dark:text-dark-400 mt-1">
                Current limit: {photoLimitModal.session?.photos_per_user_limit || 10} photos per user
              </p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={closePhotoLimitModal}
                className="flex-1 px-4 py-2.5 sm:py-2 text-gray-700 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePhotoLimit}
                className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                Update Limit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModal.show && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-2xl">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-dark-50 mb-2">
                Session QR Code
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-dark-300">
                Share this QR code for guests to upload photos to your session.
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-400 mt-2">
                Session: {qrModal.session?.session_id?.substring(0, 8)}...
              </p>
            </div>

            {qrModal.loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : qrModal.qrCode ? (
              <div className="flex flex-col items-center">
                {/* QR Code */}
                <div className="bg-white dark:bg-dark-50 p-4 rounded-xl shadow-lg mb-4 transform hover:scale-105 transition-transform duration-300">
                  <img 
                    src={`data:image/png;base64,${qrModal.qrCode}`}
                    alt="QR Code" 
                    className="w-48 h-48 sm:w-56 sm:h-56"
                  />
                </div>
                
                {/* Session URL */}
                {qrModal.sessionUrl && (
                  <div className="w-full mb-4">
                    <p className="text-sm text-gray-500 dark:text-dark-400 mb-2">Session Link:</p>
                    <div className="bg-gray-50 dark:bg-dark-700 p-3 rounded-lg border border-gray-200 dark:border-dark-600">
                      <p className="text-xs text-gray-800 dark:text-dark-100 break-all font-mono">
                        {qrModal.sessionUrl}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={copySessionLink}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-800 dark:text-dark-100 font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Link</span>
                  </button>
                  
                  <button
                    onClick={downloadQR}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download QR</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">Failed to load QR code</p>
              </div>
            )}

            <div className="flex justify-center mt-6">
              <button
                onClick={closeQrModal}
                className="px-6 py-2.5 text-gray-700 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UserDashboard;