// models/item.js

class Item {
  constructor(id, name, type, stats) {
    this.id = id;
    this.name = name;
    this.type = type; // e.g., 'weapon', 'armor', 'consumable'
    this.stats = stats || {};
  }

  // Item-specific methods if needed
}

module.exports = Item;
