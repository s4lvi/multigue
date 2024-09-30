// worldManager.js

import Perlin from "perlin-noise";
import { Entity } from "../shared/Entities.js";
import { PLAYER_RADIUS } from "../shared/constants.js";

class WorldManager {
  constructor(chunkSize, layers) {
    this.chunkSize = chunkSize;
    this.layers = layers;
    this.players = {};
    this.world = this.generateWorld();
  }

  // Generate the world with improved terrain and obstacles
  generateWorld() {
    const world = {};
    const noise = Perlin.generatePerlinNoise(
      this.chunkSize.width,
      this.chunkSize.height,
      {
        octaveCount: 4,
        amplitude: 0.1,
        persistence: 0.5,
      }
    );

    for (let x = 0; x < this.chunkSize.width; x++) {
      for (let y = 0; y < this.chunkSize.height; y++) {
        const noiseValue = noise[x * this.chunkSize.height + y];

        // Determine ground material based on noise value
        let groundMaterial;
        if (noiseValue < 0.3) {
          groundMaterial = "water";
        } else if (noiseValue < 0.45) {
          groundMaterial = "sand";
        } else if (noiseValue < 0.55) {
          groundMaterial = "dirt";
        } else if (noiseValue < 0.8) {
          groundMaterial = "grass";
        } else {
          groundMaterial = "gravel";
        }

        // Ground layer (z = 0)
        world[`${x},${y},0`] = {
          material: groundMaterial,
          type: groundMaterial === "water" ? "water" : "ground",
        };

        // Obstacles layer (z = 1)
        if (groundMaterial !== "water" && groundMaterial !== "gravel") {
          let obstacleChance = Math.random();
          if (obstacleChance < 0.05) {
            world[`${x},${y},1`] = { material: "tree", type: "solid" };
          } else if (obstacleChance < 0.075) {
            world[`${x},${y},1`] = { material: "rock", type: "solid" };
          } else {
            world[`${x},${y},1`] = { material: "none", type: "empty" };
          }
        } else if (groundMaterial === "gravel") {
          world[`${x},${y},1`] = { material: "stone", type: "solid" };
        } else {
          // No obstacles on water tiles
          world[`${x},${y},1`] = { material: "none", type: "empty" };
        }

        // Unused layer (z = 2)
        world[`${x},${y},2`] = { material: "none", type: "empty" };
      }
    }
    return world;
  }

  isNameTaken(name) {
    return Object.values(this.players).some((player) => player.name === name);
  }

  addPlayer(id, name) {
    this.players[id] = new Entity(
      id,
      name,
      { x: 1, y: 1, z: 1 },
      { hp: 100, maxHp: 100 },
      { inventory: [] } // Initialize inventory
    );
    return this.players[id];
  }

  removePlayer(id) {
    delete this.players[id];
  }

  movePlayer(id, direction) {
    const player = this.players[id];
    if (player) {
      let newPos = { ...player.position };

      if (direction === "up") newPos.y -= 1;
      if (direction === "down") newPos.y += 1;
      if (direction === "left") newPos.x -= 1;
      if (direction === "right") newPos.x += 1;

      const obstacle = this.world[`${newPos.x},${newPos.y},1`];
      if (obstacle && obstacle.type === "solid") {
        return player.position; // Blocked by obstacle
      }

      const ground = this.world[`${newPos.x},${newPos.y},0`];
      if (!ground || ground.type !== "ground") {
        return player.position; // No ground
      }

      player.move(newPos);
      return player.position;
    } else {
      return { x: 1, y: 1, z: 1 };
    }
  }

  // Refactored handleInteraction method
  handleInteraction(id, targetPos, itemType) {
    const player = this.players[id];
    if (player) {
      const distance = Math.hypot(
        player.position.x - targetPos.x,
        player.position.y - targetPos.y
      );

      if (distance <= PLAYER_RADIUS) {
        const actionType = this.getActionType(itemType);
        const targetInfo = this.getTargetInfo(id, targetPos);

        return this.handleAction(
          player,
          actionType,
          targetInfo,
          targetPos,
          itemType
        );
      }
    }
    return { success: false, message: "Out of reach or invalid action" };
  }

