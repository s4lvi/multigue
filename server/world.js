// world.js

const { generateDungeon } = require("./dungeonGenerator");
const Player = require("./models/player");
const Monster = require("./models/monster");
const Item = require("./models/item");
const fs = require("fs");
const path = require("path");

class World {
  constructor(io) {
    this.players = {};
    this.monsters = {};
    this.items = {};
    this.chests = {};
    this.dungeon = this.loadOrCreateDungeon();
    this.loadEntityTypes();
    this.instantiateEntities();
    this.io = io;
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
          monsterType.inventory.slice(),
          monsterType.type,
          monsterType.detectionRange,
          monsterType.attackRange
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

  attack(attackMessage, callback) {
    let attacker;
    if (attackMessage.type === "player") {
      console.log(attackMessage);
      console.log(this.players);
      console.log(this.players[attackMessage.attacker]);
      attacker = this.players[attackMessage.attacker];
    } else {
      attacker = this.monsters[attackMessage.attacker];
    }
    const targetPlayer = this.players[attackMessage.target];
    const targetMonster = this.monsters[attackMessage.target];
    if (attacker && (targetPlayer || targetMonster)) {
      let target;
      if (targetPlayer) {
        target = targetPlayer;
      } else {
        target = targetMonster;
      }

      const damage = Math.max(attacker.stats.attack - target.stats.defense, 1);
      target.stats.hp -= damage;

      this.io.emit("chatMessage", {
        text: `${attacker.name} attacked ${target.name} for ${damage} damage.`,
      });

      if (target.stats.hp <= 0) {
        // Handle target death
        this.io.emit("entityDied", target.id);

        if (targetPlayer) {
          // Respawn player
          target.stats.hp = 100;
          target.x = Math.floor(Math.random() * this.dungeon[0].length) * 32;
          target.y = Math.floor(Math.random() * this.dungeon.length) * 32;
          this.io.emit("playerRespawned", target);
        } else if (targetMonster) {
          // Remove monster from the world

          const body = new Item(
            target.id,
            target.name + " body",
            "blood",
            {},
            target.x,
            target.y
          );
          this.items[target.id] = body;
          this.io.emit("itemsData", this.items);
          this.monsters[target.id].active = false;
          this.io.emit("monstersData", this.monsters);
          this.io.emit("chatMessage", {
            text: `${attacker.name} killed ${target.name}`,
          });
          delete this.monsters[target.id];
        }
      } else {
        // Update target's stats
        if (targetPlayer) {
          this.io.emit("playerStatsUpdate", target);
        } else if (targetMonster) {
          this.io.emit("monsterStatsUpdate", target);
        }
      }
      callback({ status: "ok" });
    } else {
      callback({ status: "error", message: "Invalid attacker or target." });
    }
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
