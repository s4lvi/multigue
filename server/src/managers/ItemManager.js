// server/src/managers/ItemManager.js

const { v4: uuidv4 } = require("uuid");

class ItemManager {
  constructor(gameManager, io) {
    this.gameManager = gameManager;
    this.io = io;
    this.items = [];
  }

  scatterInitialItems(dungeon) {
    this.scatterWeapons(dungeon);
    this.scatterPotions(dungeon);
  }

  scatterWeapons(dungeon) {
    if (!dungeon.rooms || dungeon.rooms.length === 0) return;

    dungeon.rooms.forEach((room) => {
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
      this.items.push(item);
      this.io.to("overworld").emit("itemAdded", item);
    });
  }

  scatterPotions(dungeon) {
    if (!dungeon.rooms || dungeon.rooms.length === 0) return;

    const potionTypes = ["health_potion", "mana_potion"];
    dungeon.rooms.forEach((room) => {
      if (Math.random() < 0.3) {
        // 30% chance to place a potion
        const itemType =
          potionTypes[Math.floor(Math.random() * potionTypes.length)];
        const potion = {
          id: uuidv4(),
          type: itemType,
          position: {
            x: room.x + (Math.random() - 0.5) * room.width,
            y: 0,
            z: room.z + (Math.random() - 0.5) * room.height,
          },
        };
        this.items.push(potion);
        this.io.to("overworld").emit("itemAdded", potion);
      }
    });
  }

  pickupItem(socketId, itemId, callback) {
    const player = this.gameManager.players[socketId];
    const itemIndex = this.items.findIndex((item) => item.id === itemId);
    if (itemIndex !== -1 && player) {
      const item = this.items[itemIndex];
      // Apply item effect based on type
      if (item.type === "health_potion") {
        player.stats.health = Math.min(player.stats.health + 50, 100);
        this.io.to(socketId).emit("statsUpdated", player.stats);
      } else if (item.type === "mana_potion") {
        player.stats.mana = Math.min((player.stats.mana || 0) + 30, 100);
        this.io.to(socketId).emit("statsUpdated", player.stats);
      } else {
        player.inventory.push(item);
        if (player.equippedIndex === -1) {
          player.equippedIndex = 0;
        }
        this.io.to(socketId).emit("inventoryUpdated", player.inventory);
      }

      // Remove item from the world
      this.items.splice(itemIndex, 1);
      this.io.to("overworld").emit("itemRemoved", { itemId });

      // Rescatter items if necessary
      if (this.items.length < 10) {
        // Threshold can be adjusted
        this.scatterWeapons(this.gameManager.dungeon);
        this.scatterPotions(this.gameManager.dungeon);
      }

      callback({ status: "ok" });
    } else {
      callback({
        status: "error",
        message: "Item not found or player invalid",
      });
    }
  }

  spawnCorpse(position) {
    const corpse = {
      id: uuidv4(),
      type: "corpse",
      position: { ...position },
    };
    this.items.push(corpse);
    this.io.to("overworld").emit("itemAdded", corpse);
  }
}

module.exports = ItemManager;
