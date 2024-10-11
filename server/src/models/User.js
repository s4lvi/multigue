// server/src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  currentLocation: { type: String, default: 'overworld' },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 }
  },
  inventory: [{ type: String }],
  stats: {
    health: { type: Number, default: 100 },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 }
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
