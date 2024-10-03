// models/Item.js
import { Entity } from "../../shared/Entities.js";

export class Item extends Entity {
  constructor(id, name, position, itemType, properties = {}) {
    super(id, name, position, {}, {});
    this.itemType = itemType; // e.g., 'tool', 'weapon', 'consumable'
    this.properties = properties; // e.g., actionType, effect, amount
  }
}
