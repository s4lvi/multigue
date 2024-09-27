// server.js

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const World = require("./world");
const Item = require("./models/item");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, "..", "client")));

// Initialize the game world
const world = new World();

// Handle player connections
io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Handle player joining the game
  socket.on("playerJoined", (data) => {
    const playerName = data.name || "Anonymous";
    const player = world.addPlayer(socket.id, playerName);
    console.log(
      `Player ${player.name} (${player.id}) initialized at (${player.x}, ${player.y})`
    );

    // Notify all clients about the new player
    io.emit("chatMessage", { text: `${player.name} has joined the server` });
    socket.emit("currentPlayers", world.players);
    socket.emit("dungeonData", world.dungeon);
    socket.emit("monstersData", world.monsters); // Send monsters data
    socket.emit("itemsData", world.items); // Send items data
    socket.emit("chestsData", world.chests); // Send chests data
    socket.broadcast.emit("newPlayer", player);
  });

  socket.on("chatMessage", (data) => {
    const player = world.players[socket.id];
    if (player) {
      const message = {
        text: `${player.name}: ${data.text}`,
        type: "player",
      };
      // Broadcast the message to all clients
      io.emit("chatMessage", message);
    }
  });

  // Handle player movement
  socket.on("playerMovement", (movementData, callback) => {
    const player = world.players[socket.id];
    if (player) {
      const { x, y } = movementData;
      // Validate movement
      if (isValidMovement(x, y)) {
        player.move(Math.floor(x), Math.floor(y));
        socket.broadcast.emit("playerMoved", player);
        if (typeof callback === "function") {
          callback({ status: "ok" });
        }
      } else {
        if (typeof callback === "function") {
          callback({
            status: "error",
            message: "Invalid movement coordinates.",
          });
        }
      }
    }
  });

  // server.js

  function isValidMovement(x, y) {
    return world.isTileOpen(x, y);
  }

  // Handle player attack
  socket.on("playerAttack", (targetId, callback) => {
    const attacker = world.players[socket.id];
    const targetPlayer = world.players[targetId];
    const targetMonster = world.monsters[targetId];

    if (attacker && (targetPlayer || targetMonster)) {
      let target;
      if (targetPlayer) {
        target = targetPlayer;
      } else {
        target = targetMonster;
      }

      const damage = Math.max(attacker.stats.attack - target.stats.defense, 1);
      target.stats.hp -= damage;

      io.emit("chatMessage", {
        text: `${attacker.name} attacked ${target.name} for ${damage} damage.`,
      });

      if (target.stats.hp <= 0) {
        // Handle target death
        io.emit("entityDied", target.id);

        if (targetPlayer) {
          // Respawn player
          target.stats.hp = 100;
          target.x = Math.floor(Math.random() * world.dungeon[0].length) * 32;
          target.y = Math.floor(Math.random() * world.dungeon.length) * 32;
          io.emit("playerRespawned", target);
        } else if (targetMonster) {
          // Remove monster from the world

          const body = new Item(
            target.id,
            target.name + " body",
            "blood",
            {},
            target.x,
            target.y
          );
          world.items[target.id] = body;
          io.emit("itemsData", world.items);
          world.monsters[target.id].active = false;
          io.emit("monstersData", world.monsters);
          io.emit("chatMessage", {
            text: `${attacker.name} killed ${target.name}`,
          });
          delete world.monsters[target.id];
        }
      } else {
        // Update target's stats
        if (targetPlayer) {
          io.emit("playerStatsUpdate", target);
        } else if (targetMonster) {
          io.emit("monsterStatsUpdate", target);
        }
      }
      callback({ status: "ok" });
    } else {
      callback({ status: "error", message: "Invalid attacker or target." });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    world.removePlayer(socket.id);
    io.emit("playerDisconnected", socket.id);
  });

  // Additional event handlers (e.g., for items, chests, etc.) can be added here
});

// Game loop to update monsters and other entities
setInterval(() => {
  world.updateMonsters();
  io.emit("monstersData", world.monsters);
}, 1000 / 2); // Update at 30 FPS

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
