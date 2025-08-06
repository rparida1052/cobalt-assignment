import express, { Express } from "express";
import cors from "cors";
import axios from "axios";

const app: Express = express();
app.use(
  cors({
    origin: "*", 
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

app.get("/auth/slack",(req,res)=>{
  const scopes = 'channels:read,chat:write,users:read';
  res.redirect(`https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${scopes}&user_scope=${scopes}&redirect_uri=${process.env.SLACK_REDIRECT_URI}`);
})

app.get("/auth/slack/callback", async(req, res) => {
  const { code } = req.query;
  try {
    console.log("Received Slack OAuth code:", code);

    // STEP 1: Exchange code for token
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
      return res.status(500).send("Error from Slack: " + token.error);
    }

    // STEP 2: Extract tokens
    const botAccessToken = token.access_token;
    const refreshToken = token.refresh_token;
    const expiresIn = token.expires_in; // in seconds

    const workspaceId = token.team.id;
    const authedUserId = token.authed_user.id;

    console.log("Slack OAuth success:", {
      botAccessToken,
      refreshToken,
      expiresIn,
      workspaceId,
      authedUserId,
    });

    // OPTIONAL: Save to DB (example)
    // await saveTokenToDB({ workspaceId, botAccessToken, refreshToken, expiresAt: Date.now() + expiresIn * 1000 });

    // STEP 3: Fetch channels using bot token
    const channelResponse = await axios.get("https://slack.com/api/conversations.list", {
      headers: {
        Authorization: `Bearer ${botAccessToken}`,
      },
    });

    if (channelResponse.data.ok) {
      const channels = channelResponse.data.channels.map((ch: any) => ch.name).join(", ");
      res.send(
        `✅ Slack OAuth successful!<br><br>
         🔐 Access Token: ${botAccessToken}<br>
         🔄 Refresh Token: ${refreshToken}<br>
         ⏱️ Expires In: ${expiresIn} seconds<br>
         📺 Channels: ${channels}`
      );
    } else {
      res.status(500).send("Failed to fetch channels: " + channelResponse.data.error);
    }
  } catch (err) {
    console.error("Slack OAuth callback error:", err);
    res.status(500).send("OAuth Callback Error");
  }
});
export { app };
