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

  generateWorld() {
    const world = {};
    const noise = Perlin.generatePerlinNoise(
      this.chunkSize.width,
      this.chunkSize.height
    );

    for (let x = 0; x < this.chunkSize.width; x++) {
      for (let y = 0; y < this.chunkSize.height; y++) {
        let height = Math.floor(
          noise[x * this.chunkSize.height + y] * this.layers
        );

        for (let z = 0; z < this.layers; z++) {
          if (z < height) {
            // Different tile types based on height (e.g., stone, dirt, grass)
            if (z < height - 2) {
              world[`${x},${y},${z}`] = { material: "stone", type: "solid" };
            } else if (z === height - 1) {
              world[`${x},${y},${z}`] = { material: "dirt", type: "solid" };
            } else {
              world[`${x},${y},${z}`] = { material: "grass", type: "solid" };
            }
          } else {
            world[`${x},${y},${z}`] = { material: "grass", type: "solid" };
          }
        }
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
    const isValidMove =
      this.world[`${newPos.x},${newPos.y},${newPos.z}`] !== undefined &&
      this.world[`${newPos.x},${newPos.y},${newPos.z}`].type === "solid";
    if (isValidMove) {
      player.move(newPos);
    }
    return player.position;
  }

  handleInteraction(id, targetPos) {
    // console.log("handling interaction", id, targetPos);
    // const player = this.players[id];
    // const distance = Math.hypot(
    //   player.position.x - targetPos.x,
    //   player.position.y - targetPos.y
    // );
    // if (distance <= CONSTANTS.PLAYER_RADIUS) {
    //   // check if entity at position
    //   console.log(
    //     "entity at",
    //     `${targetPos.x},${targetPos.y},${targetPos.z}`,
    //     this.world[`${targetPos.x},${targetPos.y},${targetPos.z}`],
    //     this.items[`${targetPos.x},${targetPos.y},${targetPos.z}`],
    //     this.npcs[`${targetPos.x},${targetPos.y},${targetPos.z}`]
    //   );
    //   // otherwise block
    //   if (
    //     this.world[`${targetPos.x},${targetPos.y},${targetPos.z}`].type ===
    //     "solid"
    //   ) {
    //     this.world[`${targetPos.x},${targetPos.y},${targetPos.z}`] = {
    //       material: "none",
    //       type: "empty",
    //     };
    //     return { success: true, message: "Block mined!" };
    //   }
    // }
    // return { success: false, message: "Out of reach or invalid action" };
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
