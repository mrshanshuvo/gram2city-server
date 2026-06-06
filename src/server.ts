import app from "./app";
import { createServer } from "http";
import { initSocket } from "./socket";
import { initDB } from "./db";

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Initialize Real-time Engine
initSocket(httpServer);

// Initialize Database Indexes
initDB();

httpServer.listen(PORT, () => {
  console.log(
    `🚀 Gram2City Real-time Engine running on http://localhost:${PORT}`,
  );
});
