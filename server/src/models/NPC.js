// server/src/models/NPC.js

const { v4: uuidv4 } = require("uuid");
const { calculateDistance } = require("../utils/collision");

class NPC {
  constructor({ type = "goblin", position }) {
    this.id = uuidv4();
    this.type = type;
    this.position = position || { x: 0, y: 0, z: 0 };
    this.stats = { health: 100, damage: 10, speed: 2 };
    this.state = "roaming"; // "roaming" or "chasing"
    this.targetPlayerId = null;
    this.direction = null;
  }

  updateState(players) {
    const detectionRange = 10;
    let closestPlayer = null;
    let minDistance = Infinity;

    for (const [id, player] of Object.entries(players)) {
      const distance = calculateDistance(this.position, player.position);
      if (distance < detectionRange && distance < minDistance) {
        closestPlayer = player;
        minDistance = distance;
      }
    }

    if (closestPlayer) {
      this.state = "chasing";
      this.targetPlayerId = closestPlayer.userId;
    } else {
      this.state = "roaming";
      this.targetPlayerId = null;
    }
  }

  move(dungeonGrid, players) {
    if (this.state === "roaming") {
      this.roam(dungeonGrid);
    } else if (this.state === "chasing" && this.targetPlayerId) {
      this.chase(players[this.targetPlayerId], dungeonGrid);
    }
  }

  roam(dungeonGrid) {
    if (!this.direction || Math.random() < 0.02) {
      const angle = Math.random() * Math.PI * 2;
      this.direction = {
        x: Math.cos(angle),
        z: Math.sin(angle),
      };
    }

    const speed = this.stats.speed * 0.1; // Assuming deltaTime of 0.1
    const newPos = {
      x: this.position.x + this.direction.x * speed,
      y: this.position.y,
      z: this.position.z + this.direction.z * speed,
    };

    if (checkCollision(newPos, dungeonGrid)) {
      this.position = newPos;
    } else {
      this.direction = null;
    }
  }

  chase(targetPlayer, dungeonGrid) {
    const directionVector = {
      x: targetPlayer.position.x - this.position.x,
      y: 0,
      z: targetPlayer.position.z - this.position.z,
    };
    const length = Math.sqrt(directionVector.x ** 2 + directionVector.z ** 2);
    const normalizedDir = {
      x: directionVector.x / length,
      y: directionVector.y / length,
      z: directionVector.z / length,
    };

    const speed = this.stats.speed * 1.5 * 0.1; // Chase faster, assuming deltaTime of 0.1
    const newPos = {
      x: this.position.x + normalizedDir.x * speed,
      y: this.position.y,
      z: this.position.z + normalizedDir.z * speed,
    };

    if (checkCollision(newPos, dungeonGrid)) {
      this.position = newPos;
    }

    const distance = calculateDistance(this.position, targetPlayer.position);
    if (distance < 1.5) {
      this.attack(targetPlayer);
    }
  }

  attack(targetPlayer) {
    targetPlayer.stats.health -= this.stats.damage;
    // The GameManager handles emitting events related to player hits and deaths
  }

  takeDamage(damage) {
    this.stats.health -= damage;
  }
}

// Reuse the collision check function from utils
const { checkCollision } = require("../utils/collision");

module.exports = NPC;
