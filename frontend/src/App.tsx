import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import SlackOAuth from './components/SlackOAuth'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'

function App() {
  const [activeTab, setActiveTab] = useState('slack')
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check localStorage for existing user data
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user.isAuthenticated && user.workspaceId && user.workspaceName) {
          // User is already authenticated, redirect to dashboard
          navigate('/dashboard')
          return
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error)
        // Clear invalid data
        localStorage.removeItem('user')
      }
    }

    // Check if we're returning from OAuth with an error
    const urlParams = new URLSearchParams(window.location.search);
    const oauthStatus = urlParams.get('oauth');
    const errorMessage = urlParams.get('message');
    
    if (oauthStatus === 'error') {
      setOauthError(errorMessage ? decodeURIComponent(errorMessage) : 'OAuth authentication failed');
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    setIsCheckingAuth(false)
  }, [navigate]);

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border border-border border-t-primary rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border py-6">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-2xl font-semibold text-foreground">Integration Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your workspace integrations</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <nav className="w-full lg:w-48">
            <div className="space-y-1">
              <Button 
                variant={activeTab === 'slack' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('slack')}
              >
                <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                  <path d="M9 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                  <path d="M15 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                  <path d="M18 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                </svg>
                Slack
              </Button>
              <Button 
                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('settings')}
              >
                <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Settings
              </Button>
            </div>
          </nav>

          <div className="flex-1">
            {activeTab === 'slack' && <SlackOAuth oauthError={oauthError} onErrorDismiss={() => setOauthError(null)} />}
            {activeTab === 'settings' && (
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Configure your application settings here.</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">Settings configuration coming soon.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
