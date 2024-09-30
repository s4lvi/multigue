import { VisualEntity } from "./Entities.js";
import UIScene from "./ui.js";

const socket = io();
let players = {},
  highlightCursor,
  npcs = [],
  items = [],
  self,
  initialized = false;
let keyA;
let keyS;
let keyD;
let keyW;
let tileGroup, objectGroup; // Groups to handle tile rendering and objects

const TILE_SIZE = 32; // Tile size in pixels
const PLAYER_RADIUS = 1.5; // How far the player can interact
class MainGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainGameScene", active: true });
  }
  preload = preload;
  create = create;
  update = update;
}
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [MainGameScene, UIScene],
};
const game = new Phaser.Game(config);

document.getElementById("send-button").addEventListener("click", sendMessage);
document
  .getElementById("chat-input")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      sendMessage();
      document.getElementById("chat-input").blur();
    }
  });
document.getElementById("connect-button").addEventListener("click", () => {
  const playerName = document.getElementById("player-name-input").value.trim();
  if (playerName) {
    socket.emit("initPlayer", playerName);
  }
});

function sendMessage() {
  const message = document.getElementById("chat-input").value.trim();
  if (message !== "") {
    socket.emit("chatMessage", message);
    document.getElementById("chat-input").value = "";
  }
}

socket.on("chatMessage", (data) => {
  const chatMessages = document.getElementById("chat-container");
  const newMessage = document.createElement("div");

  if (data.player) {
    newMessage.textContent = `[${new Date(
      data.timestamp
    ).toLocaleTimeString()}] ${data.player}: ${data.message}`;
  } else {
    newMessage.textContent = `[${new Date(
      data.timestamp
    ).toLocaleTimeString()}] ${data.message}`;
    newMessage.style.color = "#aaa";
  }
  chatMessages.appendChild(newMessage);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("nameError", (errorMsg) => {
  console.log(errorMsg);
  document.getElementById("name-error").textContent = errorMsg;
});

function preload() {
  // Load multiple tile types
  this.load.image("stone", "assets/stone.png");
  this.load.image("dirt", "assets/dirt.png");
  this.load.image("grass", "assets/grass.png");
  this.load.image("sand", "assets/floor.png");
  this.load.image("tree", "assets/tree.png");
  this.load.image("water", "assets/water.png");
  this.load.image("rock", "assets/rock.png");
  this.load.image("gravel", "assets/gravel.png");

  // Load player, NPC, and item assets
  this.load.image("player", "assets/player.png");
  this.load.image("slime", "assets/kobold.png");
  this.load.image("villager", "assets/player.png");
  this.load.image("sword", "assets/item.png");
  this.load.image("pickaxe", "assets/item.png");

  // Load cursor highlight
  this.load.image("highlight", "assets/cursor.png");
  this.frameTime = 0;
  this.updateInterval = 1000 / 10;
}

function create() {
  keyA = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.A,
    false,
    true
  );
  keyS = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.S,
    false,
    true
  );
  keyD = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.D,
    false,
    true
  );
  keyW = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.W,
    false,
    true
  );
  // Create groups for organizing layers
  tileGroup = this.add.group(); // Group for tiles (ground)
  objectGroup = this.add.group(); // Group for NPCs, items, player, cursor

  socket.on("initPlayer", (player) => {
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("in-game").style.display = "block";
    console.log("initPlayer", player);
    self = player[0];
    players = player[1];
    for (let p in players) {
      console.log(p);
      players[p] = new VisualEntity(
        players[p],
        this,
        this.add.sprite(players[p].x, players[p].y, "player")
      );
    }
    console.log("players at init", players);
    this.cameras.main.startFollow(players[self].container);
    initialized = true;
  });

  // Add cursor highlight, initially hidden
  highlightCursor = this.add.sprite(0, 0, "highlight").setVisible(false);
  highlightCursor.setDepth(15); // Cursor should always be on top

  // Handle world data from the server
  socket.on("worldData", (worldChunk) => {
    console.log("got new world data");
    renderWorldChunk(this, worldChunk);
  });

  socket.on("playerConnected", (playerData) => {
    console.log("playerConnected", playerData);
    players[playerData.id] = new VisualEntity(
      playerData,
      this,
      this.add.sprite(playerData.x, playerData.y, "player")
    );
  });

  socket.on("playerDisconnected", (playerId) => {
    console.log("playerDisconnected", playerId);
    if (players[playerId]) {
      players[playerId].remove(this);
      delete players[playerId];
    }
  });

  // Handle player position updates from the server
  socket.on("updatePosition", (updatePositionMsg) => {
    let position = updatePositionMsg.position;
    let playerId = updatePositionMsg.player;
    let newPos = {
      x: position.x * TILE_SIZE,
      y: position.y * TILE_SIZE,
      z: position.z,
    };
    players[playerId].move(newPos);
  });
}

function update(time, delta) {
  this.frameTime += delta;
  const chatInputFocused =
    document.getElementById("chat-input") === document.activeElement;

  if (
    initialized &&
    !chatInputFocused &&
    this.frameTime > this.updateInterval &&
    initialized
  ) {
    this.frameTime = 0;

    if (keyA.isDown) {
      socket.emit("moveRequest", "left");
    }
    if (keyD.isDown) {
      socket.emit("moveRequest", "right");
    }
    if (keyW.isDown) {
      socket.emit("moveRequest", "up");
    }
    if (keyS.isDown) {
      socket.emit("moveRequest", "down");
    }

    // Handle mouse cursor movement and highlight
    const pointer = this.input.activePointer;
    const tileX = Math.floor((pointer.worldX + 16) / TILE_SIZE);
    const tileY = Math.floor((pointer.worldY + 16) / TILE_SIZE);

    // Update cursor highlight position and visibility if it's within reach
    const distance = Phaser.Math.Distance.Between(
      players[self].container.x / TILE_SIZE,
      players[self].container.y / TILE_SIZE,
      tileX,
      tileY
    );

    if (distance <= PLAYER_RADIUS) {
      highlightCursor.setVisible(true);
      highlightCursor.x = tileX * TILE_SIZE;
      highlightCursor.y = tileY * TILE_SIZE;
    } else {
      highlightCursor.setVisible(false);
    }

    // Emit interaction request when mouse is clicked
    if (this.input.activePointer.isDown && highlightCursor.visible) {
      socket.emit("interactRequest", {
        x: tileX,
        y: tileY,
        z: players[self].z,
      });
    }
  }
}

function renderWorldChunk(scene, worldChunk) {
  tileGroup.clear(true, true);

  Object.keys(worldChunk).forEach((key) => {
    const [x, y, z] = key.split(",").map(Number);
    const tileData = worldChunk[key];
    const tileType = tileData.material;

    if (tileType !== "none") {
      let sprite = scene.add.sprite(x * TILE_SIZE, y * TILE_SIZE, tileType);
      sprite.setDepth(z); // Set depth based on z level
      tileGroup.add(sprite);
    }
  });
}
