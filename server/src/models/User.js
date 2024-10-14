// server/src/models/User.js

class User {
  constructor({
    username,
    currentLocation = "overworld",
    position = { x: 0, y: 0, z: 0 },
    inventory = [],
    stats = { health: 100, mana: 100, level: 1, experience: 0 },
  }) {
    this.username = username;
    this.currentLocation = currentLocation;
    this.position = position;
    this.inventory = inventory;
    this.stats = stats;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  updateTimestamps() {
    this.updatedAt = new Date();
  }
}

module.exports = User;
