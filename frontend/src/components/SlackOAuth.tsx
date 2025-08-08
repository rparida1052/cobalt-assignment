import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Slack } from 'lucide-react';

interface SlackOAuthProps {
  oauthError?: string | null;
  onErrorDismiss?: () => void;
}

const SlackOAuth = ({ oauthError, onErrorDismiss }: SlackOAuthProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            <Slack />
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
                  <div className="flex items-center gap-2">
                   <Slack />
                    Connect to Slack
                  </div>
                )}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SlackOAuth; 