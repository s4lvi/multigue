// models/player.js

const Entity = require("./entity");

class Player extends Entity {
  constructor(id, name, x, y, stats) {
    super(id, name, x, y, stats);
    this.inventory = [];
    this.equipment = {
      weapon: null,
      armor: null,
    };
    this.currentArea = "dungeon"; // or 'home'
  }

  // Additional player-specific methods can be added here
}

module.exports = Player;
