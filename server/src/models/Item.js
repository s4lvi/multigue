// server/src/models/Item.js

const { v4: uuidv4 } = require("uuid");

class Item {
  constructor({ type, position }) {
    this.id = uuidv4();
    this.type = type;
    this.position = position || { x: 0, y: 0, z: 0 };
  }
}

module.exports = Item;
