// Backend configuration
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// API endpoints
export const API_ENDPOINTS = {
  SLACK_AUTH: `${BACKEND_URL}/auth/slack`,
  SLACK_CALLBACK: `${BACKEND_URL}/auth/slack/callback`,
  SLACK_CHANNELS: `${BACKEND_URL}/auth/slack/channels`,
  SLACK_JOIN_CHANNEL: `${BACKEND_URL}/auth/slack/join-channel`,
  SLACK_JOINED_CHANNELS: `${BACKEND_URL}/auth/slack/joined-channels`,
  SLACK_SEND_MESSAGE: `${BACKEND_URL}/auth/slack/send-message`,
  SLACK_SCHEDULE_MESSAGE: `${BACKEND_URL}/auth/slack/schedule-message`,
  SLACK_SCHEDULED_MESSAGES: `${BACKEND_URL}/auth/slack/scheduled-messages`,
  SLACK_DELETE_SCHEDULED_MESSAGE: `${BACKEND_URL}/auth/slack/scheduled-messages`,
} as const;

// Environment check
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Check if using ngrok
export const isUsingNgrok = BACKEND_URL.includes('ngrok');

// Log the backend URL in development for debugging
if (isDevelopment) {
  console.log('Backend URL:', BACKEND_URL);
  console.log('Using ngrok:', isUsingNgrok);
  console.log('API Endpoints:', API_ENDPOINTS);
} 