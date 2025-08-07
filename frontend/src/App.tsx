import { useState, useEffect } from 'react'
import SlackOAuth from './components/SlackOAuth'

function App() {
  const [activeTab, setActiveTab] = useState('slack')
  const [oauthError, setOauthError] = useState<string | null>(null)

  useEffect(() => {
    // Check if we're returning from OAuth with an error
    const urlParams = new URLSearchParams(window.location.search);
    const oauthStatus = urlParams.get('oauth');
    const errorMessage = urlParams.get('message');
    
    if (oauthStatus === 'error') {
      setOauthError(errorMessage ? decodeURIComponent(errorMessage) : 'OAuth authentication failed');
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Integration Dashboard</h1>
          <p className="text-base sm:text-lg opacity-90">Manage your workspace integrations</p>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          <nav className="w-full lg:w-64 bg-white rounded-xl p-4 lg:p-6 shadow-sm h-fit order-2 lg:order-1">
            <div className="space-y-2">
              <button 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left ${
                  activeTab === 'slack' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('slack')}
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                  <path d="M9 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                  <path d="M15 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                  <path d="M18 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                </svg>
                Slack Integration
              </button>
              <button 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left ${
                  activeTab === 'settings' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('settings')}
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Settings
              </button>
            </div>
          </nav>

          <div className="flex-1 bg-white rounded-xl p-4 sm:p-8 shadow-sm order-1 lg:order-2">
            {activeTab === 'slack' && <SlackOAuth oauthError={oauthError} onErrorDismiss={() => setOauthError(null)} />}
            {activeTab === 'settings' && (
              <div className="text-center py-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Settings</h2>
                <p className="text-gray-600 text-base sm:text-lg">Configure your application settings here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
