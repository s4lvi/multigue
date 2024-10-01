// game.js
import { VisualEntity } from "../shared/Entities.js";
import UIScene from "./ui.js";

const socket = io();
let players = {},
  highlightCursor,
  npcs = [],
  items = [],
  self,
  initialized = false;
let keyA, keyS, keyD, keyW;
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
  width:
    window.visualViewport.width < 800 ? window.visualViewport.width - 4 : 800,
  height:
    window.visualViewport.width < 800
      ? window.visualViewport.height - 200
      : 600,

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

// Event Listeners for Chat (Desktop)
document.getElementById("send-button").addEventListener("click", sendMessage);
document
  .getElementById("chat-input")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      sendMessage();
      document.getElementById("chat-input").blur();
    }
  });

// Event Listeners for Chat Overlay (Mobile)
document
  .getElementById("send-button-overlay")
  .addEventListener("click", sendMessageOverlay);
document
  .getElementById("chat-input-overlay")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      sendMessageOverlay();
      document.getElementById("chat-input-overlay").blur();
    }
  });

// Chat Toggle Button (Mobile)
document.getElementById("chat-toggle-button").addEventListener("click", () => {
  document.getElementById("chat-overlay").style.display = "flex";
});

// Close Chat Overlay Button (Mobile)
document.getElementById("close-chat-overlay").addEventListener("click", () => {
  document.getElementById("chat-overlay").style.display = "none";
});

// Movement Controls (Mobile)
const moveButtons = document.querySelectorAll(".move-button");
moveButtons.forEach((button) => {
  button.addEventListener("touchstart", (e) => {
    const direction = button.getAttribute("data-direction");
    socket.emit("moveRequest", direction);
    e.preventDefault();
  });
  button.addEventListener("mousedown", (e) => {
    // For desktop testing
    const direction = button.getAttribute("data-direction");
    socket.emit("moveRequest", direction);
    e.preventDefault();
  });
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

function sendMessageOverlay() {
  const message = document.getElementById("chat-input-overlay").value.trim();
  if (message !== "") {
    socket.emit("chatMessage", message);
    document.getElementById("chat-input-overlay").value = "";
  }
}

socket.on("chatMessage", (data) => {
  if (window.innerWidth > 768) {
    // Desktop Chat
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
  } else {
    // Mobile Chat Overlay
    const chatMessagesOverlay = document.getElementById(
      "chat-messages-overlay"
    );
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
    chatMessagesOverlay.appendChild(newMessage);
    chatMessagesOverlay.scrollTop = chatMessagesOverlay.scrollHeight;
  }
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

  // Load cursor highlight
  this.load.image("highlight", "assets/cursor.png");
  this.frameTime = 0;
  this.updateInterval = 1000 / 10;
}

function create() {
  this.uiScene = this.scene.get("UIScene");
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
    if (window.visualViewport.width < 800) {
      document.getElementById("in-game").style.display = "flex";
    } else {
      document.getElementById("in-game").style.display = "block";
      document.getElementById("movement-controls").style.display = "none";
      document.getElementById("chat-overlay").style.display = "none";
      document.getElementById("chat-toggle-button").style.display = "none";
    }
    console.log("initPlayer", player);
    self = player[0];
    players = player[1];
    for (let p in players) {
      players[p] = new VisualEntity(
        players[p],
        this,
        this.add.sprite(0, 0, "player")
      );
    }
    console.log("players at init", players);
    this.cameras.main.startFollow(players[self].container);
    // Add cursor highlight, initially hidden
    highlightCursor = this.add.sprite(0, 0, "highlight").setVisible(false);
    highlightCursor.setDepth(15); // Cursor should always be on top
    initialized = true;
    this.events.emit("updateInventory", players[self].contents.inventory);
    this.events.emit("updateStats", players[self].stats);
  });

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
      this.add.sprite(
        playerData.position.x * TILE_SIZE - 32,
        playerData.position.y * TILE_SIZE - 32,
        "player"
      )
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

  socket.on("entityUpdate", (entityData) => {
    if (entityData.type === "player") {
      players[entityData.target].stats[entityData.stat] += entityData.value;
      if (entityData.target === self) {
        console.log(players[entityData.target].stats);
        this.events.emit("updateStats", { health: players[self].stats.hp });
      }
    }
  });

  socket.on("updateInventory", (inventory) => {
    players[self].contents.inventory = inventory;
    this.events.emit("updateInventory", inventory);
  });

  socket.on("updateStats", (stats) => {
    players[self].stats = stats;
    this.events.emit("updateStats", stats);
  });

  // Handle player death and respawn
  socket.on("kill", (data) => {
    console.log("Received 'kill' event with data:", data);

    // Update player's position
    players[self].container.x = data.position.x * TILE_SIZE;
    players[self].container.y = data.position.y * TILE_SIZE;
    players[self].position = data.position;

    // Update player's inventory
    players[self].contents.inventory = data.inventory;
    this.events.emit("updateInventory", data.inventory);

    // Update player's stats
    players[self].stats = data.stats;
    this.events.emit("updateStats", data.stats);

    // Ensure the camera follows the player at the new position
    this.cameras.main.startFollow(players[self].container);

    // Optionally, display a message to the player
    this.events.emit("chatMessage", {
      message: "You have been defeated and have respawned at the spawn point.",
      timestamp: Date.now(),
    });
  });
}

function update(time, delta) {
  this.frameTime += delta;
  const chatInputFocused =
    document.getElementById("chat-input") === document.activeElement ||
    document.getElementById("chat-input-overlay") === document.activeElement;

  if (
    initialized &&
    !chatInputFocused &&
    this.frameTime > this.updateInterval &&
    initialized
  ) {
    this.frameTime = 0;

    // Desktop Controls
    if (window.innerWidth > 768) {
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
      const selectedItem =
        players[self].contents.inventory[this.uiScene.selectedItemIndex];
      let itemType = "hand";
      if (selectedItem) {
        itemType = selectedItem.name.toLowerCase();
      }
      socket.emit("interactRequest", {
        targetPos: { x: tileX, y: tileY, z: players[self].position.z },
        item: itemType,
      });

      socket.on("interactionResult", (result) => {
        console.log(result);
        if (result.type === "pickup" || result.type === "mine") {
          // Update inventory
          players[self].contents.inventory = result.inventory;
          this.events.emit("updateInventory", result.inventory);
        } else if (result.type === "consume") {
          // Update stats and inventory
          players[self].stats.hp = result.hp;
          players[self].contents.inventory = result.inventory;
          this.events.emit("updateStats", { hp: result.hp });
          this.events.emit("updateInventory", result.inventory);
        } else if (result.type === "attack") {
          // Handle attack result if necessary
        }
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
