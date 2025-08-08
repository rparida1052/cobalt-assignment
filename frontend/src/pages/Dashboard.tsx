
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import DirectSlackMessaging from '../components/DirectSlackMessaging';
import ScheduledSlackMessaging from '../components/ScheduledSlackMessaging';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';

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
  const navigate = useNavigate();

  useEffect(() => {
    // First, check localStorage for existing user data
    const userData = localStorage.getItem('user');
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.isAuthenticated && user.workspaceId && user.workspaceName) {
          // Load data from localStorage
          setWorkspaceInfo({
            workspaceId: user.workspaceId,
            workspaceName: user.workspaceName,
          });
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        localStorage.removeItem('user');
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const oauthStatus = urlParams.get('oauth');
    const workspaceId = urlParams.get('workspaceId');
    const workspaceName = urlParams.get('workspaceName');
    const errorMessage = urlParams.get('message');

    console.log("workspaceId", workspaceId);
    console.log("workspaceName", workspaceName);
    console.log("oauthStatus", oauthStatus);
    console.log("errorMessage", errorMessage);

    if (oauthStatus === 'success' && workspaceId && workspaceName) {
      const decodedWorkspaceName = decodeURIComponent(workspaceName);
      localStorage.setItem('user', JSON.stringify({
        isAuthenticated: true,
        workspaceId,
        workspaceName: decodedWorkspaceName,
      }));

      setWorkspaceInfo({
        workspaceId,
        workspaceName: decodedWorkspaceName,
      });

      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (oauthStatus === 'error') {
      setError(errorMessage ? decodeURIComponent(errorMessage) : 'OAuth authentication failed');
    } else {
      // No authentication data found, redirect to home
      navigate('/');
      return;
    }

    setIsLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border border-border border-t-primary rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border py-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your Slack workspace integration</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Authentication Error</h3>
                  <p>{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => navigate('/')}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        ) : workspaceInfo ? (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Successfully Connected to Slack!</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <span className="font-medium text-muted-foreground">Workspace Name:</span>
                      <p className="text-foreground font-medium mt-1">{workspaceInfo.workspaceName}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <span className="font-medium text-muted-foreground">Workspace ID:</span>
                      <p className="text-foreground font-mono text-sm mt-1">{workspaceInfo.workspaceId}</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
            <Card>
              <div className='flex items-center gap-2 p-4'>
                <p className='text-red-500'>Please join the bot first to the channel which you want to send messages to</p>
              </div>
            </Card>
            {/* Messaging Components with Tabs */}
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
                    <div className="border-b border-border">
                      <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent p-0">
                        <TabsTrigger value="direct" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                          Direct Message
                        </TabsTrigger>
                        <TabsTrigger value="scheduled" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                          Schedule Message
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <div className="p-6">
                      <TabsContent value="direct">
                        <DirectSlackMessaging 
                          workspaceId={workspaceInfo.workspaceId}
                          workspaceName={workspaceInfo.workspaceName}
                        />
                      </TabsContent>
                      <TabsContent value="scheduled">
                        <ScheduledSlackMessaging 
                          workspaceId={workspaceInfo.workspaceId}
                          workspaceName={workspaceInfo.workspaceName}
                        />
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            </div>       
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No Slack Integration Found</h3>
              <p className="text-muted-foreground mb-4">Connect your Slack workspace to get started.</p>
              <Button onClick={() => navigate('/')}>
                Connect to Slack
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;