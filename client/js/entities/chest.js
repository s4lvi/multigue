// js/entities/chest.js

import Entity from "./entity.js";

class Chest extends Entity {
  constructor(scene, x, y, texture, frame, id) {
    super(scene, x, y, texture, frame);
    this.id = id;
    this.setInteractive();
    // Handle opening the chest
    this.on("pointerdown", () => {
      window.socket.emit("openChest", this.id);
    });
  }
}

export default Chest;
