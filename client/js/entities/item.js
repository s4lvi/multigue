// js/entities/item.js

import Entity from "./entity.js";

class Item extends Entity {
  constructor(scene, x, y, texture, frame, id, name) {
    super(scene, x, y, texture, frame);
    this.id = id;
    this.name = name;
  }

  // Items may not need an update method
}

export default Item;
