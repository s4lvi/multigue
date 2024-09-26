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
  updateAI(targets) {
    // Simple AI example: follow the first player in the targets array
    if (this.aiState === "idle" && targets.length > 0) {
      const target = targets[0];
      this.moveToward(target.x, target.y);
    }
  }

  moveToward(targetX, targetY) {
    // Simple movement logic towards a target position
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = this.stats.speed || 1;
    this.x += (dx / distance) * speed;
    this.y += (dy / distance) * speed;
  }
}

module.exports = Monster;
