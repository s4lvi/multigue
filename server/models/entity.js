// models/entity.js

class Entity {
  constructor(id, name, x, y, stats) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.stats = stats || {};
  }

  move(newX, newY) {
    this.x = newX;
    this.y = newY;
  }
}

module.exports = Entity;
