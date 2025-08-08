import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';

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

  useEffect(() => {
    fetchChannels();
  }, [workspaceId]);

  const fetchChannels = async () => {
    setIsLoading(true);
    
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
      toast.error(err instanceof Error ? err.message : 'Failed to fetch channels');
    } finally {
      setIsLoading(false);
    }
  };

  const sendDirectMessage = async () => {
    if (!selectedChannel || !message.trim()) {
      toast.error('Please select a channel and enter a message');
      return;
    }

    setIsSending(true);

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
      
      toast.success('Message sent successfully!');
      setMessage('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };



  const getSelectedChannelName = () => {
    const channel = channels.find(ch => ch.id === selectedChannel);
    return channel ? channel.name : '';
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">Direct Message to Slack</h3>
          <p className="text-sm text-muted-foreground">Send messages directly to any channel in {workspaceName}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchChannels}
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
        <div className="space-y-4">
          {/* Channel Selection */}
          <div>
            <label htmlFor="channel-select" className="block text-sm font-medium mb-2">
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
            <label htmlFor="message-input" className="block text-sm font-medium mb-2">
              Message
            </label>
            <Textarea
              id="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Enter your message for #${getSelectedChannelName()}...`}
              rows={4}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={sendDirectMessage}
            disabled={isSending || !selectedChannel || !message.trim()}
            className="w-full"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send Direct Message</span>
              </>
            )}
          </Button>


        </div>
      )}
    </div>
  );
};

export default DirectSlackMessaging;
