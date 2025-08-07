import { Queue, Worker, Job } from 'bullmq';
import redis from '../utils/valkey';
import { SlackService } from './slackService';
import logger from '../utils/logger';
import prismaClient from '../utils/prisma';

// Create the queue
export const messageQueue = new Queue('scheduled-messages', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,           // Retry 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,         // Start with 2 seconds
    },
  },
});

// Worker to process messages
export const messageWorker = new Worker('scheduled-messages', async (job: Job) => {
  const { messageId, workspaceId, channelId, message } = job.data;
  
  logger.info(`Processing scheduled message ${messageId}`);
  
  try {
    // Update status to sending
    await prismaClient.scheduledMessage.update({
      where: { id: messageId },
      data: { status: 'sending' }
    });

    // Create Slack service instance
    const slackService = new SlackService(workspaceId);

    // Send the message
    await slackService.sendMessage(channelId, message);

    // Update status to sent
    await prismaClient.scheduledMessage.update({
      where: { id: messageId },
      data: { 
        status: 'sent',
        sentAt: new Date()
      }
    });

    logger.info(`Message ${messageId} sent successfully`);
    return { success: true };
    
  } catch (error) {
    logger.error(`Failed to send message ${messageId}:`, error);
    
    // Update status to failed
    await prismaClient.scheduledMessage.update({
      where: { id: messageId },
      data: { 
        status: 'failed'
      }
    });
    
    throw error; // This will trigger retry
  }
}, {
  connection: redis,
  concurrency: 10, // Process 10 jobs concurrently
  limiter: {
    max: 50,       // Max 50 jobs per time window
    duration: 1000  // Per second
  }
});

// Worker event handlers
messageWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

messageWorker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Job ${job.id} failed:`, err.message);
  } else {
    logger.error('Job failed:', err.message);
  }
});

messageWorker.on('error', (err) => {
  logger.error('Worker error:', err);
});

// Graceful shutdown function
export const gracefulShutdown = async () => {
  logger.info('Shutting down queue system gracefully...');
  await messageWorker.close();
  await messageQueue.close();
  await redis.quit();
  logger.info('Queue system shutdown complete');
};
