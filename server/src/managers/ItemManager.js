// server/src/managers/ItemManager.js

const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

class ItemManager {
  constructor(gameManager, io) {
    this.gameManager = gameManager;
    this.io = io;
    this.items = [];

    // Configuration Parameters
    this.MIN_DISTANCE_BETWEEN_ITEMS = 1; // Minimum distance between items
    this.CENTRAL_EXCLUSION_RADIUS = 0; // Radius around the center of the room to exclude
    this.MAX_PLACEMENT_ATTEMPTS = 10; // Maximum attempts to place an item

    // Load item definitions from JSON
    this.itemDefinitions = this.loadItemDefinitions();
  }

  /**
   * Loads item definitions from a JSON file.
   * @returns {Object} - The item definitions.
   */
  loadItemDefinitions() {
    const itemsPath = path.join(
      __dirname,
      "..",
      "config",
      "../models/items.json"
    );
    try {
      const data = fs.readFileSync(itemsPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to load item definitions:", error);
      return {
        weapons: [],
        potions: [],
        misc: [],
      };
    }
  }

  /**
   * Scatters initial items in the dungeon.
   * @param {Object} dungeon - The dungeon object containing rooms.
   * @param {Array<string>} weaponNames - Array of weapon names to scatter.
   * @param {Array<string>} potionNames - Array of potion names to scatter.
   */
  scatterInitialItems(dungeon) {
    this.scatterItems(dungeon, ["gun", "sword"], "weapons");
    this.scatterItems(dungeon, ["health_potion", "mana_potion"], "potions");
  }

  /**
   * Scatters items of a specific category in the dungeon.
   * @param {Object} dungeon - The dungeon object containing rooms.
   * @param {Array<string>} itemNames - Array of item names to scatter.
   * @param {string} category - Category of items (e.g., 'weapons', 'potions').
   */
  scatterItems(dungeon, itemNames, category) {
    if (!dungeon.rooms || dungeon.rooms.length === 0) return;

    dungeon.rooms.forEach((room, index) => {
      if (itemNames.length === 0) return;

      const randomIndex = Math.floor(Math.random() * itemNames.length);
      const itemName = itemNames[randomIndex];
      const itemDef = this.itemDefinitions[category].find(
        (item) => item.name === itemName
      );

      if (!itemDef) {
        console.warn(
          `Item definition not found for ${itemName} in category ${category}`
        );
        return;
      }

      const position = this.getRandomPositionInRoom(room);

      if (position) {
        const item = {
          id: uuidv4(),
          name: itemDef.name,
          type: itemDef.type,
          class: itemDef.class,
          stats: itemDef.stats,
          description: itemDef.description,
          position: {
            x: position.x,
            y: 0, // Assuming ground level
            z: position.z,
          },
        };
        this.items.push(item);
        this.io.to("overworld").emit("itemAdded", item);
        console.log(
          `${category.slice(0, -1).capitalize()} scattered: ${item.name} at (${
            item.position.x
          }, ${item.position.z})`
        );
      } else {
        console.warn(
          `Failed to place item (${itemName}) in room (${room.x}, ${room.z})`
        );
      }
    });
  }

  /**
   * Generates a random position within the given room, excluding the central area,
   * and ensures no overlap with existing items.
   * @param {Object} room - The room object containing x, z, width, and height.
   * @returns {Object|null} - The position object {x, z} or null if placement fails.
   */
  getRandomPositionInRoom(room) {
    const width = room.width || 5; // Assuming room has width and height properties
    const height = room.height || 5;
    const { x: roomCenterX, z: roomCenterZ } = room;

    for (let attempt = 0; attempt < this.MAX_PLACEMENT_ATTEMPTS; attempt++) {
      // Generate random offsets within room boundaries, excluding central exclusion zone
      const offsetX =
        (Math.random() - 0.5) * (width - 2 * this.CENTRAL_EXCLUSION_RADIUS);
      const offsetZ =
        (Math.random() - 0.5) * (height - 2 * this.CENTRAL_EXCLUSION_RADIUS);

      const posX = roomCenterX + offsetX;
      const posZ = roomCenterZ + offsetZ;
      // Check if the position is valid (no overlap)
      if (this.isPositionValid(posX, posZ)) {
        return { x: posX, z: posZ };
      }
    }

    // If no valid position is found after maximum attempts
    return null;
  }

  /**
   * Checks whether the given position is valid for placing a new item.
   * It ensures that the position is not too close to existing items.
   * @param {number} x - The x-coordinate of the position.
   * @param {number} z - The z-coordinate of the position.
   * @returns {boolean} - True if the position is valid, false otherwise.
   */
  isPositionValid(x, z) {
    for (const item of this.items) {
      const dx = item.position.x - x;
      const dz = item.position.z - z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < this.MIN_DISTANCE_BETWEEN_ITEMS) {
        return false; // Too close to another item
      }
    }
    return true; // Position is valid
  }

  /**
   * Handles the pickup of an item by a player.
   * @param {string} socketId - The player's socket ID.
   * @param {string} itemId - The ID of the item to pick up.
   * @param {Function} callback - The callback function to execute after pickup.
   */
  pickupItem(socketId, itemId, callback) {
    const player = this.gameManager.players[socketId];
    const itemIndex = this.items.findIndex((item) => item.id === itemId);
    if (itemIndex !== -1 && player) {
      const item = this.items[itemIndex];
      player.inventory.push(item);
      if (player.equippedIndex === -1) {
        player.equippedIndex = 0;
      }
      this.io.to(socketId).emit("inventoryUpdated", player.inventory);

      // Remove item from the world
      this.items.splice(itemIndex, 1);
      this.io.to("overworld").emit("itemRemoved", { itemId });

      // Rescatter items if necessary
      if (this.items.length < 10) {
        // Threshold can be adjusted
        this.scatterItems(
          this.gameManager.dungeon,
          ["sword", "gun"],
          "weapons"
        );
        this.scatterItems(
          this.gameManager.dungeon,
          ["health_potion", "mana_potion"],
          "potions"
        );
      }

      callback({ status: "ok" });
    } else {
      callback({
        status: "error",
        message: "Item not found or player invalid",
      });
    }
  }

  /**
   * Spawns a corpse at the specified position.
   * @param {Object} position - The position object {x, z}.
   */
  spawnCorpse(position) {
    const corpseDef = this.itemDefinitions.misc.find(
      (item) => item.name === "corpse"
    );
    if (!corpseDef) {
      console.warn("Corpse definition not found.");
      return;
    }

    const corpse = {
      id: uuidv4(),
      name: corpseDef.name,
      type: corpseDef.type,
      stats: corpseDef.stats,
      description: corpseDef.description,
      position: { ...position },
    };
    this.items.push(corpse);
    this.io.to("overworld").emit("itemAdded", corpse);
    console.log(
      `Corpse spawned at (${corpse.position.x}, ${corpse.position.z})`
    );
  }
}

// Helper function to capitalize the first letter
String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

module.exports = ItemManager;
