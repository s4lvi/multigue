// models/item.js
const Entity = require("./entity");

class Item extends Entity {
  constructor(id, name, type, stats, x = 0, y = 0) {
    super(id, name, x, y, stats);
    this.id = id;
    this.name = name;
    this.type = type;
    this.stats = stats || {};
  }

  // Item-specific methods if needed
}

module.exports = Item;
