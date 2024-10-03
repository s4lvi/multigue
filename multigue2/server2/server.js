// server.js
import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

import playerController from "./controllers/playerController.js";
import worldController from "./controllers/worldController.js";
import interactionController from "./controllers/interactionController.js";
import logger from "./utils/logger.js";
import WorldManager from "./worldManager.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Reconstruct __dirname in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the /client and /shared directories
app.use(express.static(path.join(__dirname, "..", "client")));
app.use("/shared", express.static(path.join(__dirname, "..", "shared")));

// Initialize WorldManager
WorldManager.initialize();

io.on("connection", (socket) => {
  logger.log(`Player connected: ${socket.id}`);

  socket.on("initPlayer", (playerName) => {
    playerController.initPlayer(socket, playerName);
  });

  socket.on("chatMessage", (message) => {
    playerController.handleChatMessage(socket, message);
  });

  socket.on("moveRequest", (direction) => {
    playerController.handleMoveRequest(socket, direction);
  });

  socket.on("interactRequest", (interactionRequest) => {
    interactionController.handleInteractRequest(socket, interactionRequest);
  });

  socket.on("disconnect", () => {
    playerController.handleDisconnect(socket);
  });
});

server.listen(PORT, () => {
  logger.log(`Server is running on port ${PORT}`);
});

export { io };
