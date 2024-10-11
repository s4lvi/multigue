// // server/src/models/User.js
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   username: { type: String, unique: true, required: true },
//   currentLocation: { type: String, default: 'overworld' },
//   position: {
//     x: { type: Number, default: 0 },
//     y: { type: Number, default: 0 },
//     z: { type: Number, default: 0 }
//   },
//   inventory: [{ type: String }],
//   stats: {
//     health: { type: Number, default: 100 },
//     level: { type: Number, default: 1 },
//     experience: { type: Number, default: 0 }
//   },
// }, { timestamps: true });

// module.exports = mongoose.model('User', userSchema);

// Plain JavaScript Model: server/models/User.js

class User {
  constructor({
    username,
    currentLocation = "overworld",
    position = { x: 0, y: 0, z: 0 },
    inventory = [],
    stats = { health: 100, level: 1, experience: 0 },
  }) {
    this.username = username;
    this.currentLocation = currentLocation;
    this.position = position;
    this.inventory = inventory;
    this.stats = stats;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Method to update timestamps
  updateTimestamps() {
    this.updatedAt = new Date();
  }
}

module.exports = User;
