# Slack Integration Platform

A full-stack application that enables seamless Slack workspace integration with direct messaging and message scheduling capabilities. Built with React, TypeScript, Node.js, Express and Prisma.

## Demo Of The Application


<p align="center">
  <a href="https://youtu.be/LuE3jXH4ZA8">
    <img src="https://i9.ytimg.com/vi_webp/LuE3jXH4ZA8/mqdefault.webp?v=6895d23d&sqp=CKij18QG&rs=AOn4CLAXdubOsYlFQ4dSwIFjcRMbN7OKkg" alt="Assignemnet Demo" />
  </a>
</p>
##  Features

## OAuth Authentication
- Secure Slack OAuth 2.0 integration
- Automatic token refresh handling
- Workspace management and persistence

##  Direct Message Sending
- Send messages to any Slack channel instantly
- Support for both public and private channels

## Message Scheduling
- Schedule messages to be sent at specific dates and times
- View all scheduled messages with their status
- Delete pending scheduled messages before they're sent
- Automatic message delivery using background scheduler


### Note: Please invite the bot to you channel before sending the message .


##  Architecture Overview

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Slack API     │
│   (React)       │◄──►│(Node.js,Express)│◄──►│   (OAuth/Chat)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │      |              
         │                       │      |               
         ▼                       ▼      └---------------┐
┌─────────────────┐    ┌─────────────────┐              │
│   LocalStorage  │    │   SQLite DB     │              │
│   (User State)  │    │   (Prisma)      │              │
└─────────────────┘    └─────────────────┘              │
                                                        │
                                                        │
                        ┌─────────────────┐             │
                        │   Queue Service │◄────────────┘
                        │   (BullMQ)      │
                        │   - Job Queue   │
                        │   - Delayed Jobs│
                        └─────────────────┘
```

### Data Flow

1. **Authentication Flow**
   ```
   User → Frontend → Backend → Slack OAuth → Database → Frontend Dashboard
   ```

2. **Direct Messaging Flow**
   ```
   User Input → Backend → Slack API → Channel 
   ```

3. **Message Scheduling Flow**
   ```
   User Input → Backend → Database → Queue Service → Scheduled Job → Slack API → Channel
   ```

4. **Queue Processing Flow**
   ```
   BullMQ Queue → Job Worker → Token Refresh → Slack API → Status Update In DB
   ```

### Key Components

#### Backend 
- **Express.js Server**: RESTful API endpoints
- **Prisma ORM**: Database management with SQLite
- **BullMQ**: Job queue for scheduled message processing
- **Queue Workers**: Process scheduled message jobs
- **Token Cache**: Automatic token refresh management
- **Slack Service**: API integration layer

#### Frontend 
- **React 19**: Modern UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn UI**: Accessible component library
- **React Router**: Client-side routing

##  Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v8 or higher)
- **Git**
- **ngrok** (for HTTPS URL - required by Slack OAuth)

##  Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/rparida1052/refold-assignment.git
cd refold-assignment
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
pnpm install
```

#### Environment Configuration
Create a `.env` file in the `backend` directory:

```env
# Slack Configuration
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# Use ngrok URL for OAuth (required by Slack)
SLACK_REDIRECT_URI=https://your-ngrok-url.ngrok.io/auth/slack/callback

# Database
DATABASE_URL="file:./dev.db"

# Queue Service (Redis)
VALKEY_URI=redis://localhost:6379 or get a hosted one

# Server Configuration
PORT=8000
FRONTEND_URL=https://your-ngrok-url.ngrok.io
```

#### Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) View database in Prisma Studio
npx prisma studio
```

#### Queue Service Setup (Redis)
```bash
# Install Redis (macOS)
brew install redis

# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Start Redis server
redis-server

# Test Redis connection
redis-cli ping
```

#### Start Backend Server
```bash
# Development mode
pnpm run dev

# Production mode
pnpm build
pnpm start
```

#### Using ngrok for HTTPS URL (Required for Slack OAuth)
```bash
# Install ngrok
npm install -g ngrok

# Start your backend server first
pnpm run dev

# In a new terminal, expose your local server
ngrok http 8000

# You'll get a URL like: https://abc123.ngrok.io
# Update your .env file with this URL:
# SLACK_REDIRECT_URI=https://abc123.ngrok.io/auth/slack/callback
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
pnpm install
```

#### Start Development Server
```bash
pnpm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. Slack App Configuration

#### Create a Slack App
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Enter app name and select workspace

#### Configure OAuth Settings
1. Navigate to "OAuth & Permissions" in the sidebar
2. Add the following OAuth scopes:
   - `channels:read`
   - `chat:write`
   - `users:read`
   - `groups:read`
3. Set redirect URI: `https://your-ngrok-url.ngrok.io/auth/slack/callback`
   - **Important**: Use your ngrok HTTPS URL, not localhost
   - Free ngrok URLs change on restart - update this when needed

#### Install App to Workspace
1. Go to "Install App" in the sidebar
2. Click "Install to Workspace"
3. Copy the **Client ID** and **Client Secret**

#### Update Environment Variables
Update your `backend/.env` file with the copied credentials.

##  Database Schema

### Core Tables

