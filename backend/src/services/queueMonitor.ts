import { messageQueue } from './messageQueue';
import logger from '../utils/logger';

export class QueueMonitor {
  static async getQueueStats() {
    try {
      const [
        waiting,
        active,
        completed,
        failed,
        delayed
      ] = await Promise.all([
        messageQueue.getWaiting(),
        messageQueue.getActive(),
        messageQueue.getCompleted(),
        messageQueue.getFailed(),
        messageQueue.getDelayed()
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + delayed.length
      };
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      throw error;
    }
  }

  // Get failed jobs
  static async getFailedJobs(limit = 10) {
    try {
      const failedJobs = await messageQueue.getFailed(0, limit);
      return failedJobs.map(job => ({
        id: job.id,
        data: job.data,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
        attemptsMade: job.attemptsMade
      }));
    } catch (error) {
      logger.error('Error getting failed jobs:', error);
      throw error;
    }
  }

  // Retry a failed job if it fails
  static async retryFailedJob(jobId: string) {
    try {
      const job = await messageQueue.getJob(jobId);
      if (job) {
        await job.retry();
        return { success: true, message: 'Job retried successfully' };
      }
      return { success: false, message: 'Job not found' };
    } catch (error) {
      logger.error('Error retrying job:', error);
      throw error;
    }
  }

  // Get job details
  static async getJobDetails(jobId: string) {
    try {
      const job = await messageQueue.getJob(jobId);
      if (!job) {
        return null;
      }

      return {
        id: job.id,
        data: job.data,
        status: await job.getState(),
        timestamp: job.timestamp,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        progress: job.progress,
        delay: job.delay,
        priority: job.priority
      };
    } catch (error) {
      logger.error('Error getting job details:', error);
      throw error;
    }
  }

  // Clear completed jobs
  static async clearCompletedJobs() {
    try {
      await messageQueue.clean(0, 1000, 'completed');
      return { success: true, message: 'Completed jobs cleared' };
    } catch (error) {
      logger.error('Error clearing completed jobs:', error);
      throw error;
    }
  }

  // Clear failed jobs
  static async clearFailedJobs() {
    try {
      await messageQueue.clean(0, 1000, 'failed');
      return { success: true, message: 'Failed jobs cleared' };
    } catch (error) {
      logger.error('Error clearing failed jobs:', error);
      throw error;
    }
  }

  // Pause queue
  static async pauseQueue() {
    try {
      await messageQueue.pause();
      return { success: true, message: 'Queue paused' };
    } catch (error) {
      logger.error('Error pausing queue:', error);
      throw error;
    }
  }

  // Resume queue
  static async resumeQueue() {
    try {
      await messageQueue.resume();
      return { success: true, message: 'Queue resumed' };
    } catch (error) {
      logger.error('Error resuming queue:', error);
      throw error;
    }
  }
}
