import {Router} from "express";
import { slackAuthInitialise, slackHandleCallback, getSlackChannels, joinSlackChannel, getJoinedChannels, sendSlackMessage, scheduleSlackMessage, getScheduledMessages, deleteScheduledMessage } from "../controllers/auth.controller";
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

export default authRouter;
