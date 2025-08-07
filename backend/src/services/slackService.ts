import axios from "axios";
import { tokenCache } from "../utils/tokenCache";
import logger from "../utils/logger";

export class SlackService {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any,
    params?: any
  ): Promise<T> {
    // Get the cached token and automtically refresh if need
    const token = await tokenCache.getValidToken(this.workspaceId);
    
    try {
      const response = await axios({
        method,
        url: `https://slack.com/api/${endpoint}`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: method === 'POST' ? data : undefined,
        params: method === 'GET' ? params : undefined,
      });

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return response.data;
    } catch (error) {
      logger.error(`Slack API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async getChannels() {
    return this.makeRequest('GET', 'conversations.list', undefined, {
      types: "public_channel,private_channel",
      exclude_archived: true,
    });
  }

  async joinChannel(channelId: string) {
    return this.makeRequest('POST', 'conversations.join', { channel: channelId });
  }

  async sendMessage(channelId: string, message: string) {
    return this.makeRequest('POST', 'chat.postMessage', {
      channel: channelId,
      text: message,
    });
  }

  // Get cache stats for monitoring
  static getCacheStats() {
    return tokenCache.getCacheStats();
  }

  // Clear cache for this workspace
  clearCache() {
    tokenCache.clearCache(this.workspaceId);
  }
}
