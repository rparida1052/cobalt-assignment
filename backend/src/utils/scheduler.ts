import cron from 'node-cron';
import axios from 'axios';
import logger from './logger';
import prismaClient from './prisma';

// Function to send a scheduled message
const sendScheduledMessage = async (scheduledMessage: any) => {
  try {
    // Set status to 'sending' before attempting to send
    await prismaClient.scheduledMessage.update({
      where: { id: scheduledMessage.id },
      data: { status: 'sending' }
    });

    // Get workspace to get access token
    const workspace = await prismaClient.workspace.findUnique({
      where: { workspaceId: scheduledMessage.workspaceId }
    });

    if (!workspace) {
      logger.error(`Workspace not found for scheduled message ${scheduledMessage.id}`);
      await prismaClient.scheduledMessage.update({
        where: { id: scheduledMessage.id },
        data: { status: 'failed' }
      });
      return;
    }

    // Check if token is expired and refresh if needed
    if (workspace.expiresAt < new Date()) {
      try {
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

        if (refreshResponse.data.ok) {
          await prismaClient.workspace.update({
            where: { workspaceId: scheduledMessage.workspaceId },
            data: {
              accessToken: refreshResponse.data.access_token,
              refreshToken: refreshResponse.data.refresh_token,
              expiresAt: new Date(Date.now() + refreshResponse.data.expires_in * 1000),
            }
          });
          workspace.accessToken = refreshResponse.data.access_token;
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        logger.error("Token refresh failed for scheduled message:", refreshError);
        await prismaClient.scheduledMessage.update({
          where: { id: scheduledMessage.id },
          data: { status: 'failed' }
        });
        return;
      }
    }

    // Send message to Slack
    const messageResponse = await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel: scheduledMessage.channelId,
        text: scheduledMessage.message,
      },
      {
        headers: {
          Authorization: `Bearer ${workspace.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (messageResponse.data.ok) {
      // Update scheduled message as sent
      await prismaClient.scheduledMessage.update({
        where: { id: scheduledMessage.id },
        data: { 
          status: 'sent',
          sentAt: new Date()
        }
      });
      logger.info(`Scheduled message ${scheduledMessage.id} sent successfully`);
    } else {
      // If bot is not in channel, try to join and resend
      if (messageResponse.data.error === "not_in_channel") {
        try {
          await axios.post(
            "https://slack.com/api/conversations.join",
            { channel: scheduledMessage.channelId },
            {
              headers: {
                Authorization: `Bearer ${workspace.accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          // Retry sending the message
          const retryResponse = await axios.post(
            "https://slack.com/api/chat.postMessage",
            {
              channel: scheduledMessage.channelId,
              text: scheduledMessage.message,
            },
            {
              headers: {
                Authorization: `Bearer ${workspace.accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (retryResponse.data.ok) {
            await prismaClient.scheduledMessage.update({
              where: { id: scheduledMessage.id },
              data: { 
                status: 'sent',
                sentAt: new Date()
              }
            });
            logger.info(`Scheduled message ${scheduledMessage.id} sent successfully after joining channel`);
          } else {
            throw new Error(`Failed to send message: ${retryResponse.data.error}`);
          }
        } catch (joinError) {
          logger.error("Failed to join channel for scheduled message:", joinError);
          await prismaClient.scheduledMessage.update({
            where: { id: scheduledMessage.id },
            data: { status: 'failed' }
          });
        }
      } else {
        throw new Error(`Failed to send message: ${messageResponse.data.error}`);
      }
    }
  } catch (error) {
    logger.error(`Error sending scheduled message ${scheduledMessage.id}:`, error);
    await prismaClient.scheduledMessage.update({
      where: { id: scheduledMessage.id },
      data: { status: 'failed' }
    });
  }
};

// Function to check and send scheduled messages
const checkScheduledMessages = async () => {
  try {
    const now = new Date();
    
    // Get all pending scheduled messages that are due
    const pendingMessages = await prismaClient.scheduledMessage.findMany({
      where: {
        status: 'pending',
        scheduledAt: {
          lte: now
        }
      }
    });

    logger.info(`Found ${pendingMessages.length} scheduled messages to send`);

    // Send each message
    for (const message of pendingMessages) {
      await sendScheduledMessage(message);
    }
  } catch (error) {
    logger.error('Error checking scheduled messages:', error);
  }
};

// Initialize the scheduler
const initializeScheduler = () => {
  // Check for scheduled messages every minute
  cron.schedule('* * * * *', checkScheduledMessages);
  
  logger.info('Scheduler initialized - checking for scheduled messages every minute');
};

export { initializeScheduler, checkScheduledMessages }; 
