const Perlin = require("perlin-noise");
const CONSTANTS = require("../shared/constants");
const { Entity } = require("../shared/Entites");

class WorldManager {
  constructor(chunkSize, layers) {
    this.chunkSize = chunkSize;
    this.layers = layers;
    this.players = {};
    this.world = this.generateWorld();
  }

  // worldManager.js

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
    this.players[id] = new Entity(id, name, { x: 1, y: 1, z: 1 }, {}, {});
    return this.players[id];
  }

  removePlayer(id) {
    delete this.players[id];
  }

  movePlayer(id, direction) {
    const player = this.players[id];
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
  }

  handleInteraction(id, targetPos) {
    const player = this.players[id];
    const distance = Math.hypot(
      player.position.x - targetPos.x,
      player.position.y - targetPos.y
    );

    if (distance <= CONSTANTS.PLAYER_RADIUS) {
      const key = `${targetPos.x},${targetPos.y},1`;
      const block = this.world[key];

      if (block && block.type === "solid") {
        this.world[key] = { material: "none", type: "empty" };
        return { success: true, message: "Block mined!" };
      }
    }
    return { success: false, message: "Out of reach or invalid action" };
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

module.exports = WorldManager;
