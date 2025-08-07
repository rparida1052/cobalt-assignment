import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config';

interface Channel {
  id: string;
  name: string;
  is_private: boolean;
  is_archived: boolean;
  num_members: number;
}

interface ScheduledMessage {
  id: string;
  workspaceId: string;
  channelId: string;
  channelName: string;
  message: string;
  scheduledAt: string;
  sentAt: string | null;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface ScheduledSlackMessagingProps {
  workspaceId: string;
  workspaceName: string;
}

const ScheduledSlackMessaging = ({ workspaceId, workspaceName }: ScheduledSlackMessagingProps) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);

  useEffect(() => {
    fetchChannels();
    fetchScheduledMessages();
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

  const fetchScheduledMessages = async () => {
    setIsLoadingScheduled(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.SLACK_SCHEDULED_MESSAGES}?workspaceId=${workspaceId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch scheduled messages');
      }
      
      setScheduledMessages(data.scheduledMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scheduled messages');
    } finally {
      setIsLoadingScheduled(false);
    }
  };

  const scheduleMessage = async () => {
    if (!selectedChannel || !message.trim() || !scheduledDate || !scheduledTime) {
      setError('Please select a channel, enter a message, and set a scheduled date and time');
      return;
    }

    const selectedChannelData = channels.find(ch => ch.id === selectedChannel);
    if (!selectedChannelData) {
      setError('Selected channel not found');
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    
    if (scheduledDateTime <= now) {
      setError('Scheduled time must be in the future');
      return;
    }

    setIsScheduling(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(API_ENDPOINTS.SLACK_SCHEDULE_MESSAGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          workspaceId,
          channelId: selectedChannel,
          channelName: selectedChannelData.name,
          message: message.trim(),
          scheduledAt: scheduledDateTime.toISOString(),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule message');
      }
      
      setSuccess('Message scheduled successfully!');
      setMessage('');
      setScheduledDate('');
      setScheduledTime('');
      fetchScheduledMessages(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule message');
    } finally {
      setIsScheduling(false);
    }
  };

  const deleteScheduledMessage = async (messageId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SLACK_DELETE_SCHEDULED_MESSAGE}/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ workspaceId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete scheduled message');
      }
      
      setSuccess('Scheduled message deleted successfully!');
      fetchScheduledMessages(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete scheduled message');
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'sending':
        return 'text-blue-600 bg-blue-100';
      case 'sent':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Set default time to 1 hour from now
  useEffect(() => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    const dateStr = oneHourLater.toISOString().split('T')[0];
    const timeStr = oneHourLater.toTimeString().slice(0, 5);
    
    if (!scheduledDate) setScheduledDate(dateStr);
    if (!scheduledTime) setScheduledTime(timeStr);
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">⏰</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Schedule Message to Slack</h3>
          <p className="text-sm text-gray-600">Schedule messages to be sent to channels in {workspaceName}</p>
        </div>
        <button
          onClick={() => { fetchChannels(); fetchScheduledMessages(); }}
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
        <div className="space-y-6">
          {/* Channel Selection */}
          <div>
            <label htmlFor="channel-select-schedule" className="block text-sm font-medium text-gray-700 mb-2">
              Select Channel
            </label>
            <select
              id="channel-select-schedule"
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
            <label htmlFor="message-input-schedule" className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              id="message-input-schedule"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Enter your message for #${getSelectedChannelName()}...`}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduled-date" className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date
              </label>
              <input
                type="date"
                id="scheduled-date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="scheduled-time" className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Time
              </label>
              <input
                type="time"
                id="scheduled-time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Schedule Button */}
          <button
            onClick={scheduleMessage}
            disabled={isScheduling || !selectedChannel || !message.trim() || !scheduledDate || !scheduledTime}
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isScheduling ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Schedule Message</span>
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

          {/* Scheduled Messages List */}
          <div className="mt-8">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Scheduled Messages</h4>
            {isLoadingScheduled ? (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-gray-600">Loading scheduled messages...</span>
                </div>
              </div>
            ) : scheduledMessages.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <div className="text-gray-400 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">No scheduled messages</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledMessages.map((scheduledMessage) => (
                  <div key={scheduledMessage.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            #{scheduledMessage.channelName}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(scheduledMessage.status)}`}>
                            {scheduledMessage.status === 'sending' ? (
                              <span className="flex items-center gap-1">
                                <span className="w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin inline-block"></span>
                                Sending
                              </span>
                            ) : (
                              scheduledMessage.status
                            )}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{scheduledMessage.message}</p>
                        <div className="text-xs text-gray-500">
                          <p>Scheduled for: {formatDateTime(scheduledMessage.scheduledAt)}</p>
                          {scheduledMessage.sentAt && (
                            <p>Sent at: {formatDateTime(scheduledMessage.sentAt)}</p>
                          )}
                        </div>
                      </div>
                      {scheduledMessage.status === 'pending' && (
                        <button
                          onClick={() => deleteScheduledMessage(scheduledMessage.id)}
                          className="ml-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Delete scheduled message"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-sm">ℹ️</span>
              <div className="text-blue-700 text-sm">
                <p className="font-medium mb-1">Message Scheduling</p>
                <p>Schedule messages to be sent at a specific date and time. Messages will be sent automatically when the scheduled time arrives.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledSlackMessaging;
