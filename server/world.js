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
    this.loadEntities();
  }

  loadOrCreateDungeon() {
    const dungeonPath = path.join(__dirname, "dungeon.json");
    if (fs.existsSync(dungeonPath)) {
      console.log("Dungeon loaded from file.");
      return JSON.parse(fs.readFileSync(dungeonPath, "utf-8"));
    } else {
      const dungeonWidth = 100;
      const dungeonHeight = 100;
      const dungeon = generateDungeon(dungeonWidth, dungeonHeight);
      fs.writeFileSync(dungeonPath, JSON.stringify(dungeon));
      console.log("Dungeon generated and saved to file.");
      return dungeon;
    }
  }

  loadEntities() {
    // Load monsters
    const monstersData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data", "monsters.json"), "utf-8")
    );
    monstersData.forEach((monsterData) => {
      const monster = new Monster(
        monsterData.id,
        monsterData.name,
        monsterData.x,
        monsterData.y,
        monsterData.stats,
        monsterData.aiState,
        monsterData.inventory
      );
      this.monsters[monster.id] = monster;
    });

    // Load items
    const itemsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data", "items.json"), "utf-8")
    );
    itemsData.forEach((itemData) => {
      const item = new Item(
        itemData.id,
        itemData.name,
        itemData.type,
        itemData.stats
      );
      this.items[item.id] = item;
    });

    // Load chests
    const chestsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data", "chests.json"), "utf-8")
    );
    chestsData.forEach((chestData) => {
      this.chests[chestData.id] = {
        x: chestData.x,
        y: chestData.y,
        inventory: chestData.inventory.map((itemId) => this.items[itemId]),
      };
    });
  }

  addPlayer(socketId, playerName) {
    const startX = Math.floor(Math.random() * this.dungeon[0].length) * 32;
    const startY = Math.floor(Math.random() * this.dungeon.length) * 32;
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
      monster.updateAI(playerArray);
    });
  }

  // Other world-related methods can be added here
}

module.exports = World;
