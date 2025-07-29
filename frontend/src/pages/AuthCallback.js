import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        // Handle OAuth error
        console.error('OAuth error:', error);
        let errorType = 'auth_failed';
        
        // Map specific errors
        switch(error) {
          case 'oauth_failed':
            errorType = 'auth_failed';
            break;
          case 'no_code':
            errorType = 'no_token';
            break;
          default:
            errorType = 'auth_failed';
        }
        
        navigate(`/?error=${errorType}`);
        return;
      }

      if (token) {
        // Store token and redirect to dashboard
        login(token);
        navigate('/dashboard');
      } else {
        // No token received
        navigate('/?error=no_token');
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-3 sm:px-4">
      <div className="text-center max-w-sm mx-auto">
        <LoadingSpinner size="lg" text="Completing sign in..." />
        <p className="mt-4 text-gray-600 text-sm sm:text-base">Please wait while we sign you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;