  // Determine the action type based on the item used
  getActionType(itemType) {
    const itemActionMap = {
      hand: "use",
      pickaxe: "hit",
      // Add more items and their corresponding action types
    };
    return itemActionMap[itemType] || "use"; // Default to 'use' if unknown item
  }

  // Get information about the target being interacted with
  getTargetInfo(playerId, targetPos) {
    const targetKey = `${targetPos.x},${targetPos.y},${targetPos.z}`;
    const targetBlock = this.world[targetKey];
    const targetPlayer = Object.values(this.players).find(
      (p) =>
        p.position.x === targetPos.x &&
        p.position.y === targetPos.y &&
        p.id !== playerId
    );

    if (targetPlayer) {
      return { type: "player", target: targetPlayer };
    } else if (targetBlock && targetBlock.type !== "empty") {
      return { type: "block", target: targetBlock };
    } else {
      return { type: "none", target: null };
    }
  }

  // Handle the action based on action type and target type
  handleAction(player, actionType, targetInfo, targetPos, itemType) {
    const { type: targetType, target } = targetInfo;

    if (actionType === "use") {
      // Implement 'use' interactions
      if (targetType === "block" && target.material === "item") {
        // Pickup item
        player.inventory.push(target.item);
        delete this.world[`${targetPos.x},${targetPos.y},${targetPos.z}`];
        return {
          success: true,
          type: "pickup",
          message: `${player.name} picked up ${target.item.name}`,
        };
      } else if (targetType === "player") {
        // Implement interaction with other players (e.g., trade)
        return {
          success: true,
          type: "use",
          message: `${player.name} waved at ${target.name}`,
        };
      } else {
        return { success: false, message: "Nothing to interact with" };
      }
    } else if (actionType === "hit") {
      // Implement 'hit' interactions
      if (targetType === "block" && target.type === "solid") {
        // Mine the block
        player.inventory.push({ type: "block", material: target.material });
        this.world[`${targetPos.x},${targetPos.y},${targetPos.z}`] = {
          material: "none",
          type: "empty",
        };
        return { success: true, type: "mine", message: "Block mined!" };
      } else if (targetType === "player") {
        // Attack another player
        const damage = this.calculateDamage(player, itemType, target);
        target.stats.hp -= damage;
        const isDefeated = target.stats.hp <= 0;
        if (isDefeated) {
          this.handlePlayerDeath(target.id);
        }
        return {
          success: true,
          type: "attack",
          message: isDefeated
            ? `${player.name} defeated ${target.name}!`
            : `${player.name} attacked ${target.name}!`,
          target: target.id,
          damage: damage,
          remainingHp: target.stats.hp,
          isDefeated: isDefeated,
        };
      } else {
        return { success: false, message: "Nothing to interact with" };
      }
    } else {
      return { success: false, message: "Invalid action type" };
    }
  }

  // Calculate damage based on player stats and item used
  calculateDamage(player, itemType, target) {
    // For simplicity, use fixed damage values
    const itemDamageMap = {
      pickaxe: 10,
      sword: 15,
      // Add more items and their damage values
    };
    return itemDamageMap[itemType] || 5; // Default damage if item not found
  }

  // Handle player death logic
  handlePlayerDeath(playerId) {
    const player = this.players[playerId];
    if (player) {
      // Reset player position and health
      player.position = { x: 1, y: 1, z: 1 };
      player.stats.hp = player.stats.maxHp;
      // Optionally clear inventory or apply penalties
      // Broadcast death event if needed
    }
  }

  getWorldChunk(playerPos) {
    // Return chunk data around the player's current position
    const chunk = {};
    for (let x = playerPos.x - 64; x < playerPos.x + 64; x++) {
      for (let y = playerPos.y - 64; y < playerPos.y + 64; y++) {
        for (let z = 0; z < this.layers; z++) {
          chunk[`${x},${y},${z}`] = this.world[`${x},${y},${z}`];
        }
      }
    }
    return chunk;
  }
}

export default WorldManager;
