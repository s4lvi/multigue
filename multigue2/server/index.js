// index.js

import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import WorldManager from "./worldManager.js";
import { CHUNK_SIZE, LAYERS } from "../shared/constants.js";
import { fileURLToPath } from "url";

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

const worldManager = new WorldManager(CHUNK_SIZE, LAYERS);

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Handle player initialization
  socket.on("initPlayer", (playerName) => {
    if (worldManager.isNameTaken(playerName)) {
      socket.emit(
        "nameError",
        "Name is already taken. Please choose another one."
      );
    } else {
      const player = worldManager.addPlayer(socket.id, playerName);
      socket.player = player; // Store player object in socket
      socket.emit("initPlayer", [socket.id, worldManager.players]);
      socket.broadcast.emit("playerConnected", worldManager.players[socket.id]);
      socket.emit("worldData", worldManager.getWorldChunk(player.position));

      io.emit("chatMessage", {
        message: `Player ${playerName} connected`,
        timestamp: Date.now(),
      });
      socket.emit("chatMessage", {
        message: "Welcome to MULTIGUE",
        timestamp: Date.now(),
      });
    }
  });

  // Handle incoming chat messages
  socket.on("chatMessage", (message) => {
    if (!socket.player) return; // Ensure player is initialized
    io.emit("chatMessage", {
      player: socket.player.name,
      message: message,
      timestamp: Date.now(),
    });
  });

  // Handle player movement requests
  socket.on("moveRequest", (direction) => {
    if (!socket.player) return; // Ensure player is initialized
    const updatedPosition = worldManager.movePlayer(socket.id, direction);
    socket.player.position = updatedPosition;
    io.emit("updatePosition", {
      player: socket.player.id,
      position: updatedPosition,
    });
  });

  // Handle player interaction requests
  socket.on("interactRequest", (targetPos) => {
    if (!socket.player) return; // Ensure player is initialized
    const result = worldManager.handleInteraction(socket.id, targetPos);
    if (result.type === "attack") {
      io.emit("chatMessage", {
        message: result.message,
        timestamp: Date.now(),
      });
      io.emit("entityUpdate", {
        type: "player",
        target: result.target,
        stat: "hp",
        value: -5,
      });
    } else {
      io.emit("interactionResult", result);
      io.emit("worldData", worldManager.getWorldChunk(socket.player.position));
    }
  });

  // Handle player disconnection
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    io.emit("playerDisconnected", socket.id);
    if (worldManager.players[socket.id]) {
      io.emit("chatMessage", {
        message: `Player ${worldManager.players[socket.id].name} disconnected`,
        timestamp: Date.now(),
      });
      worldManager.removePlayer(socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
