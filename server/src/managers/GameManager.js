// server/src/managers/GameManager.js

const PlayerManager = require("./PlayerManager");
const NPCManager = require("./NPCManager");
const ItemManager = require("./ItemManager");
const DungeonGenerator = require("../utils/generateDungeon");
const { calculateDistance } = require("../utils/collision");

class GameManager {
  constructor(io) {
    this.io = io;
    this.players = {};
    this.npcManager = new NPCManager(this, io);
    this.itemManager = new ItemManager(this, io);
    this.dungeon = DungeonGenerator();
    this.gameLoopInterval = null;

    // Initialize managers with initial game state
    this.playerManager = new PlayerManager(this, io);
    this.itemManager.scatterInitialItems(this.dungeon);
    this.npcManager.initializeNPCs(this.dungeon);
  }

  startGameLoop() {
    const FPS = 10; // Adjust as needed
    this.gameLoopInterval = setInterval(() => {
      this.npcManager.updateNPCs(this.players);
    }, 1000 / FPS);
  }

  stopGameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
  }

  addPlayer(socket, userData) {
    this.playerManager.addPlayer(socket, userData);
  }

  removePlayer(socketId) {
    this.playerManager.removePlayer(socketId);
  }

  handlePlayerMove(socketId, position) {
    this.playerManager.movePlayer(socketId, position);
  }

  handlePlayerAttack(socketId, attackData) {
    this.playerManager.attack(socketId, attackData);
  }
  handlePlayerUseItem(socketId, direction) {
    this.playerManager.useItem(socketId, direction);
  }
  handlePlayerReadyItem(socketId, index, callback) {
    this.playerManager.readyItem(socketId, index, callback);
  }

  handlePlayerPickup(socketId, itemId, callback) {
    this.itemManager.pickupItem(socketId, itemId, callback);
  }

  handleChatMessage(socketId, message) {
    this.playerManager.sendChatMessage(socketId, message);
  }

  handlePlayerDeath(playerId) {
    this.playerManager.handleDeath(playerId);
  }

  // Additional methods for interacting with NPCs and Items can be added here
}

module.exports = GameManager;
