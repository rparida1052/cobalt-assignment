import axios from "axios";
import logger from "./logger";
import prismaClient from "./prisma";

interface CachedToken {
  accessToken: string;
  expiresAt: Date;
  isRefreshing: boolean;
}

class TokenCache {
  private cache = new Map<string, CachedToken>();
  private refreshPromises = new Map<string, Promise<string>>();

  async getValidToken(workspaceId: string): Promise<string> {
    const cached = this.cache.get(workspaceId);
    
    // If we have a valid cached token, return it immediately
    if (cached && cached.expiresAt > new Date() && !cached.isRefreshing) {
      return cached.accessToken;
    }

    // If we're already refreshing this token, wait for that promise
    if (this.refreshPromises.has(workspaceId)) {
      return await this.refreshPromises.get(workspaceId)!;
    }

    // Start a new refresh process
    const refreshPromise = this.refreshToken(workspaceId);
    this.refreshPromises.set(workspaceId, refreshPromise);
    
    try {
      const token = await refreshPromise;
      return token;
    } finally {
      this.refreshPromises.delete(workspaceId);
    }
  }

  private async refreshToken(workspaceId: string): Promise<string> {
    try {
      // Mark as refreshing to prevent multiple simultaneous refreshes
      const existing = this.cache.get(workspaceId);
      if (existing) {
        existing.isRefreshing = true;
      }

      // Get workspace from database
      const workspace = await prismaClient.workspace.findUnique({
        where: { workspaceId }
      });

      if (!workspace) {
        throw new Error("Workspace not found");
      }

      // Check if current token is still valid
      if (workspace.expiresAt > new Date()) {
        const cachedToken: CachedToken = {
          accessToken: workspace.accessToken,
          expiresAt: workspace.expiresAt,
          isRefreshing: false
        };
        this.cache.set(workspaceId, cachedToken);
        return workspace.accessToken;
      }

      // Token is expired now so we should refresh it
      const refreshResponse = await axios.post(
        "https://slack.com/api/oauth.v2.access",
        new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.SLACK_CLIENT_ID!,
          client_secret: process.env.SLACK_CLIENT_SECRET!,
          refresh_token: workspace.refreshToken,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (!refreshResponse.data.ok) {
        throw new Error(`Token refresh failed: ${refreshResponse.data.error}`);
      }

      // Update database
      const newExpiresAt = new Date(Date.now() + refreshResponse.data.expires_in * 1000);
      await prismaClient.workspace.update({
        where: { workspaceId },
        data: {
          accessToken: refreshResponse.data.access_token,
          refreshToken: refreshResponse.data.refresh_token,
          expiresAt: newExpiresAt,
        }
      });

      // Update cache
      const cachedToken: CachedToken = {
        accessToken: refreshResponse.data.access_token,
        expiresAt: newExpiresAt,
        isRefreshing: false
      };
      this.cache.set(workspaceId, cachedToken);

      logger.info(`Token refreshed for workspace ${workspaceId}`);
      return refreshResponse.data.access_token;

    } catch (error) {
      logger.error(`Token refresh failed for workspace ${workspaceId}:`, error);
      
      // Remove from cache on error
      this.cache.delete(workspaceId);
      throw error;
    }
  }

  // Clear cache for a specific workspace if the user is logout 
  clearCache(workspaceId: string) {
    this.cache.delete(workspaceId);
    this.refreshPromises.delete(workspaceId);
  }


  clearAllCache() {
    this.cache.clear();
    this.refreshPromises.clear();
  }

  // Get cache stats for monitoring
  getCacheStats() {
    return {
      cachedWorkspaces: this.cache.size,
      pendingRefreshes: this.refreshPromises.size
    };
  }

  // Clean up expired tokens periodically
  private cleanupExpiredTokens() {
    const now = new Date();
    for (const [workspaceId, token] of this.cache.entries()) {
      if (token.expiresAt <= now) {
        this.cache.delete(workspaceId);
      }
    }
  }

  constructor() {
    // Set up periodic cleanup (every 5 minutes)
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 5 * 60 * 1000);
  }
}


export const tokenCache = new TokenCache();
