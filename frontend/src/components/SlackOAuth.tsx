import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { API_ENDPOINTS } from '../config';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

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
    <div className="max-w-md">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-lg">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M6 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#E01E5A"/>
                <path d="M9 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#36C5F0"/>
                <path d="M15 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#2EB67D"/>
                <path d="M18 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#ECB22E"/>
              </svg>
            </div>
            <div>
              <CardTitle>Connect to Slack</CardTitle>
              <CardDescription>Integrate your Slack workspace to enable messaging and channel management</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg z-10">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border border-border border-t-primary rounded-full animate-spin"></div>
                  <span className="text-muted-foreground">Processing OAuth...</span>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <Button 
                className="w-full"
                onClick={initiateSlackAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                      <path d="M9 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                      <path d="M15 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                      <path d="M18 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                    </svg>
                    Connect to Slack
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline"
                onClick={simulateOAuthSuccess}
                disabled={isLoading}
                className="w-full"
              >
                Test Mode (Simulate Success)
              </Button>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={dismissError}
                    className="h-auto p-0 text-destructive hover:text-destructive"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">What you can do with Slack integration:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Send messages to channels</li>
                <li>Manage team members</li>
                <li>Access channel information</li>
                <li>Receive notifications</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default SlackOAuth; 