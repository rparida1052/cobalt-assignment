import dotenv from "dotenv";
import { app } from "./app";
import { gracefulShutdown } from "./services/messageQueue";
import logger from "./utils/logger";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Initialize queue system
  logger.info('Queue system ready');
  
  // Graceful shutdown handling
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await gracefulShutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await gracefulShutdown();
    process.exit(0);
  });
});