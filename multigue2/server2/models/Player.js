// models/Player.js
import { Entity } from "../../shared/Entities.js";

export class Player extends Entity {
  constructor(
    id,
    name,
    position,
    stats = { hp: 100, maxHp: 100 },
    contents = { inventory: [] }
  ) {
    super(id, name, position, stats, contents);
  }

  addItem(item) {
    this.contents.inventory.push(item);
  }

  removeItem(itemId) {
    this.contents.inventory = this.contents.inventory.filter(
      (item) => item.id !== itemId
    );
  }
}
