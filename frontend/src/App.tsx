import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import SlackOAuth from './components/SlackOAuth'

function App() {
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
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <SlackOAuth oauthError={oauthError} onErrorDismiss={() => setOauthError(null)} />
    </div>
  )
}

export default App
