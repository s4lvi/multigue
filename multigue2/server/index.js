const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const WorldManager = require("./worldManager");
const { CHUNK_SIZE, LAYERS } = require("../shared/constants");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
// Serve static files from the /client directory
app.use(express.static(path.join(__dirname, "..", "client")));

const worldManager = new WorldManager(CHUNK_SIZE, LAYERS);

io.on("connection", (socket) => {
  let player;
  console.log(`Player connected: ${socket.id}`);
  socket.on("chatMessage", (message) => {
    io.emit("chatMessage", {
      player: player.name,
      message: message,
      timestamp: Date.now(),
    });
  });
  socket.on("initPlayer", (playerName) => {
    if (worldManager.isNameTaken(playerName)) {
      socket.emit(
        "nameError",
        "Name is already taken. Please choose another one."
      );
    } else {
      player = worldManager.addPlayer(socket.id, playerName);
      socket.emit("initPlayer", [socket.id, worldManager.players]);
      socket.broadcast.emit("playerConnected", worldManager.players[socket.id]);
      socket.emit("worldData", worldManager.getWorldChunk(player.position));

      io.emit("chatMessage", {
        message: "player " + playerName + " connected",
        timestamp: Date.now(),
      });
      socket.emit("chatMessage", {
        message: "welcome to MULTIGUE",
        timestamp: Date.now(),
      });
    }
  });

  socket.on("moveRequest", (direction) => {
    const updatedPosition = worldManager.movePlayer(socket.id, direction);
    player.position = updatedPosition;
    io.emit("updatePosition", { player: player.id, position: updatedPosition });
  });

  socket.on("interactRequest", (targetPos) => {
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
      io.emit("worldData", worldManager.getWorldChunk(player.position));
    }
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    io.emit("playerDisconnected", socket.id);
    if (worldManager.players[socket.id]) {
      io.emit("chatMessage", {
        message:
          "player " + worldManager.players[socket.id].name + " disconnected",
        timestamp: Date.now(),
      });
    }
    worldManager.removePlayer(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
