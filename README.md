# Slack OAuth Integration with Direct Messaging

A full-stack application that allows users to authenticate with Slack and send messages directly to channels without requiring manual channel joining.

## 🚀 Features

### ✅ Direct Message Sending
- Send messages to any channel without manually joining first
- Automatic channel joining when needed
- Support for both public and private channels
- Real-time error handling and user feedback

### ✅ Improved Error Handling
- Detailed error messages for better debugging
- Automatic token refresh handling
- Graceful handling of Slack API errors
- User-friendly error messages

### ✅ Modern UI/UX
- Clean, responsive design
- Loading states and success/error feedback
- Channel selection with member counts
- Troubleshooting guide included

## 🛠️ Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd refold-assignment
```

### 2. Backend Setup
```bash
# Run the setup script
./setup-env.sh

# Or manually create backend/.env with the required variables
# See setup-backend.md for details

# Install dependencies and setup database
cd backend
pnpm install
npx prisma generate
npx prisma migrate dev
pnpm run dev
```

### 3. Frontend Setup
```bash
cd frontend
pnpm install
pnpm run dev
```

### 4. Slack App Configuration
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app
3. Add OAuth scopes: `channels:read`, `chat:write`, `users:read`, `groups:read`
4. Set redirect URI: `http://localhost:8000/auth/slack/callback`
5. Update `backend/.env` with your Client ID and Secret

## 📁 Project Structure

```
refold-assignment/
├── backend/
│   ├── src/
│   │   ├── controllers/auth.controller.ts  # Slack API handlers
│   │   ├── routes/auth.route.ts           # API routes
│   │   └── app.ts                         # Express app setup
│   ├── prisma/
│   │   └── schema.prisma                  # Database schema
│   └── .env                               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── DirectSlackMessaging.tsx  # Main messaging component
│   │   ├── pages/
│   │   │   └── Dashboard.tsx             # Dashboard page
│   │   └── config.ts                      # API configuration
│   └── package.json
└── setup-backend.md                       # Detailed setup guide
```

## 🔧 How It Works

### Direct Messaging Flow
1. **Channel Selection**: User selects a channel from the dropdown
2. **Message Input**: User enters their message
3. **Direct Send**: System attempts to send message directly
4. **Auto-Join**: If needed, bot automatically joins the channel
5. **Success**: Message is sent and user gets confirmation

### Error Handling
- **Authentication Errors**: Clear messages about reconnecting
- **Permission Errors**: Guidance on Slack app permissions
- **Channel Errors**: Specific messages for private/archived channels
- **Network Errors**: Connection troubleshooting tips

## 🐛 Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Reconnect your Slack workspace
   - Check your Slack app permissions

2. **"Permission denied"**
   - Ensure your Slack app has `chat:write` scope
   - For private channels, invite the bot first

3. **"Channel not found"**
   - Channel may be private or archived
   - Try a different channel

4. **Database errors**
   - Run `npx prisma generate` in backend directory
   - Check your `DATABASE_URL` in `.env`

### Testing
```bash
# Test backend endpoints
cd backend
node test-api.js

# Test frontend
cd frontend
pnpm run dev
```

## 🔄 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/slack` | GET | Initiate Slack OAuth |
| `/auth/slack/callback` | GET | Handle OAuth callback |
| `/auth/slack/channels` | GET | Get available channels |
| `/auth/slack/send-message` | POST | Send message to channel |
| `/auth/slack/joined-channels` | GET | Get joined channels |
| `/auth/slack/join-channel` | POST | Join a channel |

## 🎯 Key Improvements

### Before (Channel Joining Issues)
- Required manual channel joining
- Complex state management
- Limited error feedback
- Database dependency issues

### After (Direct Messaging)
- ✅ Direct message sending
- ✅ Automatic channel joining
- ✅ Better error handling
- ✅ Simplified user experience
- ✅ Robust error messages

## 📝 Environment Variables

### Backend (.env)
```env
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=http://localhost:8000/auth/slack/callback
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/slack_oauth_db
PORT=8000
```

## 🚀 Deployment

### Backend
```bash
cd backend
pnpm build
pnpm start
```

### Frontend
```bash
cd frontend
pnpm build
# Deploy dist/ folder to your hosting service
```

## 📄 License

This project is for educational purposes. Make sure to follow Slack's API terms of service when using this integration. 