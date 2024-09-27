// world.js

const { generateDungeon } = require("./dungeonGenerator");
const Player = require("./models/player");
const Monster = require("./models/monster");
const Item = require("./models/item");
const fs = require("fs");
const path = require("path");

class World {
  constructor() {
    this.players = {};
    this.monsters = {};
    this.items = {};
    this.chests = {};
    this.dungeon = this.loadOrCreateDungeon();
    this.loadEntityTypes();
    this.instantiateEntities();
  }

  isTileOpen(x, y) {
    const tileX = Math.floor(x / 32);
    const tileY = Math.floor(y / 32);
    if (
      tileY >= 0 &&
      tileY < this.dungeon.length &&
      tileX >= 0 &&
      tileX < this.dungeon[0].length
    ) {
      const tile = this.dungeon[tileY][tileX];
      // Define which tiles are walkable
      return tile === 0; // Only floor tiles are walkable
    } else {
      return false;
    }
  }

  loadOrCreateDungeon() {
    const dungeonPath = path.join(__dirname, "dungeon.json");
    // if (fs.existsSync(dungeonPath)) {
    //   console.log("Dungeon loaded from file.");
    //   return JSON.parse(fs.readFileSync(dungeonPath, "utf-8"));
    // } else {
    const dungeonWidth = 150;
    const dungeonHeight = 150;
    const dungeon = generateDungeon(dungeonWidth, dungeonHeight);
    fs.writeFileSync(dungeonPath, JSON.stringify(dungeon));
    console.log("Dungeon generated and saved to file.");
    return dungeon;
    // }
  }
  // Load entity types from JSON files
  loadEntityTypes() {
    // Load monster types
    this.monsterTypes = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data", "monsters.json"), "utf-8")
    );

    // Load item types
    this.itemTypes = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data", "items.json"), "utf-8")
    );

    // Load chest types if necessary
  }

  instantiateEntities() {
    // Instantiate monsters
    this.monsterTypes.forEach((monsterType) => {
      const numInstances = randomInt(15, 25); // Adjust the number of instances as needed
      for (let i = 0; i < numInstances; i++) {
        let x, y;
        // Find a random open tile
        do {
          x = randomInt(0, this.dungeon[0].length - 1) * 32;
          y = randomInt(0, this.dungeon.length - 1) * 32;
        } while (!this.isTileOpen(x, y));

        const monsterId = generateUniqueId();
        const monster = new Monster(
          monsterId,
          monsterType.name,
          x,
          y,
          { ...monsterType.stats },
          monsterType.aiState,
          monsterType.inventory.slice()
        );
        this.monsters[monsterId] = monster;
      }
    });
    // Instantiate items
    this.itemTypes.forEach((itemType) => {
      const numInstances = randomInt(3, 7); // Adjust as needed
      for (let i = 0; i < numInstances; i++) {
        let x, y;
        // Find a random open tile
        do {
          x = randomInt(0, this.dungeon[0].length - 1) * 32;
          y = randomInt(0, this.dungeon.length - 1) * 32;
        } while (!this.isTileOpen(x, y));

        const itemId = generateUniqueId();
        const item = new Item(
          itemId,
          itemType.name,
          itemType.itemType,
          { ...itemType.stats },
          x,
          y
        );
        this.items[itemId] = item;
      }
    });

    // Load chests
    // const chestsData = JSON.parse(
    //   fs.readFileSync(path.join(__dirname, "data", "chests.json"), "utf-8")
    // );
    // chestsData.forEach((chestData) => {
    //   this.chests[chestData.id] = {
    //     x: chestData.x,
    //     y: chestData.y,
    //     inventory: chestData.inventory.map((itemId) => this.items[itemId]),
    //   };
    // });
  }

  addPlayer(socketId, playerName) {
    let startX, startY;
    // Find a random open tile
    do {
      startX = randomInt(0, this.dungeon[0].length - 1) * 32;
      startY = randomInt(0, this.dungeon.length - 1) * 32;
    } while (!this.isTileOpen(startX, startY));
    const player = new Player(socketId, playerName, startX, startY, {
      hp: 100,
      attack: 10,
      defense: 5,
    });
    this.players[socketId] = player;
    return player;
  }

  removePlayer(socketId) {
    delete this.players[socketId];
  }

  // Update methods for game logic
  updateMonsters() {
    const playerArray = Object.values(this.players);
    Object.values(this.monsters).forEach((monster) => {
      monster.updateAI(playerArray, this);
    });
  }

  // Other world-related methods can be added here
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

let uniqueIdCounter = 0;
function generateUniqueId() {
  return `entity_${uniqueIdCounter++}`;
}
module.exports = World;
