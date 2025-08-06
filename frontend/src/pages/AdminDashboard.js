import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserSessions, deleteSession, getSessionPhotos } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDateOnly } from '../utils/i18nHelpers';
import { logger } from '../utils/logger';

const AdminDashboard = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionPhotos, setSessionPhotos] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await getUserSessions();
      setSessions(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (error) {
      logger.api.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm(t('dashboard:alerts.confirmDelete'))) {
      setDeleteLoading(sessionId);
      try {
        await deleteSession(sessionId);
        loadSessions();
        if (selectedSession?.session_id === sessionId) {
          setSelectedSession(null);
          setSessionPhotos([]);
        }
      } catch (error) {
        logger.api.error('Error deleting session:', error);
        alert(t('dashboard:alerts.deleteError'));
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const handleViewPhotos = async (session) => {
    setSelectedSession(session);
    setPhotoLoading(true);
    try {
      const response = await getSessionPhotos(session.session_id);
      setSessionPhotos(response.data);
    } catch (error) {
      logger.api.error('Error loading photos:', error);
    } finally {
      setPhotoLoading(false);
    }
  };

  const getSessionStats = () => {
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.is_active).length;
    const totalPhotos = sessions.reduce((acc, s) => acc + s.photo_count, 0);
    return { totalSessions, activeSessions, totalPhotos };
  };

  const stats = getSessionStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-300">{t('dashboard:admin.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-dark-50 dark:to-dark-300 bg-clip-text text-transparent">
                {t('dashboard:admin.title')}
              </h1>
              <p className="text-gray-600 dark:text-dark-300 mt-2">
                {user ? t('dashboard:admin.welcome', { name: user.name }) : ''}{t('dashboard:admin.subtitle')}
              </p>
            </div>
            <button
              onClick={loadSessions}
              className="mt-4 sm:mt-0 flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{t('dashboard:admin.refresh')}</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-dark-700/50 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-dark-300">{t('dashboard:sessions.stats.totalSessions')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">{stats.totalSessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-dark-700/50 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-dark-300">{t('dashboard:sessions.stats.activeSessions')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">{stats.activeSessions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-dark-700/50 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-dark-300">{t('dashboard:sessions.stats.totalPhotos')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-dark-50">{stats.totalPhotos}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* Sessions List */}
          <div className="xl:col-span-2">
            <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-dark-700/50 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-dark-50 mb-6">{t('dashboard:sessions.adminTitle')}</h2>
              
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 dark:text-dark-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-gray-500 dark:text-dark-300 text-lg mb-2">{t('dashboard:sessions.noSessions')}</p>
                  <p className="text-gray-400 dark:text-dark-400">{t('dashboard:sessions.adminNoSessionsDescription')}</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                  {sessions.map((session) => (
                    <div 
                      key={session.id} 
                      className={`border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
                        selectedSession?.session_id === session.session_id 
                          ? 'border-blue-300 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-dark-50">
                              Session {session.session_id.substring(0, 8)}...
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              session.is_active 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                            }`}>
                              {session.is_active ? t('dashboard:sessions.active') : t('dashboard:sessions.inactive')}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600 dark:text-dark-300">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                              <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{session.photo_count} / {session.max_photos} {t('dashboard:sessions.stats.photosUnit')}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{formatDateOnly(session.created_at)}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:ml-4">
                          <button
                            onClick={() => handleViewPhotos(session)}
                            className="flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-400 text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{t('dashboard:actions.view')}</span>
                          </button>
                          
                          <button
                            onClick={() => handleDeleteSession(session.session_id)}
                            disabled={deleteLoading === session.session_id}
                            className="flex items-center space-x-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-400 text-sm font-medium py-2 px-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleteLoading === session.session_id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 dark:border-red-400"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                            <span>{t('dashboard:actions.delete')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Photos Panel */}
          <div className="xl:col-span-1">
            <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-dark-700/50 p-4 sm:p-6 sticky top-20 sm:top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-dark-50 mb-6">
                {selectedSession ? (
                  <span className="flex items-center space-x-2">
                    <span>{t('dashboard:photos.sessionPhotos')}</span>
                    <span className="text-sm font-normal text-gray-500 dark:text-dark-400">
                      ({selectedSession.session_id.substring(0, 8)}...)
                    </span>
                  </span>
                ) : (
                  t('dashboard:photos.title')
                )}
              </h2>
              
              {photoLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                </div>
              ) : selectedSession ? (
                sessionPhotos.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-400 dark:text-dark-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 dark:text-dark-300">{t('dashboard:photos.noPhotos')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-80 sm:max-h-96 overflow-y-auto">
                    {sessionPhotos.map((photo, index) => (
                      <div key={photo.id} className="aspect-square group relative overflow-hidden rounded-lg">
                        <img 
                          src={photo.url} 
                          alt={`${t('dashboard:photos.photo')} ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => window.open(photo.url, '_blank')}
                              className="bg-white dark:bg-dark-700 text-gray-900 dark:text-dark-50 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-gray-400 dark:text-dark-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p className="text-gray-500 dark:text-dark-300">{t('dashboard:photos.selectSession')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;