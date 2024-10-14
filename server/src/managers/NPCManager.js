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
      const room =
        dungeon.rooms[Math.floor(Math.random() * dungeon.rooms.length)];
      const npc = new NPC({
        type: "goblin",
        position: { x: room.x, y: 0, z: room.z },
      });
      this.npcs[npc.id] = npc;
      this.io.to("overworld").emit("npcAdded", npc);
    }
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
  }
}

module.exports = NPCManager;
