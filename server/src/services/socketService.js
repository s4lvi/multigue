// server/src/services/socketService.js

const socketio = require("socket.io");
const User = require("../models/User"); // Ensure this is your plain JS User class
const generateDungeon = require("./generationService");
const { v4: uuidv4 } = require("uuid"); // For generating unique item IDs
const THREE = require("three"); // For vector calculations

const players = {}; // In-memory storage for players
let dungeon = generateDungeon(); // Generate dungeon once
const items = []; // In-memory storage for items

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

// Function to scatter weapons in empty rooms
const scatterWeapons = () => {
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
  });
};

// Scatter weapons after dungeon generation
scatterWeapons();

// Utility function to calculate distance between two positions
const calculateDistance = (pos1, pos2) => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Function to handle player death
const handlePlayerDeath = (userId, io) => {
  const player = players[userId];
  if (!player) return;

  // Drop all inventory items as corpses
  // player.inventory.forEach((item) => {
  //   const drop = {
  //     id: item.id,
  //     type: item.type,
  //     position: {
  //       x: player.position.x + Math.floor(Math.random() * 7) - 3,
  //       y: 0,
  //       z: player.position.z + Math.floor(Math.random() * 7) - 3,
  //     },
  //   };
  //   items.push(drop);
  //   io.to("overworld").emit("itemAdded", item);
  // });

  const corpse = {
    id: uuidv4(),
    type: "corpse",
    position: { ...player.position },
  };

  io.to("overworld").emit("itemAdded", corpse);

  // Reset player's inventory and health
  player.inventory = [];
  player.stats.health = 100;

  // Respawn player at a random room
  const randomIndex = Math.floor(Math.random() * dungeon.rooms.length);
  const selectedRoom = dungeon.rooms[randomIndex];
  player.position = { x: selectedRoom.x, y: 0, z: selectedRoom.z };

  io.to("overworld").emit("playerRespawned", {
    userId,
    position: player.position,
  });
};

// Placeholder function for gun shooting logic
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
  const io = socketio(server, {
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
          stats: { health: 100, level: 1, experience: 0 },
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

        callback({
          status: "ok",
          player: players[socket.id],
          dungeon: dungeon.grid,
          items, // Send current items
        });
      } catch (error) {
        console.error(error);
        callback({ status: "error", message: "Registration failed" });
      }
    });

    // Handle item pickup
    socket.on("pickupItem", (itemId, callback) => {
      const player = players[socket.id];
      const itemIndex = items.findIndex((item) => item.id === itemId);
      if (itemIndex !== -1 && player) {
        const item = items[itemIndex];
        player.inventory.push(item);
        // Equip the first item if not already equipped
        if (player.equippedIndex === -1) {
          player.equippedIndex = 0;
        }
        items.splice(itemIndex, 1);
        io.to("overworld").emit("itemRemoved", { itemId });
        io.to(socket.id).emit("inventoryUpdated", player.inventory);
        callback({ status: "ok" });
      } else {
        callback({
          status: "error",
          message: "Item not found or player invalid",
        });
      }
      if (items.length < 4) {
        scatterWeapons();
      }
    });

    // Handle player movement
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

    // Handle attacking
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

    // Handle shooting (optional, if separate from attack)
    socket.on("shoot", (data) => {
      const player = players[socket.id];
      if (!player) return;

      io.to("overworld").emit("playerShot", {
        userId: player.userId,
        direction: data.direction,
        position: player.position,
      });
    });

    // Handle chat messages
    socket.on("chatMessage", (message) => {
      if (players[socket.id]) {
        io.to("overworld").emit("chatMessage", {
          username: players[socket.id].username,
          message,
        });
      }
    });

    // Handle disconnection
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

  // Emit initial items to newly connected players
  io.on("connection", (socket) => {
    socket.emit("itemsUpdate", items);
  });
};
