import { Router } from "express";
import {
  slackAuthInitialise,
  slackHandleCallback,
  getSlackChannels,
  joinSlackChannel,
  getJoinedChannels,
  sendSlackMessage,
  scheduleSlackMessage,
  getScheduledMessages,
  deleteScheduledMessage,
  getCacheStats,
} from "../controllers/auth.controller";

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

export default authRouter;
