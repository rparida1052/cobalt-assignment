import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { API_ENDPOINTS } from '../config';

interface SlackOAuthProps {
  oauthError?: string | null;
  onErrorDismiss?: () => void;
}

const SlackOAuth = ({ oauthError, onErrorDismiss }: SlackOAuthProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Set error from props if provided
  useEffect(() => {
    if (oauthError) {
      setError(oauthError);
    }
  }, [oauthError]);

  const initiateSlackAuth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Redirect to the backend OAuth endpoint
      window.location.href = API_ENDPOINTS.SLACK_AUTH;
    } catch (err) {
      setError('Failed to initiate Slack OAuth');
      setIsLoading(false);
    }
  };

  const simulateOAuthSuccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Save test data to localStorage
      const testData = {
        isAuthenticated: true,
        workspaceId: 'T1234567890',
        workspaceName: 'Test Workspace',
      };
      localStorage.setItem('user', JSON.stringify(testData));
      
      // Redirect to dashboard
      navigate('/dashboard');
    }, 2000);
  };

  const dismissError = () => {
    setError(null);
    if (onErrorDismiss) {
      onErrorDismiss();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl shadow-lg mb-4">
          <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none">
            <path d="M6 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#E01E5A"/>
            <path d="M9 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#36C5F0"/>
            <path d="M15 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#2EB67D"/>
            <path d="M18 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#ECB22E"/>
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Connect to Slack</h2>
        <p className="text-gray-600 text-sm sm:text-lg">Integrate your Slack workspace to enable messaging and channel management</p>
      </div>

      <div className="relative mb-6 sm:mb-8">
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-lg z-10">
            <div className="flex items-center gap-3 bg-white px-4 sm:px-6 py-4 rounded-lg shadow-lg">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="font-medium text-gray-700 text-sm sm:text-base">Processing OAuth...</span>
            </div>
          </div>
        )}
        
        <div className="text-center">
          <button 
            className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto"
            onClick={initiateSlackAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                  <path d="M9 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                  <path d="M15 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                  <path d="M18 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                </svg>
                Connect to Slack
              </>
            )}
          </button>
          
          {/* Test Mode Button */}
          <div className="mt-4">
            <button 
              onClick={simulateOAuthSuccess}
              disabled={isLoading}
              className="px-3 sm:px-4 py-2 bg-gray-500 text-white text-xs sm:text-sm rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🧪 Test Mode (Simulate Success)
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-700 text-sm sm:text-base">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
                <button 
                  onClick={dismissError}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">What you can do with Slack integration:</h3>
        <ul className="space-y-2 text-gray-600 text-sm sm:text-base">
          <li className="flex items-center gap-2">📢 Send messages to channels</li>
          <li className="flex items-center gap-2">👥 Manage team members</li>
          <li className="flex items-center gap-2">📋 Access channel information</li>
          <li className="flex items-center gap-2">🔔 Receive notifications</li>
        </ul>
      </div>
    </div>
  );
};

export default SlackOAuth; 