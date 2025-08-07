
import { useEffect, useState } from 'react';
import DirectSlackMessaging from '../components/DirectSlackMessaging';
import ScheduledSlackMessaging from '../components/ScheduledSlackMessaging';
import { Navigate } from 'react-router';

interface WorkspaceInfo {
  workspaceId: string;
  workspaceName: string;
}

type TabType = 'direct' | 'scheduled';

const Dashboard = () => {
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('direct');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthStatus = urlParams.get('oauth');
    const workspaceId = urlParams.get('workspaceId');
    const workspaceName = urlParams.get('workspaceName');
    const errorMessage = urlParams.get('message');
    console.log("workspaceId", workspaceId);
    console.log("workspaceName", workspaceName);
    console.log("oauthStatus", oauthStatus);
    console.log("errorMessage", errorMessage);
    localStorage.setItem('user', JSON.stringify({
      isAuthenticated: true,
      workspaceId: workspaceId,
      workspaceName: workspaceName,
    }));
    if (oauthStatus === 'success' && workspaceId && workspaceName) {
      setWorkspaceInfo({
        workspaceId,
        workspaceName: decodeURIComponent(workspaceName)
      });
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (oauthStatus === 'error') {
      setError(errorMessage ? decodeURIComponent(errorMessage) : 'OAuth authentication failed');
    }
    
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-lg shadow-lg">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="font-medium text-gray-700">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-base sm:text-lg opacity-90">Manage your Slack workspace integration</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-1">Authentication Error</h3>
                <p className="text-red-700">{error}</p>
                <a 
                  href="/" 
                  className="inline-block mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </a>
              </div>
            </div>
          </div>
        ) : workspaceInfo ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">✅</span>
                <h3 className="text-lg font-semibold text-green-800">Successfully Connected to Slack!</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <span className="font-semibold text-gray-700">Workspace Name:</span>
                  <p className="text-green-700 font-medium mt-1">{workspaceInfo.workspaceName}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <span className="font-semibold text-gray-700">Workspace ID:</span>
                  <p className="text-green-700 font-mono text-sm mt-1">{workspaceInfo.workspaceId}</p>
                </div>
              </div>
            </div>

            {/* Messaging Components with Tabs */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('direct')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'direct'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>🚀</span>
                        <span>Direct Message</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('scheduled')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'scheduled'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>⏰</span>
                        <span>Schedule Message</span>
                      </div>
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'direct' ? (
                    <DirectSlackMessaging 
                      workspaceId={workspaceInfo.workspaceId}
                      workspaceName={workspaceInfo.workspaceName}
                    />
                  ) : (
                    <ScheduledSlackMessaging 
                      workspaceId={workspaceInfo.workspaceId}
                      workspaceName={workspaceInfo.workspaceName}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Additional Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">👥</span>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Team</h3>
                </div>
                <p className="text-gray-600 mb-4">View and manage team members in your workspace.</p>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  View Team
                </button>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📋</span>
                  <h3 className="text-lg font-semibold text-gray-900">Channel Info</h3>
                </div>
                <p className="text-gray-600 mb-4">Access and manage channel information and settings.</p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  View Channels
                </button>
              </div>
            </div>

            {/* Troubleshooting Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔧</span>
                <h3 className="text-lg font-semibold text-blue-800">Troubleshooting</h3>
              </div>
              <div className="space-y-3 text-blue-700 text-sm">
                <p><strong>If messages aren't sending:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Make sure your Slack app has the <code>chat:write</code> permission</li>
                  <li>Check that the channel exists and is not archived</li>
                  <li>For private channels, ensure the bot has been invited</li>
                  <li>Try refreshing the page and reconnecting your workspace</li>
                </ul>
                <p className="mt-4"><strong>For scheduled messages:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Scheduled messages will be sent automatically at the specified time</li>
                  <li>You can delete pending scheduled messages before they are sent</li>
                  <li>Check the status of your scheduled messages in the Schedule Message tab</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
            <span className="text-4xl mb-4 block">🔗</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Slack Integration Found</h3>
            <p className="text-gray-600 mb-4">Connect your Slack workspace to get started.</p>
            <a 
              href="/" 
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Connect to Slack
            </a>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;