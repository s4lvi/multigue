// server/src/services/socketService.js

const socketio = require("socket.io");
const User = require("../models/User"); // Ensure this is your plain JS User class
const generateDungeon = require("./generationService");
const { v4: uuidv4 } = require("uuid"); // For generating unique item IDs
const THREE = require("three");
const NPC = require("../models/NPC"); // Import the NPC class

const players = {}; // In-memory storage for players
let dungeon = generateDungeon(); // Generate dungeon once
const items = []; // In-memory storage for items
const npcs = {}; // In-memory storage for NPCs

// Define weapon properties
const WEAPON_PROPERTIES = {
  sword: {
    damage: 25,
    range: 1,
  },
  gun: {
    damage: 15,
    range: 1000, // For simplicity, handle as instant hit
  },
};

// Function to scatter weapons in empty rooms (existing)
const scatterWeapons = (io = null) => {
  if (!dungeon.rooms || dungeon.rooms.length === 0) return;

  dungeon.rooms.forEach((room) => {
    // Define criteria for an empty room
    // For simplicity, assume all rooms are eligible
    const itemType = Math.random() < 0.5 ? "sword" : "gun";
    const item = {
      id: uuidv4(),
      type: itemType,
      position: {
        x: room.x,
        y: 0,
        z: room.z,
      },
    };
    console.log(
      `adding ${itemType} to ${JSON.stringify(room)}, ${JSON.stringify(item)}`
    );
    items.push(item);
    if (io) {
      io.to("overworld").emit("itemAdded", item);
    }
  });
};

// Function to scatter health and mana potions
const scatterPotions = (io = null) => {
  if (!dungeon.rooms || dungeon.rooms.length === 0) return;

  const potionTypes = ["health_potion", "mana_potion"];
  dungeon.rooms.forEach((room) => {
    // Randomly decide to place a potion
    if (Math.random() < 0.8) {
      // 30% chance to place a potion in a room
      const itemType =
        potionTypes[Math.floor(Math.random() * potionTypes.length)];
      const potion = {
        id: uuidv4(),
        type: itemType,
        position: {
          x: room.x + (Math.random() - 0.5) * room.width, // Random position within the room
          y: 0,
          z: room.z + (Math.random() - 0.5) * room.height,
        },
      };
      console.log(
        `adding ${itemType} to ${JSON.stringify(room)}, ${JSON.stringify(
          potion
        )}`
      );
      items.push(potion);
      if (io) {
        io.to("overworld").emit("itemAdded", potion);
      }
    }
  });
};

// Scatter weapons and potions after dungeon generation
scatterWeapons();
scatterPotions();

// Initialize NPCs
const initializeNPCs = (io) => {
  const numberOfNPCs = 5; // Define how many NPCs you want
  for (let i = 0; i < numberOfNPCs; i++) {
    const room =
      dungeon.rooms[Math.floor(Math.random() * dungeon.rooms.length)];
    const npc = new NPC({
      type: "goblin", // You can randomize types if desired
      position: { x: room.x, y: 0, z: room.z },
      io: io,
    });
    npcs[npc.id] = npc;
    io.to("overworld").emit("npcAdded", npc);
  }
};

// Utility function to calculate distance between two positions
const calculateDistance = (pos1, pos2) => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Collision detection (reuse your existing function or adapt it)
const checkCollision = (position, dungeonGrid) => {
  const PLAYER_RADIUS = 0.2;
  const gridX = Math.floor(position.x + dungeonGrid[0].length / 2);
  const gridZ = Math.floor(position.z + dungeonGrid.length / 2);

  if (
    gridX < 0 ||
    gridX >= dungeonGrid[0].length ||
    gridZ < 0 ||
    gridZ >= dungeonGrid.length ||
    dungeonGrid[gridZ][gridX] === 1
  ) {
    return false;
  }

  return true;
};

// Placeholder for io in NPC class (ensure proper scoping)
let io;

