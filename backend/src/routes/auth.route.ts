import {Router} from "express";
import { slackAuthInitialise, slackHandleCallback, getSlackChannels, joinSlackChannel, getJoinedChannels, sendSlackMessage } from "../controllers/auth.controller";
import prismaClient from "../utils/prisma";

const authRouter = Router();

authRouter.get("/slack", slackAuthInitialise)
authRouter.get("/slack/callback", slackHandleCallback)
authRouter.get("/slack/channels", getSlackChannels)
authRouter.post("/slack/join-channel", joinSlackChannel)
authRouter.get("/slack/joined-channels", getJoinedChannels)
authRouter.post("/slack/send-message", sendSlackMessage)

export default authRouter;
