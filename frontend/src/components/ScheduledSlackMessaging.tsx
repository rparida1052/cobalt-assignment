import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

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
        return 'text-yellow-600 bg-yellow-50';
      case 'sending':
        return 'text-blue-600 bg-blue-50';
      case 'sent':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-muted-foreground bg-muted';
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
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">Schedule Message to Slack</h3>
          <p className="text-sm text-muted-foreground">Schedule messages to be sent to channels in {workspaceName}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { fetchChannels(); fetchScheduledMessages(); }}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border border-border border-t-primary rounded-full animate-spin"></div>
            <span className="text-muted-foreground">Loading channels...</span>
          </div>
        </div>
      ) : channels.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold mb-2">No Channels Available</h4>
            <p className="text-muted-foreground mb-4">Unable to fetch channels from your Slack workspace.</p>
            <div className="text-sm text-muted-foreground">
              Make sure your Slack app has the necessary permissions.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Channel Selection */}
          <div>
            <label htmlFor="channel-select-schedule" className="block text-sm font-medium mb-2">
              Select Channel
            </label>
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a channel..." />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    #{channel.name} ({channel.is_private ? 'Private' : 'Public'}) - {channel.num_members} members
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Input */}
          <div>
            <label htmlFor="message-input-schedule" className="block text-sm font-medium mb-2">
              Message
            </label>
            <Textarea
              id="message-input-schedule"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Enter your message for #${getSelectedChannelName()}...`}
              rows={4}
            />
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduled-date" className="block text-sm font-medium mb-2">
                Scheduled Date
              </label>
              <Input
                type="date"
                id="scheduled-date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label htmlFor="scheduled-time" className="block text-sm font-medium mb-2">
                Scheduled Time
              </label>
              <Input
                type="time"
                id="scheduled-time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Schedule Button */}
          <Button
            onClick={scheduleMessage}
            disabled={isScheduling || !selectedChannel || !message.trim() || !scheduledDate || !scheduledTime}
            className="w-full"
          >
            {isScheduling ? (
              <>
                <div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Schedule Message</span>
              </>
            )}
          </Button>

          {/* Error Message */}
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

          {/* Success Message */}
          {success && (
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span>{success}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={dismissSuccess}
                  className="h-auto p-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Scheduled Messages List */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold mb-4">Scheduled Messages</h4>
            {isLoadingScheduled ? (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border border-border border-t-primary rounded-full animate-spin"></div>
                  <span className="text-muted-foreground">Loading scheduled messages...</span>
                </div>
              </div>
            ) : scheduledMessages.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="text-center py-6">
                  <div className="text-muted-foreground mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground text-sm">No scheduled messages</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {scheduledMessages.map((scheduledMessage) => (
                  <Card key={scheduledMessage.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-foreground">
                              #{scheduledMessage.channelName}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(scheduledMessage.status)}`}>
                              {scheduledMessage.status === 'sending' ? (
                                <span className="flex items-center gap-1">
                                  <span className="w-3 h-3 border border-blue-200 border-t-blue-600 rounded-full animate-spin inline-block"></span>
                                  Sending
                                </span>
                              ) : (
                                scheduledMessage.status
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{scheduledMessage.message}</p>
                          <div className="text-xs text-muted-foreground">
                            <p>Scheduled for: {formatDateTime(scheduledMessage.scheduledAt)}</p>
                            {scheduledMessage.sentAt && (
                              <p>Sent at: {formatDateTime(scheduledMessage.sentAt)}</p>
                            )}
                          </div>
                        </div>
                        {scheduledMessage.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteScheduledMessage(scheduledMessage.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledSlackMessaging;
