// models/World.js
import Perlin from "perlin-noise";
import { Item } from "./Item.js";
import { PLAYER_RADIUS, CHUNK_SIZE, LAYERS } from "../../shared/constants.js";
import { Entity } from "../../shared/Entities.js";
import { getChunkKey } from "../utils/helpers.js";
import { Player } from "./Player.js";
import BroadcastService from "../services/BroadcastService.js";

export class World {
  constructor(chunkSize, layers) {
    this.chunkSize = chunkSize;
    this.layers = layers;
    this.players = {};
    this.world = this.generateWorld();
    this.ITEMS = this.defineItems();
  }

  defineItems() {
    return {
      pickaxe: new Item("item_pickaxe", "Pickaxe", null, "tool", {
        actionType: "hit",
      }),
      sword: new Item("item_sword", "Sword", null, "weapon", {
        actionType: "hit",
      }),
      healthPotion: new Item(
        "item_healthPotion",
        "Health Potion",
        null,
        "consumable",
        { actionType: "consume", effect: "heal", amount: 50 }
      ),
    };
  }

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

        world[`${x},${y},0`] = {
          material: groundMaterial,
          type: groundMaterial === "water" ? "water" : "ground",
        };

        if (groundMaterial !== "water" && groundMaterial !== "gravel") {
          let obstacleChance = Math.random();
          if (obstacleChance < 0.05) {
            world[`${x},${y},1`] = { material: "tree", type: "solid" };
          } else if (obstacleChance < 0.075) {
            world[`${x},${y},1`] = { material: "rock", type: "solid" };
          } else if (obstacleChance < 0.077) {
            const healthPotion = new Item(
              `item_healthPotion_${x}_${y}`,
              "Health Potion",
              { x: x, y: y, z: 1 },
              "consumable",
              { actionType: "consume", effect: "heal", amount: 50 }
            );
            world[`${x},${y},1`] = {
              material: healthPotion.name,
              type: "item",
              item: healthPotion,
            };
          } else {
            world[`${x},${y},1`] = { material: "none", type: "empty" };
          }
        } else if (groundMaterial === "gravel") {
          world[`${x},${y},1`] = { material: "stone", type: "solid" };
        } else {
          world[`${x},${y},1`] = { material: "none", type: "empty" };
        }

