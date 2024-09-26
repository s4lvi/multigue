// js/game.js

import Player from "./entities/player.js";
import Monster from "./entities/monster.js";
import Item from "./entities/item.js";
import Chest from "./entities/chest.js";

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.players = {};
    this.monsters = {};
    this.items = {};
    this.chests = {};
  }

  preload() {
    // Load assets
    this.load.image("player", "assets/player.png");
    this.load.image("monster", "assets/monster.png");
    this.load.image("item", "assets/item.png");
    this.load.image("chest", "assets/chest.png");
    this.load.image("wall", "assets/wall.png");
    this.load.image("floor", "assets/floor.png");
  }

  create() {
    const self = this;
    this.socket = window.socket;
    this.otherPlayers = this.physics.add.group();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // Handle socket events
    this.handleSocketEvents();

    // Add collision with walls
    this.physics.add.collider(this.otherPlayers, this.walls);
  }

  update() {
    if (this.player) {
      this.handlePlayerInput();
      this.player.update();
    }

    // Update other players and monsters
    Object.values(this.otherPlayers.getChildren()).forEach((otherPlayer) => {
      otherPlayer.update();
    });

    Object.values(this.monsters).forEach((monster) => {
      monster.update();
    });
  }

  createDungeon() {
    this.walls = this.physics.add.staticGroup();
    const tileSize = 32;
    // Assuming dungeon data has been received
    const dungeon = window.dungeonData;
    for (let y = 0; y < dungeon.length; y++) {
      for (let x = 0; x < dungeon[y].length; x++) {
        if (dungeon[y][x] === 1) {
          this.walls.create(x * tileSize, y * tileSize, "wall").setOrigin(0);
        } else {
          this.add.image(x * tileSize, y * tileSize, "floor").setOrigin(0);
        }
      }
    }
  }

  handleSocketEvents() {
    const self = this;

    // Receive dungeon data
    this.socket.on("dungeonData", function (dungeon) {
      console.log("Received dungeon data");
      window.dungeonData = dungeon;
      self.createDungeon();
    });

    // Receive current players
    this.socket.on("currentPlayers", function (players) {
      console.log("Received current players:", players);
      Object.keys(players).forEach(function (id) {
        if (id === self.socket.id) {
          console.log("Adding own player");
          self.addPlayer(players[id]);
        } else {
          self.addOtherPlayer(players[id]);
        }
      });
    });

    // New player joined
    this.socket.on("newPlayer", function (playerInfo) {
      console.log("New player joined:", playerInfo);
      self.addOtherPlayer(playerInfo);
    });

    // Player moved
    this.socket.on("playerMoved", function (playerInfo) {
      console.log("Player moved:", playerInfo);
      const movedPlayer = self.otherPlayers.getChildren().find(function (p) {
        return p.id === playerInfo.id;
      });
      if (movedPlayer) {
        movedPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });

    // Chat message
    this.socket.on("chatMessage", function (message) {
      console.log("Received chat message:", message);
      // Handle chat message display
    });

    // ... other socket events ...
  }

  addPlayer(playerInfo) {
    this.player = new Player(
      this,
      playerInfo.x,
      playerInfo.y,
      "player",
      0,
      playerInfo.id,
      playerInfo.name
    );
    this.physics.add.collider(this.player, this.walls);
    this.cameras.main.startFollow(this.player);
  }

  addOtherPlayer(playerInfo) {
    const otherPlayer = new Player(
      this,
      playerInfo.x,
      playerInfo.y,
      "player",
      0,
      playerInfo.id,
      playerInfo.name
    );
    this.otherPlayers.add(otherPlayer);
  }

  updateMonsters(monstersData) {
    // Add or update monsters
    Object.values(monstersData).forEach((monsterData) => {
      if (this.monsters[monsterData.id]) {
        // Update existing monster
        const monster = this.monsters[monsterData.id];
        monster.setPosition(monsterData.x, monsterData.y);
      } else {
        // Add new monster
        const monster = new Monster(
          this,
          monsterData.x,
          monsterData.y,
          "monster",
          0,
          monsterData.id,
          monsterData.name
        );
        this.monsters[monsterData.id] = monster;
      }
    });
  }

  updateItems(itemsData) {
    // Similar to updateMonsters
  }

  updateChests(chestsData) {
    // Similar to updateMonsters
  }

  removeEntity(entityId) {
    if (this.monsters[entityId]) {
      this.monsters[entityId].destroy();
      delete this.monsters[entityId];
    }
    // Handle other entity types
  }

  handlePlayerInput() {
    const speed = 200;
    this.player.body.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(speed);
    }

    if (this.cursors.up.isDown) {
      this.player.body.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.body.setVelocityY(speed);
    }

    this.player.body.velocity.normalize().scale(speed);

    // Emit movement
    if (
      this.player.oldPosition &&
      (this.player.x !== this.player.oldPosition.x ||
        this.player.y !== this.player.oldPosition.y)
    ) {
      this.socket.emit("playerMovement", {
        x: this.player.x,
        y: this.player.y,
      });
    }

    // Save old position
    this.player.oldPosition = {
      x: this.player.x,
      y: this.player.y,
    };

    // Handle attack
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      // Simplified attack logic
      const target = this.findTargetInRange();
      if (target) {
        this.socket.emit("playerAttack", target.id);
      }
    }
  }

  findTargetInRange() {
    const range = 50;
    let closest = null;
    let minDistance = range;
    Object.values(this.monsters).forEach((monster) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        monster.x,
        monster.y
      );
      if (distance < minDistance) {
        closest = monster;
        minDistance = distance;
      }
    });
    return closest;
  }
}

export function initializeGame() {
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "game-container",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scene: GameScene,
  };

  const game = new Phaser.Game(config);
}
