// models/monster.js

const Entity = require("./entity");

class Monster extends Entity {
  constructor(id, name, x, y, stats, aiState, inventory) {
    super(id, name, x, y, stats);
    this.aiState = aiState || "idle";
    this.inventory = inventory || [];
    // You can add more properties like aggression level, patrol routes, etc.
  }

  // Monster-specific methods like AI behaviors
  updateAI(targets, world) {
    const detectionRange = 160; // 5 tiles * 32 pixels per tile
    let targetPlayer = null;
    let minDistance = Infinity;

    // Find the nearest player within detection range
    for (const player of targets) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < detectionRange && distance < minDistance) {
        minDistance = distance;
        targetPlayer = player;
      }
    }

    if (targetPlayer) {
      // Player is within detection range; move towards them
      this.moveToward(targetPlayer.x, targetPlayer.y, world);
    } else {
      // Random walk
      this.randomMove(world);
    }
  }

  moveToward(targetX, targetY, world) {
    const speed = this.stats.speed || 32; // Move one tile (32 pixels) at a time

    let dx = targetX - this.x;
    let dy = targetY - this.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Attempt to move horizontally
      const moveX = dx > 0 ? speed : -speed;
      const newX = this.x + moveX;
      if (world.isTileOpen(newX, this.y)) {
        this.x = newX;
      } else if (world.isTileOpen(this.x, this.y + (dy > 0 ? speed : -speed))) {
        // If blocked, attempt to move vertically
        this.y += dy > 0 ? speed : -speed;
      }
    } else {
      // Attempt to move vertically
      const moveY = dy > 0 ? speed : -speed;
      const newY = this.y + moveY;
      if (world.isTileOpen(this.x, newY)) {
        this.y = newY;
      } else if (world.isTileOpen(this.x + (dx > 0 ? speed : -speed), this.y)) {
        // If blocked, attempt to move horizontally
        this.x += dx > 0 ? speed : -speed;
      }
    }
  }

  randomMove(world) {
    const directions = [
      { dx: -1, dy: 0 }, // Left
      { dx: 1, dy: 0 }, // Right
      { dx: 0, dy: -1 }, // Up
      { dx: 0, dy: 1 }, // Down
    ];

    const speed = this.stats.speed || 32; // Move one tile at a time
    const dir = directions[Math.floor(Math.random() * directions.length)];

    const newX = this.x + dir.dx * speed;
    const newY = this.y + dir.dy * speed;

    if (world.isTileOpen(newX, newY)) {
      this.x = newX;
      this.y = newY;
    }
  }
}

module.exports = Monster;
