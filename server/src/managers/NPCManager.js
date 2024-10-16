// server/src/managers/NPCManager.js

const NPC = require("../models/NPC");
const { calculateDistance } = require("../utils/collision");

class NPCManager {
  constructor(gameManager, io) {
    this.gameManager = gameManager;
    this.io = io;
    this.npcs = {};
  }

  initializeNPCs(dungeon) {
    const numberOfNPCs = 5;
    for (let i = 0; i < numberOfNPCs; i++) {
      if (!dungeon.rooms || dungeon.rooms.length === 0) {
        console.warn("No rooms available in the dungeon to place NPCs.");
        return;
      }

      // Select a random room
      const room =
        dungeon.rooms[Math.floor(Math.random() * dungeon.rooms.length)];

      // Validate room properties
      if (typeof room.x !== "number" || typeof room.z !== "number") {
        console.error(`Invalid room structure:`, room);
        continue; // Skip this room
      }

      // Generate a random position within the room, avoiding overlaps
      const position = this.getRandomPositionInRoom(room);

      if (!position) {
        console.warn(`Failed to place NPC in room at (${room.x}, ${room.z})`);
        continue; // Skip if no valid position found
      }

      const npc = new NPC({
        type: "goblin",
        position: { x: position.x, y: 0, z: position.z },
      });

      this.npcs[npc.id] = npc;
      this.io.to("overworld").emit("npcAdded", npc);
      console.log(
        `NPC added: ${npc.type} at (${npc.position.x}, ${npc.position.z})`
      );
    }
  }

  /**
   * Generates a random position within the given room, avoiding overlaps and central areas.
   * @param {Object} room - The room object containing center and size.
   * @returns {Object|null} - The position object {x, z} or null if placement fails.
   */
  getRandomPositionInRoom(room) {
    const roomCenterX = room.x;
    const roomCenterZ = room.z;
    const width = room.width;
    const height = room.height;

    const MIN_DISTANCE_BETWEEN_NPCS = 1.5; // Minimum distance between NPCs
    const CENTRAL_EXCLUSION_RADIUS = 2; // Exclusion radius around room center
    const MAX_PLACEMENT_ATTEMPTS = 10; // Max attempts to place an NPC

    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
      // Generate random offsets within room boundaries, excluding central area
      const offsetX =
        (Math.random() - 0.5) * (width - 2 * CENTRAL_EXCLUSION_RADIUS);
      const offsetZ =
        (Math.random() - 0.5) * (height - 2 * CENTRAL_EXCLUSION_RADIUS);

      const posX = roomCenterX + offsetX;
      const posZ = roomCenterZ + offsetZ;

      // Check for overlaps with existing NPCs
      if (this.isPositionValid(posX, posZ)) {
        return { x: posX, z: posZ };
      }
    }

    // If no valid position is found after max attempts
    return null;
  }

  /**
   * Checks whether the given position is valid for placing a new NPC.
   * Ensures the position is not too close to existing NPCs.
   * @param {number} x - The x-coordinate of the position.
   * @param {number} z - The z-coordinate of the position.
   * @returns {boolean} - True if the position is valid, false otherwise.
   */
  isPositionValid(x, z) {
    for (const npc of Object.values(this.npcs)) {
      const distance = calculateDistance({ x, y: 0, z }, npc.position);
      if (distance < 1.5) {
        // Minimum distance threshold
        return false; // Too close to another NPC
      }
    }
    return true; // Position is valid
  }

  getNPCs() {
    return Object.values(this.npcs);
  }

  getNPC(npcId) {
    return this.npcs[npcId];
  }

  updateNPCs(players) {
    for (const npc of Object.values(this.npcs)) {
      npc.updateState(players);
      npc.move(this.gameManager.dungeon.grid, players);
      this.io.to("overworld").emit("npcMoved", {
        id: npc.id,
        position: npc.position,
      });

      if (npc.state === "attacking" && npc.targetPlayerId) {
        const targetPlayer = players[npc.targetPlayerId];
        if (targetPlayer) {
          targetPlayer.stats.health -= npc.stats.damage;
          this.io.to("overworld").emit("playerHit", {
            userId: targetPlayer.userId,
            damage: npc.stats.damage,
            newHealth: targetPlayer.stats.health,
          });
          if (targetPlayer.stats.health <= 0) {
            this.gameManager.handlePlayerDeath(targetPlayer.userId);
          }
        }
      }

      // Handle NPC death
      if (npc.stats.health <= 0) {
        this.handleNPCDeath(npc.id);
      }
    }
  }

  findNPCsInDirection(position, direction) {
    const hits = [];
    const shooterVector = direction; // Assumed to be normalized
    const maxRange = 1000; // Gun range

    for (const [id, npc] of Object.entries(this.npcs)) {
      const toNPC = {
        x: npc.position.x - position.x,
        y: npc.position.y - position.y,
        z: npc.position.z - position.z,
      };
      const distance = calculateDistance(position, npc.position);
      if (distance > maxRange) continue;

      // Normalize toNPC vector
      const length = Math.sqrt(toNPC.x ** 2 + toNPC.y ** 2 + toNPC.z ** 2);
      if (length === 0) continue; // Prevent division by zero
      const toNPCNormalized = {
        x: toNPC.x / length,
        y: toNPC.y / length,
        z: toNPC.z / length,
      };

      const dot =
        toNPCNormalized.x * shooterVector.x +
        toNPCNormalized.y * shooterVector.y +
        toNPCNormalized.z * shooterVector.z;

      if (dot > 0.99) {
        // Adjust threshold as needed
        hits.push(id);
      }
    }

    return hits;
  }

  handleNPCDeath(npcId) {
    const npc = this.npcs[npcId];
    if (!npc) return;

    // Drop loot or perform other actions
    this.gameManager.itemManager.spawnCorpse(npc.position);

    // Remove NPC from the server
    this.io.to("overworld").emit("npcRemoved", { id: npcId });
    delete this.npcs[npcId];
    console.log(
      `NPC removed: ${npc.type} at (${npc.position.x}, ${npc.position.z})`
    );
  }
}

module.exports = NPCManager;
