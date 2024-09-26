// js/entities/monster.js

import Entity from "./entity.js";

class Monster extends Entity {
  constructor(scene, x, y, texture, frame, id, name) {
    super(scene, x, y, texture, frame);
    this.id = id;
    this.name = name;
    this.nameText = scene.add
      .text(x, y - 20, name, {
        fontSize: "12px",
        fill: "#ff0000", // Different color for monsters
      })
      .setOrigin(0.5);
  }

  update() {
    super.update();
    // Update name text position
    this.nameText.setPosition(this.x, this.y - 20);
  }
}

export default Monster;
