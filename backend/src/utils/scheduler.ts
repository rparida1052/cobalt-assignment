import cron from 'node-cron';
import axios from 'axios';
import logger from './logger';
import prismaClient from './prisma';
import { tokenCache } from './tokenCache';

// Function to send a scheduled message
const sendScheduledMessage = async (scheduledMessage: any) => {
  try {
    // Set status to 'sending' before attempting to send
    await prismaClient.scheduledMessage.update({
      where: { id: scheduledMessage.id },
      data: { status: 'sending' }
    });

    // Get cached token (automatically refreshes if needed)
    const accessToken = await tokenCache.getValidToken(scheduledMessage.workspaceId);

    // Send message to Slack
    const messageResponse = await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel: scheduledMessage.channelId,
        text: scheduledMessage.message,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
                Authorization: `Bearer ${accessToken}`,
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
                Authorization: `Bearer ${accessToken}`,
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
