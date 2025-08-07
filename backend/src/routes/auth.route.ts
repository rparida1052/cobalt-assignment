import {Router} from "express";
import { slackAuthInitialise, slackHandleCallback, getSlackChannels, joinSlackChannel, getJoinedChannels, sendSlackMessage, scheduleSlackMessage, getScheduledMessages, deleteScheduledMessage, getCacheStats, getQueueStats, getFailedJobs, retryFailedJob, getJobDetails, clearCompletedJobs, clearFailedJobs, pauseQueue, resumeQueue } from "../controllers/auth.controller";
import prismaClient from "../utils/prisma";

const authRouter = Router();

authRouter.get("/slack", slackAuthInitialise)
authRouter.get("/slack/callback", slackHandleCallback)
authRouter.get("/slack/channels", getSlackChannels)
authRouter.post("/slack/join-channel", joinSlackChannel)
authRouter.get("/slack/joined-channels", getJoinedChannels)
authRouter.post("/slack/send-message", sendSlackMessage)
authRouter.post("/slack/schedule-message", scheduleSlackMessage)
authRouter.get("/slack/scheduled-messages", getScheduledMessages)
authRouter.delete("/slack/scheduled-messages/:messageId", deleteScheduledMessage)
authRouter.get("/slack/cache-stats", getCacheStats)

// Queue monitoring routes
authRouter.get("/slack/queue-stats", getQueueStats)
authRouter.get("/slack/failed-jobs", getFailedJobs)
authRouter.post("/slack/retry-job/:jobId", retryFailedJob)
authRouter.get("/slack/job/:jobId", getJobDetails)
authRouter.delete("/slack/clear-completed-jobs", clearCompletedJobs)
authRouter.delete("/slack/clear-failed-jobs", clearFailedJobs)
authRouter.post("/slack/pause-queue", pauseQueue)
authRouter.post("/slack/resume-queue", resumeQueue)

export default authRouter;
