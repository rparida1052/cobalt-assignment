import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config';

interface JoinedChannel {
  id: string;
  channelId: string;
  channelName: string;
  isPrivate: boolean;
  joinedAt: string;
}

interface SlackMessagingProps {
  workspaceId: string;
  workspaceName: string;
}

const SlackMessaging = ({ workspaceId, workspaceName }: SlackMessagingProps) => {
  const [joinedChannels, setJoinedChannels] = useState<JoinedChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchJoinedChannels();
  }, [workspaceId]);

  const fetchJoinedChannels = async () => {
    setIsLoading(true);
    setError(null);
    
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
      if (data.joinedChannels.length > 0 && !selectedChannel) {
        setSelectedChannel(data.joinedChannels[0].channelId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch joined channels');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
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
    const channel = joinedChannels.find(ch => ch.channelId === selectedChannel);
    return channel ? channel.channelName : '';
  };

  return (
    <div className="border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-normal text-gray-900">Send Message to Slack</h3>
          <p className="text-sm text-gray-500">Send a message to joined channels in {workspaceName}</p>
        </div>
        <button
          onClick={fetchJoinedChannels}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading joined channels...</span>
          </div>
        </div>
      ) : joinedChannels.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h4 className="text-lg font-normal text-gray-900 mb-2">No Joined Channels</h4>
          <p className="text-gray-600 mb-4">You need to join channels first before you can send messages.</p>
          <div className="text-sm text-gray-500">
            Go to the Channel Management section to join channels.
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
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            >
              <option value="">Select a channel...</option>
              {joinedChannels.map((channel) => (
                <option key={channel.id} value={channel.channelId}>
                  #{channel.channelName} ({channel.isPrivate ? 'Private' : 'Public'})
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
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 resize-none"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={isSending || !selectedChannel || !message.trim()}
            className="w-full px-4 py-2 bg-gray-900 text-white font-medium transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send Message</span>
              </>
            )}
          </button>

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

export default SlackMessaging;
