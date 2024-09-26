// js/entities/player.js

import Entity from "./entity.js";

class Player extends Entity {
  constructor(scene, x, y, texture, frame, id, name) {
    super(scene, x, y, texture, frame);
    this.id = id;
    this.name = name;
    this.nameText = scene.add
      .text(x, y - 20, name, {
        fontSize: "12px",
        fill: "#ffffff",
      })
      .setOrigin(0.5);
  }

  update() {
    super.update();
    // Update name text position
    this.nameText.setPosition(this.x, this.y - 20);
  }
}

export default Player;