// Function to handle player death (existing)
const handlePlayerDeath = (userId, io) => {
  const player = players[userId];
  if (!player) return;

  const corpse = {
    id: uuidv4(),
    type: "corpse",
    position: { ...player.position },
  };

  io.to("overworld").emit("itemAdded", corpse);

  // Reset player's inventory and health
  player.inventory = [];
  player.stats.health = 100;
  player.stats.mana = 100;

  // Respawn player at a random room
  const randomIndex = Math.floor(Math.random() * dungeon.rooms.length);
  const selectedRoom = dungeon.rooms[randomIndex];
  player.position = { x: selectedRoom.x, y: 0, z: selectedRoom.z };

  io.to("overworld").emit("playerRespawned", {
    userId,
    position: player.position,
  });
};

// Placeholder function for gun shooting logic (existing)
const findPlayersInDirection = (position, direction) => {
  const hits = [];
  const shooterVector = new THREE.Vector3(
    direction.x,
    direction.y,
    direction.z
  ).normalize();
  const maxRange = WEAPON_PROPERTIES.gun.range;

  for (const [id, otherPlayer] of Object.entries(players)) {
    if (id === position.userId) continue; // Skip shooter
    const targetPos = new THREE.Vector3(
      otherPlayer.position.x,
      otherPlayer.position.y,
      otherPlayer.position.z
    );
    const toTarget = targetPos
      .clone()
      .sub(new THREE.Vector3(position.x, position.y, position.z));
    const distance = toTarget.length();

    if (distance > maxRange) continue;

    const toTargetNormalized = toTarget.clone().normalize();
    const dot = toTargetNormalized.dot(shooterVector);

    if (dot > 0.99) {
      // Adjust the threshold as needed
      hits.push(id);
    }
  }

  return hits;
};

