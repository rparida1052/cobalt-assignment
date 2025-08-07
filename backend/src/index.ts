import dotenv from "dotenv";
import { app } from "./app";
import { initializeScheduler } from "./utils/scheduler";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Initialize the scheduler for scheduled messages
  initializeScheduler();
});