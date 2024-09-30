class Entity {
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

class VisualEntity extends Entity {
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
    scene.add.existing(this.sprite);
    scene.physics.add.existing(this.sprite);
  }

  move(newPosition) {
    super.move(newPosition);
    this.sprite.x = this.position.x;
    this.sprite.y = this.position.y;
  }
}

module.exports = { Entity, VisualEntity };
