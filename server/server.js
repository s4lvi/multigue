const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const { generateDungeon } = require("./dungeonGenerator");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 3000;

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, "..", "client")));

// Game state
let players = {};

// Dungeon data (for simplicity, one dungeon shared by all players)
// Persist dungeon data to ensure consistency across server restarts
const dungeonWidth = 50;
const dungeonHeight = 50;
const dungeonPath = path.join(__dirname, "dungeon.json");
let dungeon;

if (fs.existsSync(dungeonPath)) {
  dungeon = JSON.parse(fs.readFileSync(dungeonPath, "utf-8"));
  console.log("Dungeon loaded from file.");
} else {
  dungeon = generateDungeon(dungeonWidth, dungeonHeight);
  fs.writeFileSync(dungeonPath, JSON.stringify(dungeon));
  console.log("Dungeon generated and saved to file.");
}

// Handle player connections
io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Initialize new player

  // Wait for player to send their name
  socket.on("playerJoined", (data) => {
    const playerName = data.name || "Anonymous";

    players[socket.id] = {
      id: socket.id,
      name: playerName,
      x: Math.floor(Math.random() * dungeonWidth) * 32, // Tile size is 32
      y: Math.floor(Math.random() * dungeonHeight) * 32,
      stats: {
        hp: 100,
        attack: 10,
        defense: 5,
      },
      inventory: [],
      equipment: {
        weapon: null,
        armor: null,
      },
      currentArea: "dungeon", // or 'home'
    };

    console.log(
      `Player ${players[socket.id].name} (${socket.id}) initialized at (${
        players[socket.id].x
      }, ${players[socket.id].y})`
    );

    // Send current players to the new player
    socket.emit("currentPlayers", players);
    console.log(`Emitted 'currentPlayers' to ${socket.id}`);

    // Send dungeon data to the new player
    socket.emit("dungeonData", dungeon);
    console.log(`Emitted 'dungeonData' to ${socket.id}`);

    // Notify existing players of the new player
    socket.broadcast.emit("newPlayer", players[socket.id]);
    console.log(`Broadcasted 'newPlayer' for ${socket.id}`);
  });

  // Handle player movement with validation and acknowledgments
  socket.on("playerMovement", (movementData, callback) => {
    if (players[socket.id]) {
      const { x, y } = movementData;
      // Validate coordinates (example bounds)
      if (
        x >= 0 &&
        x <= dungeonWidth * 32 &&
        y >= 0 &&
        y <= dungeonHeight * 32
      ) {
        players[socket.id].x = Math.floor(x);
        players[socket.id].y = Math.floor(y);
        // Broadcast to all other players
        socket.broadcast.emit("playerMoved", players[socket.id]);
        console.log(`Player ${socket.id} moved to (${x}, ${y})`);
        callback({ status: "ok" });
      } else {
        console.warn(
          `Invalid movement data from ${socket.id}: (${x}, ${y}) (${
            dungeonWidth * 32
          } - ${dungeonHeight * 32})`
        );
        callback({ status: "error", message: "Invalid movement coordinates." });
      }
    }
  });

  // Handle player attack with validation
  socket.on("playerAttack", (targetId, callback) => {
    const attacker = players[socket.id];
    const target = players[targetId];
    if (attacker && target) {
      const damage = attacker.stats.attack - target.stats.defense;
      target.stats.hp -= damage > 0 ? damage : 1;
      console.log(
        `Player ${socket.id} attacked ${targetId} for ${
          damage > 0 ? damage : 1
        } damage. Target HP: ${target.stats.hp}`
      );

      if (target.stats.hp <= 0) {
        // Handle player death
        io.emit("playerDied", target.id);
        console.log(`Player ${target.id} has died.`);

        // Reset player stats and position for respawn
        players[target.id].stats = {
          hp: 100,
          attack: 10,
          defense: 5,
        };
        players[target.id].x = Math.floor(Math.random() * dungeonWidth) * 32;
        players[target.id].y = Math.floor(Math.random() * dungeonHeight) * 32;

        // Emit player respawn event
        io.emit("playerRespawned", players[target.id]);
        console.log(
          `Player ${target.id} has respawned at (${players[target.id].x}, ${
            players[target.id].y
          })`
        );
      } else {
        // Update target's HP
        io.emit("playerStatsUpdate", target);
        console.log(`Updated stats for player ${target.id}`);
      }

      callback({ status: "ok" });
    } else {
      console.warn(
        `Attack failed: Invalid attacker (${socket.id}) or target (${targetId})`
      );
      callback({ status: "error", message: "Invalid attacker or target." });
    }
  });

  // Handle stats updates (e.g., resting to restore HP)
  socket.on("updateStats", (stats, callback) => {
    if (players[socket.id]) {
      players[socket.id].stats = {
        ...players[socket.id].stats,
        ...stats, // Merge existing stats with the new stats
      };
      io.emit("playerStatsUpdate", players[socket.id]);
      console.log(
        `Updated stats for player ${socket.id}:`,
        players[socket.id].stats
      );
      callback({ status: "ok" });
    } else {
      console.warn(`Stats update failed: Player ${socket.id} not found.`);
      callback({ status: "error", message: "Player not found." });
    }
  });

  // Handle inventory updates
  socket.on("updateInventory", (inventory, callback) => {
    if (players[socket.id]) {
      players[socket.id].inventory = inventory;
      io.to(socket.id).emit("inventoryUpdate", {
        id: socket.id,
        inventory: players[socket.id].inventory,
      });
      console.log(`Updated inventory for player ${socket.id}:`, inventory);
      callback({ status: "ok" });
    } else {
      console.warn(`Inventory update failed: Player ${socket.id} not found.`);
      callback({ status: "error", message: "Player not found." });
    }
  });

  // Handle equipment updates
  socket.on("updateEquipment", (equipment, callback) => {
    if (players[socket.id]) {
      players[socket.id].equipment = equipment;
      io.to(socket.id).emit("updateEquipment", {
        id: socket.id,
        equipment: players[socket.id].equipment,
      });
      console.log(`Updated equipment for player ${socket.id}:`, equipment);
      callback({ status: "ok" });
    } else {
      console.warn(`Equipment update failed: Player ${socket.id} not found.`);
      callback({ status: "error", message: "Player not found." });
    }
  });

  // Handle entering home village
  socket.on("enterHome", (callback) => {
    if (players[socket.id]) {
      players[socket.id].currentArea = "home";
      socket.emit("enteredHome");
      socket.broadcast.emit("playerAreaChange", {
        id: socket.id,
        area: "home",
      });
      console.log(`Player ${socket.id} entered home village.`);
      callback({ status: "ok" });
    } else {
      console.warn(`Enter home failed: Player ${socket.id} not found.`);
      callback({ status: "error", message: "Player not found." });
    }
  });

  // Handle exiting home village
  socket.on("exitHome", (callback) => {
    if (players[socket.id]) {
      players[socket.id].currentArea = "dungeon";
      socket.emit("exitedHome");
      socket.broadcast.emit("playerAreaChange", {
        id: socket.id,
        area: "dungeon",
      });
      console.log(`Player ${socket.id} exited home village.`);
      callback({ status: "ok" });
    } else {
      console.warn(`Exit home failed: Player ${socket.id} not found.`);
      callback({ status: "error", message: "Player not found." });
    }
  });

  // Handle purchasing items
  socket.on("purchase", (item, callback) => {
    // Simplified: Add the item to the player's inventory
    if (players[socket.id]) {
      players[socket.id].inventory.push(item);
      io.to(socket.id).emit("inventoryUpdate", {
        id: socket.id,
        inventory: players[socket.id].inventory,
      });
      console.log(`Player ${socket.id} purchased item:`, item);
      callback({ status: "ok" });
    } else {
      console.warn(`Purchase failed: Player ${socket.id} not found.`);
      callback({ status: "error", message: "Player not found." });
    }
  });

  // Handle chat messages
  socket.on("chatMessage", (message) => {
    console.log(`Chat message from ${message.name}: ${message.text}`);
    io.emit("chatMessage", message);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit("playerDisconnected", socket.id);
    console.log(`Broadcasted 'playerDisconnected' for ${socket.id}`);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
