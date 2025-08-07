import { Request, Response } from "express";
import axios from "axios";
import logger from "../utils/logger";
import prismaClient from "../utils/prisma";
import { SlackService } from "../services/slackService";

const slackAuthInitialise = async (req: Request, res: Response) => {
    const scopes = "channels:read,chat:write,users:read,groups:read";
    res.redirect(`https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${scopes}&user_scope=${scopes}&redirect_uri=${process.env.SLACK_REDIRECT_URI}`);
}

const slackHandleCallback = async (req: Request, res: Response) => {
    const { code } = req.query;
    try {
      console.log("Received Slack OAuth code:", code);
  
      const tokenRes = await axios.post(
        "https://slack.com/api/oauth.v2.access",
        new URLSearchParams({
          code: code as string,
          client_id: process.env.SLACK_CLIENT_ID!,
          client_secret: process.env.SLACK_CLIENT_SECRET!,
          redirect_uri: process.env.SLACK_REDIRECT_URI!,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
  
      const token = tokenRes.data;
  
      if (!token.ok) {
        return res.status(500).json({ 
          error: "Error from Slack: " + token.error 
        });
      }
  
      const botAccessToken = token.access_token;
      const refreshToken = token.refresh_token;
      const expiresIn = token.expires_in;// in seconds
  
            const workspaceId = token.team.id;
      const authedUserId = token.authed_user.id;
      
      // Check if workspace already exists, update if it does, create if it doesn't
      let workspace;
      try {
        workspace = await prismaClient.workspace.upsert({
          where: { workspaceId: workspaceId },
          update: {
            workspaceName: token.team.name,
            accessToken: botAccessToken,
            refreshToken: refreshToken,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            botUserId: token.bot_user_id,
            authedUserId: authedUserId,
          },
          create: {
            workspaceId: workspaceId,
            workspaceName: token.team.name,
            accessToken: botAccessToken,
            refreshToken: refreshToken,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            botUserId: token.bot_user_id,
            authedUserId: authedUserId,
          }
        });
        logger.info(`Slack OAuth success: ${workspace.workspaceName} with id ${workspace.workspaceId}`);
      } catch (dbError:any) {
        logger.error("Database error during workspace creation/update:", dbError);
        console.error("Database error during workspace creation/update:", dbError);
        return res.status(500).json({ 
          error: "Failed to save workspace data"+dbError.message
        });
      }

      try {
        const channelResponse = await axios.get("https://slack.com/api/conversations.list", {
          headers: {
            Authorization: `Bearer ${botAccessToken}`,
          },
        });
        console.log(channelResponse.data);
        if (channelResponse.data.ok) {
          const channels = channelResponse.data.channels.map((ch: any) => ch.name);
          logger.info(`Fetched ${channels.length} channels for workspace ${workspaceId}`);
        } else {
          logger.warn(`Failed to fetch channels: ${channelResponse.data.error}`);
        }
      } catch (channelError) {
        logger.warn("Error fetching channels:", channelError);
      }

      // Redirect to the frontend dashboard
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/dashboard?oauth=success&workspaceId=${encodeURIComponent(workspaceId)}&workspaceName=${encodeURIComponent(token.team.name)}`;
      
      res.redirect(redirectUrl);
    } catch (err) {
      console.error("Slack OAuth callback error:", err);
      logger.error("Slack OAuth callback error:", err);
      
      // Redirect to frontend with error parameters
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/?oauth=error&message=${encodeURIComponent('OAuth Callback Error')}`;
      
      res.redirect(redirectUrl);
    }
}

const getSlackChannels = async (req: Request, res: Response) => {
    try {
        const { workspaceId } = req.query;
        
        if (!workspaceId) {
            return res.status(400).json({ error: "Workspace ID is required" });
        }

        const slackService = new SlackService(workspaceId as string);
        const response = await slackService.getChannels() as any;

        const channels = response.channels.map((channel: any) => ({
            id: channel.id,
            name: channel.name,
            is_private: channel.is_private,
            is_archived: channel.is_archived,
            num_members: channel.num_members,
        }));

        res.json({ channels });
    } catch (error) {
        logger.error("Error fetching Slack channels:", error);
        res.status(500).json({ error: "Failed to fetch channels" });
    }
};

const joinSlackChannel = async (req: Request, res: Response) => {
    try {
        const { workspaceId, channelId, channelName } = req.body;
        
        if (!workspaceId || !channelId || !channelName) {
            return res.status(400).json({ 
                error: "Workspace ID, channel ID, and channel name are required" 
            });
        }

        // Check if already joined
        const existingJoin = await prismaClient.joinedChannel.findUnique({
            where: {
                workspaceId_channelId: {
                    workspaceId,
                    channelId
                }
            }
        });

        if (existingJoin) {
            return res.status(400).json({ 
                error: "Already joined to this channel" 
            });
        }

        const slackService = new SlackService(workspaceId);
        
        try {
            await slackService.joinChannel(channelId);
            
            // Save joined channel to database
            const joinedChannel = await prismaClient.joinedChannel.create({
                data: {
                    workspaceId,
                    channelId,
                    channelName,
                    isPrivate: false,
                }
            });

            res.json({ 
                success: true, 
                message: "Successfully joined channel",
                channel: joinedChannel
            });
        } catch (error: any) {
            // Handle specific Slack errors
            let errorMessage = "Failed to join channel in Slack";
            if (error.message?.includes('channel_not_found')) {
                errorMessage = "Channel not found. It may be private or archived.";
            } else if (error.message?.includes('already_in_channel')) {
                errorMessage = "Already a member of this channel";
            } else if (error.message?.includes('access_denied')) {
                errorMessage = "Access denied. The bot may not have permission to join this channel.";
            } else if (error.message) {
                errorMessage = `Slack error: ${error.message}`;
            }
            
            return res.status(500).json({ 
                error: errorMessage,
                details: error.message 
            });
        }
    } catch (error) {
        logger.error("Error joining Slack channel:", error);
        
        // Provide more specific error messages
        let errorMessage = "Failed to join channel";
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                errorMessage = "Authentication failed. Please reconnect your Slack workspace.";
            } else if (error.response?.status === 403) {
                errorMessage = "Permission denied. The bot may not have the required permissions.";
            } else if (error.code === "ECONNREFUSED") {
                errorMessage = "Unable to connect to Slack. Please check your internet connection.";
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
};

const getJoinedChannels = async (req: Request, res: Response) => {
    try {
        const { workspaceId } = req.query;
        
        if (!workspaceId) {
            return res.status(400).json({ error: "Workspace ID is required" });
        }

        // Get joined channels from database
        const joinedChannels = await prismaClient.joinedChannel.findMany({
            where: { workspaceId: workspaceId as string },
            orderBy: { joinedAt: 'desc' }
        });

        res.json({ joinedChannels });
    } catch (error) {
        logger.error("Error fetching joined channels:", error);
        res.status(500).json({ error: "Failed to fetch joined channels" });
    }
};

const sendSlackMessage = async (req: Request, res: Response) => {
    try {
      const { workspaceId, channelId, message } = req.body;
  
      if (!workspaceId || !channelId || !message) {
        return res.status(400).json({
          error: "Workspace ID, channel ID, and message are required",
        });
      }
  
      const slackService = new SlackService(workspaceId);
      
      try {
        const result = await slackService.sendMessage(channelId, message) as any;
        return res.json({
          success: true,
          message: "Message sent successfully",
          timestamp: result.ts,
        });
      } catch (error: any) {
        // Handle "not_in_channel" error by joining first
        if (error.message?.includes('not_in_channel')) {
          await slackService.joinChannel(channelId);
          const result = await slackService.sendMessage(channelId, message) as any;
          return res.json({
            success: true,
            message: "Message sent successfully (after joining channel)",
            timestamp: result.ts,
          });
        }
        throw error;
      }
    } catch (error) {
      logger.error("Error sending Slack message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  };
  

const scheduleSlackMessage = async (req: Request, res: Response) => {
    try {
        const { workspaceId, channelId, channelName, message, scheduledAt } = req.body;

        if (!workspaceId || !channelId || !channelName || !message || !scheduledAt) {
            return res.status(400).json({
                error: "Workspace ID, channel ID, channel name, message, and scheduled time are required",
            });
        }

        // Validate scheduled time is in the future
        const scheduledTime = new Date(scheduledAt);
        const now = new Date();
        
        if (scheduledTime <= now) {
            return res.status(400).json({
                error: "Scheduled time must be in the future",
            });
        }

        // Get workspace from database
        const workspace = await prismaClient.workspace.findUnique({
            where: { workspaceId },
        });

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Create scheduled message
        const scheduledMessage = await prismaClient.scheduledMessage.create({
            data: {
                workspaceId,
                channelId,
                channelName,
                message,
                scheduledAt: scheduledTime,
            },
        });

        res.json({
            success: true,
            message: "Message scheduled successfully",
            scheduledMessage,
        });
    } catch (error) {
        logger.error("Error scheduling Slack message:", error);
        res.status(500).json({ error: "Failed to schedule message" });
    }
};

const getScheduledMessages = async (req: Request, res: Response) => {
    try {
        const { workspaceId } = req.query;

        if (!workspaceId) {
            return res.status(400).json({ error: "Workspace ID is required" });
        }

        // Get workspace from database
        const workspace = await prismaClient.workspace.findUnique({
            where: { workspaceId: workspaceId as string },
        });

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Get scheduled messages
        const scheduledMessages = await prismaClient.scheduledMessage.findMany({
            where: { workspaceId: workspaceId as string },
            orderBy: { scheduledAt: 'asc' },
        });

        res.json({ scheduledMessages });
    } catch (error) {
        logger.error("Error fetching scheduled messages:", error);
        res.status(500).json({ error: "Failed to fetch scheduled messages" });
    }
};

const deleteScheduledMessage = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const { workspaceId } = req.body;

        if (!messageId || !workspaceId) {
            return res.status(400).json({
                error: "Message ID and workspace ID are required",
            });
        }

        // Get workspace from database
        const workspace = await prismaClient.workspace.findUnique({
            where: { workspaceId },
        });

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Delete scheduled message
        const deletedMessage = await prismaClient.scheduledMessage.deleteMany({
            where: {
                id: messageId,
                workspaceId,
            },
        });

        if (deletedMessage.count === 0) {
            return res.status(404).json({ error: "Scheduled message not found" });
        }

        res.json({
            success: true,
            message: "Scheduled message deleted successfully",
        });
    } catch (error) {
        logger.error("Error deleting scheduled message:", error);
        res.status(500).json({ error: "Failed to delete scheduled message" });
    }
};

const getCacheStats = async (req: Request, res: Response) => {
    try {
        const stats = SlackService.getCacheStats();
        res.json({ 
            success: true, 
            cacheStats: stats 
        });
    } catch (error) {
        logger.error("Error getting cache stats:", error);
        res.status(500).json({ error: "Failed to get cache stats" });
    }
};

export {slackAuthInitialise, slackHandleCallback, getSlackChannels, joinSlackChannel, getJoinedChannels, sendSlackMessage, scheduleSlackMessage, getScheduledMessages, deleteScheduledMessage, getCacheStats};