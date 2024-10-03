// worldManager.js
import { World } from "./models/World.js";
import logger from "./utils/logger.js";

const CHUNK_SIZE = { width: 100, height: 100 };
const LAYERS = 3;

class WorldManagerClass {
  constructor() {
    this.world = new World(CHUNK_SIZE, LAYERS);
  }

  initialize() {
    // Any initialization logic if needed
  }

  isNameTaken(name) {
    return this.world.isNameTaken(name);
  }

  addPlayer(id, name) {
    return this.world.addPlayer(id, name);
  }

  removePlayer(id) {
    this.world.removePlayer(id);
  }

  movePlayer(id, direction) {
    return this.world.movePlayer(id, direction);
  }

  handleInteraction(id, targetPos, itemType) {
    return this.world.handleInteraction(id, targetPos, itemType);
  }

  handlePlayerDeath(playerId) {
    this.world.handlePlayerDeath(playerId);
  }

  getWorldChunk(playerPos) {
    return this.world.getWorldChunk(playerPos);
  }
}

const WorldManager = new WorldManagerClass();

export default WorldManager;