        world[`${x},${y},2`] = { material: "none", type: "empty" };
      }
    }
    return world;
  }

  isNameTaken(name) {
    return Object.values(this.players).some((player) => player.name === name);
  }

  addPlayer(id, name) {
    const playerInventory = [
      this.ITEMS.pickaxe,
      this.ITEMS.sword,
      new Item(`item_healthPotion_${id}`, "Health Potion", null, "consumable", {
        actionType: "consume",
        effect: "heal",
        amount: 50,
      }),
    ];

    this.players[id] = new Player(
      id,
      name,
      { x: 1, y: 1, z: 1 },
      { hp: 100, maxHp: 100 },
      { inventory: playerInventory }
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
        return player.position;
      }

      const ground = this.world[`${newPos.x},${newPos.y},0`];
      if (!ground || ground.type !== "ground") {
        return player.position;
      }

      player.move(newPos);
      return player.position;
    } else {
      return { x: 1, y: 1, z: 1 };
    }
  }

  handleInteraction(id, targetPos, itemType) {
    const player = this.players[id];
    if (player) {
      const distance = Math.hypot(
        player.position.x - targetPos.x,
        player.position.y - targetPos.y
      );

      if (distance <= PLAYER_RADIUS) {
        const item = this.getItemFromInventory(player, itemType);
        if (!item && itemType !== "hand") {
          return { success: false, message: "You don't have that item!" };
        }

        const actionType =
          itemType === "hand" ? "use" : item.properties.actionType;
        const targetInfo = this.getTargetInfo(id, targetPos);

        return this.handleAction(
          player,
          actionType,
          targetInfo,
          targetPos,
          item
        );
      } else {
        return { success: false, message: "Target is out of reach" };
      }
    }
    return { success: false, message: "Invalid player" };
  }

  getItemFromInventory(player, itemType) {
    return player.contents.inventory.find(
      (invItem) =>
        invItem.name.toLowerCase() === itemType.toLowerCase() &&
        invItem instanceof Item
    );
  }

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
      return { type: targetBlock.type, target: targetBlock };
    } else {
      return { type: "none", target: null };
    }
  }

  handleAction(player, actionType, targetInfo, targetPos, item) {
    const { type: targetType, target } = targetInfo;

    if (actionType === "use") {
      if (targetType === "item") {
        player.addItem(target.item);
        delete this.world[`${targetPos.x},${targetPos.y},${targetPos.z}`];
        return {
          success: true,
          type: "pickup",
          message: `${player.name} picked up ${target.item.name}`,
          item: target.item,
          inventory: player.contents.inventory,
        };
      } else if (targetType === "player") {
        return {
          success: true,
          type: "use",
          message: `${player.name} waved at ${target.name}`,
        };
      } else {
        return { success: false, message: "Nothing to interact with" };
      }
    } else if (actionType === "hit") {
      if (targetType === "solid") {
        const minedItem = new Item(
          `block_${target.material}_${targetPos.x}_${targetPos.y}`,
          target.material,
          null,
          "block",
          {}
        );
        player.addItem(minedItem);
        this.world[`${targetPos.x},${targetPos.y},${targetPos.z}`] = {
          material: "none",
          type: "empty",
        };
        return {
          success: true,
          type: "mine",
          message: "Block mined!",
          block: target,
          inventory: player.contents.inventory,
        };
      } else if (targetType === "player") {
        const damage = this.calculateDamage(player, item, target);
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
    } else if (actionType === "consume") {
      if (item.itemType === "consumable" && item.properties.effect === "heal") {
        const healAmount = item.properties.amount;
        player.stats.hp = Math.min(
          player.stats.hp + healAmount,
          player.stats.maxHp
        );
        this.removeItemFromInventory(player, item);
        return {
          success: true,
          type: "consume",
          message: `${player.name} used a ${item.name} and healed ${healAmount} HP!`,
          hp: player.stats.hp,
          inventory: player.contents.inventory,
        };
      } else {
        return { success: false, message: "Cannot consume this item" };
      }
    } else {
      return { success: false, message: "Invalid action type" };
    }
  }

  removeItemFromInventory(player, item) {
    const index = player.contents.inventory.findIndex(
      (invItem) => invItem.id === item.id
    );
    if (index !== -1) {
      player.contents.inventory.splice(index, 1);
    }
  }

  calculateDamage(player, item, target) {
    const itemDamageMap = {
      pickaxe: 10,
      sword: 15,
    };
    const baseDamage = itemDamageMap[item.name.toLowerCase()] || 5;
    return baseDamage;
  }

  handlePlayerDeath(playerId) {
    const player = this.players[playerId];
    if (player) {
      const deathPos = { ...player.position };

      player.contents.inventory.forEach((item) => {
        const offsetX = Math.floor(Math.random() * 5) - 2;
        const offsetY = Math.floor(Math.random() * 5) - 2;
        const dropX = deathPos.x + offsetX;
        const dropY = deathPos.y + offsetY;
        const dropZ = 1;

        const dropKey = `${dropX},${dropY},${dropZ}`;

        if (this.world[dropKey] && this.world[dropKey].type === "item") {
          let found = false;
          for (let dx = -1; dx <= 1 && !found; dx++) {
            for (let dy = -1; dy <= 1 && !found; dy++) {
              const newX = dropX + dx;
              const newY = dropY + dy;
              const newKey = `${newX},${newY},${dropZ}`;
              if (
                !this.world[newKey] ||
                this.world[newKey].type === "empty" ||
                this.world[newKey].type === "item"
              ) {
                this.world[newKey] = {
                  material: item.name,
                  type: "item",
                  item: item,
                };
                found = true;
              }
            }
          }
          if (!found) {
            this.world[dropKey] = {
              material: item.name,
              type: "item",
              item: item,
            };
          }
        } else {
          this.world[dropKey] = {
            material: item.name,
            type: "item",
            item: item,
          };
        }
      });

      player.contents.inventory = [];
      player.position = { x: 1, y: 1, z: 1 };
      player.stats.hp = player.stats.maxHp;
    }
  }

  getWorldChunk(playerPos) {
    const chunk = {};
    for (let x = playerPos.x - 64; x < playerPos.x + 64; x++) {
      for (let y = playerPos.y - 64; y < playerPos.y + 64; y++) {
        for (let z = 0; z < this.layers; z++) {
          const key = `${x},${y},${z}`;
          chunk[key] = this.world[key];
        }
      }
    }
    return chunk;
  }

  updateWorld(key, data) {
    this.world[key] = data;
    const [x, y] = key.split(",").map(Number);
    const chunkKey = getChunkKey({ x, y });
    BroadcastService.broadcastWorldUpdate(chunkKey, { [key]: data });
  }
}
