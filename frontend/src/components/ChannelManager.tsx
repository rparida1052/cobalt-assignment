import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config';

interface Channel {
  id: string;
  name: string;
  is_private: boolean;
  is_archived: boolean;
  num_members: number;
}

interface JoinedChannel {
  id: string;
  channelId: string;
  channelName: string;
  isPrivate: boolean;
  joinedAt: string;
}

interface ChannelManagerProps {
  workspaceId: string;
  workspaceName: string;
}

const ChannelManager = ({ workspaceId, workspaceName }: ChannelManagerProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [joinedChannels, setJoinedChannels] = useState<JoinedChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels();
    fetchJoinedChannels();
  }, [workspaceId]);

  const fetchChannels = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.SLACK_CHANNELS}?workspaceId=${workspaceId}`,{
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch channels');
      }
      
      setChannels(data.channels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channels');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJoinedChannels = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SLACK_JOINED_CHANNELS}?workspaceId=${workspaceId}`,{
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch joined channels');
      }
      
      setJoinedChannels(data.joinedChannels);
    } catch (err) {
      console.error('Failed to fetch joined channels:', err);
    }
  };

  const joinChannel = async (channel: Channel) => {
    setIsJoining(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(API_ENDPOINTS.SLACK_JOIN_CHANNEL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          workspaceId,
          channelId: channel.id,
          channelName: channel.name,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join channel');
      }
      
      setSuccess(`Successfully joined #${channel.name}!`);
      fetchJoinedChannels(); // Refresh joined channels list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join channel');
    } finally {
      setIsJoining(false);
    }
  };

  const isChannelJoined = (channelId: string) => {
    return joinedChannels.some(channel => channel.channelId === channelId);
  };

  const dismissError = () => {
    setError(null);
  };

  const dismissSuccess = () => {
    setSuccess(null);
  };

  return (
    <div className="border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-normal text-gray-900">Channel Management</h3>
        <p className="text-sm text-gray-500">Join channels in {workspaceName} to send messages</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading channels...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Joined Channels Section */}
          {joinedChannels.length > 0 && (
            <div>
              <h4 className="text-md font-normal text-gray-900 mb-3">Joined Channels ({joinedChannels.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {joinedChannels.map((channel) => (
                  <div key={channel.id} className="bg-gray-50 border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">#{channel.channelName}</span>
                        <p className="text-xs text-gray-500 mt-1">
                          Joined {new Date(channel.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-gray-600 text-sm">✓</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Channels Section */}
          <div>
            <h4 className="text-md font-normal text-gray-900 mb-3">
              Available Channels ({channels.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {channels.map((channel) => {
                const isJoined = isChannelJoined(channel.id);
                return (
                  <div 
                    key={channel.id} 
                    className={`border p-3 ${
                      isJoined 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">#{channel.name}</span>
                          {channel.is_private && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1">Private</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {channel.num_members} members
                        </p>
                      </div>
                      <button
                        onClick={() => joinChannel(channel)}
                        disabled={isJoined || isJoining}
                        className={`px-3 py-1 text-sm transition-colors ${
                          isJoined
                            ? 'bg-gray-100 text-gray-700 cursor-not-allowed'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        {isJoined ? 'Joined' : isJoining ? 'Joining...' : 'Join'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-700 text-sm">
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

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <span>{success}</span>
                </div>
                <button 
                  onClick={dismissSuccess}
                  className="text-green-500 hover:text-green-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChannelManager;
