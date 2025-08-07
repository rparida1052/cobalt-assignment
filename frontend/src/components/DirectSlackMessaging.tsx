import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config';

interface Channel {
  id: string;
  name: string;
  is_private: boolean;
  is_archived: boolean;
  num_members: number;
}

interface DirectSlackMessagingProps {
  workspaceId: string;
  workspaceName: string;
}

const DirectSlackMessaging = ({ workspaceId, workspaceName }: DirectSlackMessagingProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels();
  }, [workspaceId]);

  const fetchChannels = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.SLACK_CHANNELS}?workspaceId=${workspaceId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch channels');
      }
      
      setChannels(data.channels);
      if (data.channels.length > 0 && !selectedChannel) {
        setSelectedChannel(data.channels[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channels');
    } finally {
      setIsLoading(false);
    }
  };

  const sendDirectMessage = async () => {
    if (!selectedChannel || !message.trim()) {
      setError('Please select a channel and enter a message');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(API_ENDPOINTS.SLACK_SEND_MESSAGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          workspaceId,
          channelId: selectedChannel,
          message: message.trim(),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
      
      setSuccess('Message sent successfully!');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const dismissError = () => {
    setError(null);
  };

  const dismissSuccess = () => {
    setSuccess(null);
  };

  const getSelectedChannelName = () => {
    const channel = channels.find(ch => ch.id === selectedChannel);
    return channel ? channel.name : '';
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🚀</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Direct Message to Slack</h3>
          <p className="text-sm text-gray-600">Send messages directly to any channel in {workspaceName}</p>
        </div>
        <button
          onClick={fetchChannels}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading channels...</span>
          </div>
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Channels Available</h4>
          <p className="text-gray-600 mb-4">Unable to fetch channels from your Slack workspace.</p>
          <div className="text-sm text-gray-500">
            Make sure your Slack app has the necessary permissions.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Channel Selection */}
          <div>
            <label htmlFor="channel-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Channel
            </label>
            <select
              id="channel-select"
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a channel...</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name} ({channel.is_private ? 'Private' : 'Public'}) - {channel.num_members} members
                </option>
              ))}
            </select>
          </div>

          {/* Message Input */}
          <div>
            <label htmlFor="message-input" className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              id="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Enter your message for #${getSelectedChannelName()}...`}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={sendDirectMessage}
            disabled={isSending || !selectedChannel || !message.trim()}
            className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send Direct Message</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-700 text-sm">
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

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <span>✅</span>
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

          {/* Info Box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-sm">ℹ️</span>
              <div className="text-blue-700 text-sm">
                <p className="font-medium mb-1">Direct Messaging</p>
                <p>This feature sends messages directly to channels without requiring you to join them first. The bot will automatically join the channel if needed.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectSlackMessaging;
