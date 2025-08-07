import Redis from 'ioredis';
import logger from './logger';

// Valkey service URI
const serviceUri = process.env.VALKEY_URI!;

const redis = new Redis(serviceUri, {
  maxRetriesPerRequest: null, 
  lazyConnect: true,
  keepAlive: 30000,
  tls: {
    rejectUnauthorized: false
  }
});

redis.on('error', (error) => {
  logger.error('Valkey connection error:', error);
});

redis.on('connect', () => {
  logger.info('Connected to Valkey');
});

redis.on('ready', () => {
  logger.info('Valkey connection ready');
});

redis.on('close', () => {
  logger.warn('Valkey connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Reconnecting to Valkey...');
});

export default redis;