#### Workspace
Stores Slack workspace authentication data:
```sql
- id: String (Primary Key)
- workspaceId: String (Unique)
- workspaceName: String
- accessToken: String
- refreshToken: String
- expiresAt: DateTime
- botUserId: String
- authedUserId: String
```

#### ScheduledMessage
Manages scheduled messages:
```sql
- id: String (Primary Key)
- workspaceId: String (Foreign Key)
- channelId: String
- channelName: String
- message: String
- scheduledAt: DateTime
- sentAt: DateTime (Nullable)
- status: String (pending/sending/sent/failed)
```

#### JoinedChannel
Tracks channels the bot has joined:
```sql
- id: String (Primary Key)
- workspaceId: String (Foreign Key)
- channelId: String
- channelName: String
- isPrivate: Boolean
- joinedAt: DateTime
```

##  API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/slack` | GET | Initiate Slack OAuth |
| `/auth/slack/callback` | GET | Handle OAuth callback |

### Messaging
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/slack/channels` | GET | Get available channels |
| `/auth/slack/send-message` | POST | Send message to channel |
| `/auth/slack/join-channel` | POST | Join a channel |

### Scheduling
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/slack/schedule-message` | POST | Schedule message for later |
| `/auth/slack/scheduled-messages` | GET | Get scheduled messages |
| `/auth/slack/scheduled-messages/:id` | DELETE | Delete scheduled message |

### Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/slack/joined-channels` | GET | Get joined channels |
| `/auth/slack/cache-stats` | GET | Get token cache statistics |

## 🔧 How It Works

### OAuth Flow
1. **User clicks "Connect to Slack"**
2. **Backend redirects to Slack OAuth**
3. **Slack returns authorization code**
4. **Backend exchanges code for tokens**
5. **Tokens stored in database**
6. **User redirected to dashboard**

### Direct Messaging
1. **User selects channel from dropdown**
2. **User enters message and clicks send**
3. **Backend attempts to send message directly**
4. **If bot not in channel, automatically joins**
5. **Message sent and success confirmed**

### Message Scheduling
1. **User selects channel and enters message**
2. **User sets date and time for delivery**
3. **Message saved to database with 'pending' status**
4. **Delayed job created in BullMQ with scheduled time**
5. **BullMQ automatically processes job at scheduled time**
6. **Queue worker handles job execution**
7. **Token refreshed automatically before sending**
8. **Message sent to Slack API**
9. **Status updated to 'sent' or 'failed'**
10. **Retry logic handles temporary failures**

### Token Management
- **Automatic Refresh**: Tokens refreshed before expiration
- **Caching**: Valid tokens cached in memory
- **Error Handling**: Graceful fallback on token errors

### Queue Service Architecture
- **BullMQ Integration**: Redis-based job queue for reliable message processing
- **Delayed Jobs**: Messages scheduled with specific delay times using BullMQ
- **Worker Processing**: Dedicated workers handle message delivery
- **Automatic Processing**: BullMQ automatically triggers jobs at scheduled times
- **Retry Logic**: Automatic retry on failed message delivery
- **Status Tracking**: Real-time job status updates in database

## 🐛 Troubleshooting

### Common Issues

#### 1. "Authentication failed"
**Cause**: OAuth configuration issues
**Solution**:
- Verify Slack app credentials in `.env`
- Check OAuth redirect URI matches exactly
- Ensure app is installed to workspace

#### 2. Database errors
**Cause**: Prisma setup issues
**Solution**:
```bash
cd backend
npx prisma generate
npx prisma migrate reset
npx prisma migrate dev
```

#### 3. Scheduled messages not sending
**Cause**: Queue service or scheduler issues
**Solution**:
- Check Redis connection: `redis-cli ping`
- Verify queue workers are running
- Check backend logs for queue errors
- Ensure scheduled time is in the future

#### 4. Queue service connection errors
**Cause**: Redis connection issues
**Solution**:
- Ensure Redis server is running: `redis-server`
- Check VALKEY_URI in environment variables
- Verify Redis port (default: 6379) is accessible
- Restart queue workers after Redis restart


## 🚀 Deployment

### Backend Deployment
```bash
# Build the application
cd backend
pnpm build

# Set production environment variables
export NODE_ENV=production
export DATABASE_URL="your_production_database_url"

# Start the server
pnpm start
```

### Frontend Deployment
```bash
# Build the application
cd frontend
pnpm run build

# Deploy the dist/ folder to your hosting service
# (Netlify, Vercel)
```

### Environment Variables for Production
```env
# Backend
NODE_ENV=production
SLACK_CLIENT_ID=your_production_client_id
SLACK_CLIENT_SECRET=your_production_client_secret
SLACK_REDIRECT_URI=https://yourdomain.com/auth/slack/callback
DATABASE_URL=your_production_database_url
FRONTEND_URL=https://yourdomain.com

# Frontend
VITE_API_BASE_URL=https://your-backend-domain.com
```

##  Performance & Scalability

### Current Architecture Benefits
- **Stateless API**: Easy horizontal scaling
- **Queue-Based Processing**: Reliable message scheduling with BullMQ
- **Background Workers**: Non-blocking message delivery
- **Token Caching (In Memory )**: Reduced API calls to Slack

### Potential Improvements
- **Redis Integration**: For better token caching
- **Message Queues**: For high-volume message processing
- **Load Balancing**: For multiple backend instances
- **Monitoring**: Application performance tracking

