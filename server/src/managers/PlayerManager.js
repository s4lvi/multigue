// server/src/managers/PlayerManager.js

const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");

const { calculateDistance } = require("../utils/collision");
class PlayerManager {
  constructor(gameManager, io) {
    this.gameManager = gameManager;
    this.io = io;
    this.players = gameManager.players;
  }

  addPlayer(socket, { username }) {
    const { dungeon } = this.gameManager;
    if (!dungeon.rooms || dungeon.rooms.length === 0) {
      socket.emit("registrationError", "No rooms available");
      return;
    }

    const randomIndex = Math.floor(Math.random() * dungeon.rooms.length);
    const selectedRoom = dungeon.rooms[randomIndex];

    const user = new User({
      username,
      position: { x: selectedRoom.x, y: 0, z: selectedRoom.z },
    });

    this.players[socket.id] = {
      userId: socket.id,
      username: user.username,
      position: user.position,
      inventory: [],
      equippedIndex: -1,
      stats: { ...user.stats },
    };

    socket.join("overworld");
    this.io.to("overworld").emit("playerJoined", this.players[socket.id]);

    // Emit initial state to the newly connected player
    socket.emit("initialState", {
      player: this.players[socket.id],
      dungeon: this.gameManager.dungeon.grid,
      items: this.gameManager.itemManager.items,
      players: this.players,
      npcs: this.gameManager.npcManager.getNPCs(),
    });
  }

  removePlayer(socketId) {
    if (this.players[socketId]) {
      this.io.to("overworld").emit("playerLeft", { userId: socketId });
      delete this.players[socketId];
    }
  }

  movePlayer(socketId, position) {
    const player = this.players[socketId];
    if (player) {
      player.position = position;
      this.io.to("overworld").emit("playerMoved", {
        userId: socketId,
        position,
      });
    }
  }

  calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  attack(socketId, { direction }) {
    const player = this.players[socketId];
    if (!player || !player.inventory || player.inventory.length === 0) return;

    const equippedItem = player.inventory[player.equippedIndex];
    if (!equippedItem) return;
    if (!direction) return;
    const pHits = this.gameManager.playerManager.findPlayersInDirection(
      player.position,
      direction
    );
    pHits.forEach((hitId) => {
      const hitPlayer = this.players[hitId];
      const distance = this.calculateDistance(
        player.position,
        hitPlayer.position
      );
      if (hitPlayer && distance <= equippedItem.stats.range) {
        hitPlayer.stats.health -= equippedItem.stats.damage;
        this.io.to("overworld").emit("playerHit", {
          userId: hitId,
          damage: equippedItem.stats.damage,
          newHealth: hitPlayer.stats.health,
        });
        if (hitPlayer.stats.health <= 0) {
          this.gameManager.handlePlayerDeath(hitId);
        }
      }
    });
    const nHits = this.gameManager.npcManager.findNPCsInDirection(
      player.position,
      direction
    );
    nHits.forEach((npcId) => {
      const npc = this.gameManager.npcManager.getNPC(npcId);
      const distance = this.calculateDistance(player.position, npc.position);
      if (npc && distance <= equippedItem.stats.range) {
        npc.takeDamage(equippedItem.stats.damage);
        this.io.to("overworld").emit("npcHit", {
          id: npcId,
          damage: equippedItem.stats.damage,
          newHealth: npc.stats.health,
        });
        if (npc.stats.health <= 0) {
          this.gameManager.npcManager.handleNPCDeath(npcId);
        }
      }
    });

    // // Emit bullet fired for visual effects
    // this.io.to("overworld").emit("playerShot", {
    //   userId: socketId,
    //   direction,
    //   position: player.position,
    // });
  }

  useItem(socketId, direction) {
    let item =
      this.players[socketId].inventory[this.players[socketId].equippedIndex];
    if (!item) return;
    let stat = item.stats.stat;
    let amount = item.stats.value;
    this.players[socketId].stats[stat] = Math.min(
      this.players[socketId].stats[stat] + amount,
      100
    );
    this.io.to(socketId).emit("statsUpdated", this.players[socketId].stats);
    this.players[socketId].inventory.splice(
      this.players[socketId].equippedIndex,
      1
    );
    this.players[socketId].equippedIndex = -1;
    this.io
      .to(socketId)
      .emit("inventoryUpdated", this.players[socketId].inventory);
  }

  sendChatMessage(socketId, message) {
    const player = this.players[socketId];
    if (player) {
      this.io.to("overworld").emit("chatMessage", {
        username: player.username,
        message,
      });
    }
  }

  handleDeath(playerId) {
    const player = this.players[playerId];
    if (!player) return;

    // Create corpse item
    this.gameManager.itemManager.spawnCorpse(player.position);

    // Reset player's inventory and stats
    player.inventory = [];
    player.stats.health = 100;
    player.stats.mana = 100;

    // Respawn player at a random room
    const { dungeon } = this.gameManager;
    const randomIndex = Math.floor(Math.random() * dungeon.rooms.length);
    const selectedRoom = dungeon.rooms[randomIndex];
    player.position = { x: selectedRoom.x, y: 0, z: selectedRoom.z };

    this.io.to("overworld").emit("playerRespawned", {
      userId: playerId,
      position: player.position,
    });
  }

  findPlayersInDirection(position, direction) {
    const hits = [];
    const shooterVector = direction; // Assumed to be normalized

    for (const [id, player] of Object.entries(this.players)) {
      const toPlayer = {
        x: player.position.x - position.x,
        y: player.position.y - position.y,
        z: player.position.z - position.z,
      };
      const distance = calculateDistance(position, player.position);

      // Normalize toNPC vector
      const length = Math.sqrt(
        toPlayer.x ** 2 + toPlayer.y ** 2 + toPlayer.z ** 2
      );
      if (length === 0) continue; // Prevent division by zero
      const toPlayerNormalized = {
        x: toPlayer.x / length,
        y: toPlayer.y / length,
        z: toPlayer.z / length,
      };

      const dot =
        toPlayerNormalized.x * shooterVector.x +
        toPlayerNormalized.y * shooterVector.y +
        toPlayerNormalized.z * shooterVector.z;

      if (dot > 0.99) {
        // Adjust threshold as needed
        hits.push(id);
      }
    }

    return hits;
  }
}

module.exports = PlayerManager;
