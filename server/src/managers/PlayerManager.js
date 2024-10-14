// server/src/managers/PlayerManager.js

const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");

class PlayerManager {
  constructor(gameManager, io) {
    this.gameManager = gameManager;
    this.io = io;
    this.players = gameManager.players;
    this.WEAPON_PROPERTIES = {
      sword: { damage: 25, range: 1 },
      gun: { damage: 15, range: 1000 },
    };
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

  attack(socketId, { direction }) {
    const player = this.players[socketId];
    if (!player || !player.inventory || player.inventory.length === 0) return;

    const equippedItem = player.inventory[player.equippedIndex];
    if (!equippedItem) return;

    const weapon = this.WEAPON_PROPERTIES[equippedItem.type];
    if (!weapon) return;

    if (equippedItem.type === "sword") {
      const hits = [];
      for (const [id, otherPlayer] of Object.entries(this.players)) {
        if (id === socketId) continue;
        const distance = calculateDistance(
          player.position,
          otherPlayer.position
        );
        if (distance <= weapon.range) {
          hits.push(id);
        }
      }
      hits.forEach((hitId) => {
        const hitPlayer = this.players[hitId];
        if (hitPlayer) {
          hitPlayer.stats.health -= weapon.damage;
          this.io.to("overworld").emit("playerHit", {
            userId: hitId,
            damage: weapon.damage,
            newHealth: hitPlayer.stats.health,
          });
          if (hitPlayer.stats.health <= 0) {
            this.gameManager.handlePlayerDeath(hitId);
          }
        }
      });
    } else if (equippedItem.type === "gun") {
      if (!direction) return;

      const hits = this.gameManager.npcManager.findNPCsInDirection(
        player.position,
        direction
      );
      hits.forEach((npcId) => {
        const npc = this.gameManager.npcManager.getNPC(npcId);
        if (npc) {
          npc.takeDamage(weapon.damage);
          this.io.to("overworld").emit("npcHit", {
            id: npcId,
            damage: weapon.damage,
            newHealth: npc.stats.health,
          });
          if (npc.stats.health <= 0) {
            this.gameManager.npcManager.handleNPCDeath(npcId);
          }
        }
      });

      // Emit bullet fired for visual effects
      this.io.to("overworld").emit("playerShot", {
        userId: socketId,
        direction,
        position: player.position,
      });
    }
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
}

module.exports = PlayerManager;
