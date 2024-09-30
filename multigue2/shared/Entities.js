export class Entity {
  constructor(id, name, position, stats, contents) {
    this.id = id;
    this.name = name;
    this.position = position;
    this.stats = stats;
    this.contents = contents;
  }

  move(newPosition) {
    this.position = newPosition;
  }

  updateStats(newStat) {
    this.stats[newStat.stat] = newStat.value;
  }
}

export class VisualEntity extends Entity {
  constructor(entity, scene, sprite) {
    super(
      entity.id,
      entity.name,
      entity.position,
      entity.stats,
      entity.contents
    );
    this.sprite = sprite;
    this.sprite.setDepth(this.position.z);
    this.nameText = scene.add.text(0, -20, entity.name, {
      fontSize: "12px",
      fill: "#fff",
    });
    this.nameText.setOrigin(0.5, 1);
    this.container = scene.add.container(
      this.position.x * 32,
      this.position.y * 32,
      [this.sprite, this.nameText]
    );
    scene.physics.add.existing(this.container);
    this.container.setDepth(2);
  }

  remove(scene) {
    scene.physics.world.disable(this.container);
    this.container.destroy();
  }

  move(newPosition) {
    super.move(newPosition);
    this.container.x = this.position.x;
    this.container.y = this.position.y;
  }
}