exports.initialize = (server) => {
  io = socketio(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Handle player registration
    socket.on("register", async ({ username }, callback) => {
      try {
        if (!dungeon.rooms || dungeon.rooms.length === 0) {
          return callback({ status: "error", message: "No rooms available" });
        }

        const randomIndex = Math.floor(Math.random() * dungeon.rooms.length);
        const selectedRoom = dungeon.rooms[randomIndex];

        let user = new User({
          username,
          currentLocation: "overworld",
          position: { x: selectedRoom.x, y: 0, z: selectedRoom.z },
          inventory: [],
          stats: { health: 100, mana: 100, level: 1, experience: 0 },
        });

        players[socket.id] = {
          userId: socket.id, // Using socket.id as a unique identifier
          username: user.username,
          position: user.position,
          inventory: [],
          equippedIndex: -1, // Initially no item equipped
          stats: user.stats,
        };

        socket.join("overworld");

        io.to("overworld").emit("playerJoined", players[socket.id]);

        // Initialize NPCs if not already done
        if (Object.keys(npcs).length === 0) {
          initializeNPCs(io);
        }
        callback({
          status: "ok",
          player: players[socket.id],
          dungeon: dungeon.grid,
          items,
          players,
          npcs,
        });
      } catch (error) {
        console.error(error);
        callback({ status: "error", message: "Registration failed" });
      }
    });

    socket.on("pickupItem", (itemId, callback) => {
      const player = players[socket.id];
      const itemIndex = items.findIndex((item) => item.id === itemId);
      if (itemIndex !== -1 && player) {
        const item = items[itemIndex];
        // Apply item effect based on type
        if (item.type === "health_potion") {
          player.stats.health = Math.min(player.stats.health + 50, 100); // Heal 50 HP, max 100
          io.to(socket.id).emit("statsUpdated", player.stats);
        } else if (item.type === "mana_potion") {
          player.stats.mana = Math.min((player.stats.mana || 0) + 30, 100); // Restore 30 mana, max 100
          io.to(socket.id).emit("statsUpdated", player.stats);
        } else {
          player.inventory.push(item);
          if (player.equippedIndex === -1) {
            player.equippedIndex = 0;
          }
          io.to(socket.id).emit("inventoryUpdated", player.inventory);
        }

        items.splice(itemIndex, 1);
        io.to("overworld").emit("itemRemoved", { itemId });

        // Rescatter items if necessary
        if (items.length < 2) {
          scatterWeapons(io);
          scatterPotions(io);
        }

        callback({ status: "ok" });
      } else {
        callback({
          status: "error",
          message: "Item not found or player invalid",
        });
      }
    });

    // Handle player movement (existing)
    socket.on("move", ({ position }) => {
      if (players[socket.id]) {
        const oldPos = players[socket.id].position;
        players[socket.id].position = position;
        io.to("overworld").emit("playerMoved", {
          userId: players[socket.id].userId,
          position,
        });
      }
    });

    // Handle attacking (existing)
    socket.on("attack", (data) => {
      const player = players[socket.id];
      if (!player || !player.inventory || player.inventory.length === 0) return;
      const equippedItem = player.inventory[player.equippedIndex];
      if (!equippedItem) return;

      const weapon = WEAPON_PROPERTIES[equippedItem.type];
      if (!weapon) return;

      if (equippedItem.type === "sword") {
        const hits = [];
        for (const [id, otherPlayer] of Object.entries(players)) {
          if (id === socket.id) continue;
          const distance = calculateDistance(
            player.position,
            otherPlayer.position
          );
          if (distance <= weapon.range) {
            hits.push(id);
          }
        }
        hits.forEach((hitId) => {
          const hitPlayer = players[hitId];
          if (hitPlayer) {
            hitPlayer.stats.health -= weapon.damage;
            io.to("overworld").emit("playerHit", {
              userId: hitId,
              damage: weapon.damage,
              newHealth: hitPlayer.stats.health,
            });
            if (hitPlayer.stats.health <= 0) {
              handlePlayerDeath(hitId, io);
            }
          }
        });
      } else if (equippedItem.type === "gun") {
        const { direction } = data;
        if (!direction) return;

        const hits = findPlayersInDirection(player.position, direction);
        hits.forEach((hitId) => {
          const hitPlayer = players[hitId];
          if (hitPlayer) {
            hitPlayer.stats.health -= weapon.damage;
            io.to("overworld").emit("playerHit", {
              userId: hitId,
              damage: weapon.damage,
              newHealth: hitPlayer.stats.health,
            });
            io.to("overworld").emit("bulletHit", {
              shooterId: socket.id,
              targetId: hitId,
              position: hitPlayer.position,
            });
            if (hitPlayer.stats.health <= 0) {
              handlePlayerDeath(hitId, io);
            }
          }
        });

        // Emit bullet fired (for visual effects)
        io.to("overworld").emit("playerShot", {
          userId: socket.id,
          direction,
          position: player.position,
        });
      }
    });

    // Handle chat messages (existing)
    socket.on("chatMessage", (message) => {
      if (players[socket.id]) {
        io.to("overworld").emit("chatMessage", {
          username: players[socket.id].username,
          message,
        });
      }
    });

    // Handle disconnection (existing)
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      if (players[socket.id]) {
        io.to("overworld").emit("playerLeft", {
          userId: players[socket.id].userId,
        });
        delete players[socket.id];
      }
    });
  });

  // Emit initial items and NPCs to newly connected players
  io.on("connection", (socket) => {
    socket.emit("itemsUpdate", items);
    socket.emit("npcsUpdate", Object.values(npcs));
  });

  // NPC Behavior Loop
  setInterval(() => {
    const deltaTime = 0.1; // Adjust as needed
    for (const npc of Object.values(npcs)) {
      npc.updateState(players);
      npc.move(dungeon.grid, players, deltaTime, io, handlePlayerDeath);
    }
  }, 100); // Update every 100ms
};
