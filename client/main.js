document.addEventListener("DOMContentLoaded", () => {
  const socket = io(); // Connect to the server automatically

  console.log("Socket.io initialized");

  // Menu UI Logic
  const menu = document.getElementById("menu");
  const startServerBtn = document.getElementById("startServer");
  const joinServerBtn = document.getElementById("joinServer");
  const shopBtn = document.getElementById("shop");
  const restBtn = document.getElementById("rest");
  const exitHomeBtn = document.getElementById("exitHome");
  const inventoryList = document.getElementById("inventoryList");
  const equipmentList = document.getElementById("equipmentList");
  const inventoryUI = document.getElementById("inventory");
  const equipmentUI = document.getElementById("equipment");
  const homeVillage = document.getElementById("homeVillage");
  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const healthBar = document.getElementById("healthBar");
  const playerNameInput = document.getElementById("playerNameInput");
  const gameUI = document.getElementById("gameUI");

  // Global variables
  let playerName = "";

  // Health Bar Update Function
  function updateHealthBar(hp) {
    const hpPercentage = Math.max(Math.min(hp, 100), 0); // Clamp between 0 and 100
    healthBar.style.width = `${hpPercentage}%`;
    if (hpPercentage > 60) {
      healthBar.style.background = "#4CAF50"; // Green
    } else if (hpPercentage > 30) {
      healthBar.style.background = "#FF9800"; // Orange
    } else {
      healthBar.style.background = "#f44336"; // Red
    }
  }

  // Chat Functionality
  chatInput.addEventListener("keydown", (event) => {
    event.stopPropagation(); // Prevent Phaser from capturing the event
    if (event.key === "Enter" && chatInput.value.trim() !== "") {
      const message = {
        id: socket.id,
        name: playerName, // Use the player's name
        text: chatInput.value.trim(),
      };
      socket.emit("chatMessage", message);
      chatInput.value = "";
    }
  });
  socket.on("chatMessage", (message) => {
    const msgDiv = document.createElement("div");
    msgDiv.textContent = `${message.name ?? "Server"}: ${message.text}`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  // Notifications
  function displayNotification(message) {
    const notification = document.createElement("div");
    notification.classList.add("notification");
    notification.textContent = message;
    document.body.appendChild(notification);

    // Fade out and remove after 3 seconds
    setTimeout(() => {
      notification.classList.add("fade-out");
      notification.addEventListener("transitionend", () => {
        notification.remove();
      });
    }, 3000);
  }

  // Ensure all DOM elements are present
  if (joinServerBtn) {
    joinServerBtn.addEventListener("click", () => {
      const name = playerNameInput.value.trim();
      if (name === "") {
        alert("Please enter your name.");
        return;
      }
      console.log("Joining the game as:", name);
      menu.style.display = "none";
      gameUI.style.display = "block";
      joinGame(name);
    });
  }

  function joinGame(name) {
    playerName = name;
    console.log("Waiting for dungeon data...");
    // Send the player's name to the server
    socket.emit("playerJoined", { name: playerName });

    // Listen for dungeonData before initializing Phaser
    socket.once("dungeonData", (dungeon) => {
      console.log("Received dungeon data. Initializing Phaser...");
      initializePhaser(dungeon);
    });

    // Listen for currentPlayers
    socket.once("currentPlayers", (playersData) => {
      console.log("Received current players data.");
      window.playersData = playersData;
    });
  }

  function initializePhaser(dungeon) {
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: "game-container", // Ensure Phaser appends to body
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
    };

    const game = new Phaser.Game(config);
    let player;
    let otherPlayers = {};
    let cursors;
    let attackKey;
    let currentArea = "dungeon";
    let walls; // Add walls group

    function preload() {
      console.log("Preloading assets...");
      this.load.image("player", "assets/player.png"); // Placeholder asset
      this.load.image("enemy", "assets/enemy.png"); // Placeholder asset
      this.load.image("wall", "assets/wall.png"); // Placeholder asset
      this.load.image("floor", "assets/floor.png"); // Placeholder asset

      this.load.on("loaderror", function (file) {
        console.error("Failed to load file:", file.src);
      });
    }

    function create() {
      console.log("Creating game scene...");
      const self = this;

      // Create dungeon tiles and walls group
      walls = self.physics.add.staticGroup();
      const tileSize = 32;
      for (let y = 0; y < dungeon.length; y++) {
        for (let x = 0; x < dungeon[y].length; x++) {
          if (dungeon[y][x] === 1) {
            const wall = walls
              .create(x * tileSize, y * tileSize, "wall")
              .setOrigin(0)
              .refreshBody();
          } else {
            self.add.image(x * tileSize, y * tileSize, "floor").setOrigin(0);
          }
        }
      }

      // Add player and other players
      if (window.playersData) {
        console.log("Current players data:", window.playersData);
        Object.keys(window.playersData).forEach((id) => {
          if (id === socket.id) {
            addPlayer(self, window.playersData[id]);
          } else {
            addOtherPlayers(self, window.playersData[id]);
          }
        });
      }

      // Listen for new players
      socket.on("newPlayer", (playerInfo) => {
        console.log("New player joined:", playerInfo);
        addOtherPlayers(self, playerInfo);
      });

      // Listen for player movements
      socket.on("playerMoved", (playerInfo) => {
        if (otherPlayers[playerInfo.id]) {
          otherPlayers[playerInfo.id].setPosition(playerInfo.x, playerInfo.y);
          if (otherPlayers[playerInfo.id].nameText) {
            otherPlayers[playerInfo.id].nameText.setPosition(
              playerInfo.x,
              playerInfo.y - 20
            );
          }
        }
      });

      // Initialize cursor keys for input
      cursors = this.input.keyboard.createCursorKeys();

      // Handle attack input
      attackKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
      attackKey.on("down", () => {
        console.log("Attack key pressed");
        if (player && currentArea === "dungeon") {
          const targetId = findTargetInRange(player);
          if (targetId) {
            console.log("Attacking player:", targetId);
            socket.emit("playerAttack", targetId, (response) => {
              if (response.status !== "ok") {
                console.error("Attack failed:", response.message);
              }
            });
          }
        }
      });

      // Handle entering home village via 'H' key
      const homeKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.H
      );
      homeKey.on("down", () => {
        console.log("Home key pressed");
        if (currentArea === "dungeon") {
          socket.emit("enterHome", (response) => {
            if (response.status !== "ok") {
              console.error("Enter home failed:", response.message);
            }
          });
        }
      });

      // Handle exiting home village via 'E' key
      const exitHomeKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.E
      );
      exitHomeKey.on("down", () => {
        console.log("Exit home key pressed");
        if (currentArea === "home") {
          socket.emit("exitHome", (response) => {
            if (response.status !== "ok") {
              console.error("Exit home failed:", response.message);
            }
          });
        }
      });
    }

    function update() {
      if (player) {
        // Handle player movement input
        const speed = 200;
        player.body.setVelocity(0);

        if (cursors.left.isDown) {
          player.body.setVelocityX(-speed);
        } else if (cursors.right.isDown) {
          player.body.setVelocityX(speed);
        }

        if (cursors.up.isDown) {
          player.body.setVelocityY(-speed);
        } else if (cursors.down.isDown) {
          player.body.setVelocityY(speed);
        }

        // Normalize and scale the velocity so that player can't move faster along a diagonal
        player.body.velocity.normalize().scale(speed);

        // Emit player movement to the server if position has changed
        const x = player.x;
        const y = player.y;
        const playerMoved =
          player.oldPosition &&
          (x !== player.oldPosition.x || y !== player.oldPosition.y);

        if (playerMoved) {
          socket.emit(
            "playerMovement",
            { x: player.x, y: player.y },
            (response) => {
              if (response.status !== "ok") {
                console.error("Movement failed:", response.message);
              }
            }
          );
        }

        // Save old position data
        player.oldPosition = {
          x: player.x,
          y: player.y,
        };

        // Update player name text position
        if (player.nameText) {
          player.nameText.setPosition(player.x, player.y - 20);
        }
      }

      // Update other players' name texts
      Object.keys(otherPlayers).forEach((id) => {
        const otherPlayer = otherPlayers[id];
        if (otherPlayer.nameText) {
          otherPlayer.nameText.setPosition(otherPlayer.x, otherPlayer.y - 20);
        }
      });
    }

    function addPlayer(self, playerInfo) {
      console.log("Adding local player:", playerInfo);
      player = self.physics.add
        .sprite(playerInfo.x, playerInfo.y, "player")
        .setOrigin(0.5, 0.5)
        .setDisplaySize(32, 32);
      player.playerId = playerInfo.id;
      player.name = playerInfo.name;

      // Add collision with walls
      self.physics.add.collider(player, walls);

      player.nameText = self.add
        .text(player.x, player.y - 20, playerInfo.name, {
          fontSize: "12px",
          fill: "#ffffff",
        })
        .setOrigin(0.5);
      self.cameras.main.startFollow(player);
      updateHealthBar(playerInfo.stats.hp);
    }

    function addOtherPlayers(self, playerInfo) {
      const otherPlayer = self.physics.add
        .sprite(playerInfo.x, playerInfo.y, "enemy")
        .setOrigin(0.5, 0.5)
        .setDisplaySize(32, 32);
      otherPlayer.playerId = playerInfo.id;
      otherPlayer.name = playerInfo.name;

      // Add player name text
      otherPlayer.nameText = self.add
        .text(otherPlayer.x, otherPlayer.y - 20, playerInfo.name, {
          fontSize: "12px",
          fill: "#ffffff",
        })
        .setOrigin(0.5);

      otherPlayers[playerInfo.id] = otherPlayer;
    }

    function findTargetInRange(player) {
      // Simplified: Find the first enemy within 100 pixels
      const range = 100;
      for (const id in otherPlayers) {
        const other = otherPlayers[id];
        const distance = Phaser.Math.Distance.Between(
          player.x,
          player.y,
          other.x,
          other.y
        );
        if (distance <= range) {
          return id;
        }
      }
      return null;
    }

    function updateInventoryUI(inventory) {
      console.log("Updating inventory UI:", inventory);
      inventoryList.innerHTML = "";
      inventory.forEach((item, index) => {
        const li = document.createElement("li");
        li.textContent = `${item.name} (${item.type})`;
        inventoryList.appendChild(li);
      });
      inventoryUI.style.display = "block";
    }

    function updateEquipmentUI(equipment) {
      console.log("Updating equipment UI:", equipment);
      equipmentList.innerHTML = "";
      for (const slot in equipment) {
        const item = equipment[slot];
        const li = document.createElement("li");
        li.textContent = `${slot}: ${item ? item.name : "None"}`;
        equipmentList.appendChild(li);
      }
      equipmentUI.style.display = "block";
    }

    function showHomeVillageUI() {
      console.log("Showing Home Village UI");
      homeVillage.style.display = "block";
    }

    function hideHomeVillageUI() {
      console.log("Hiding Home Village UI");
      homeVillage.style.display = "none";
    }

    // Handle connection confirmation
    socket.on("connect", () => {
      console.log(`Connected to server with ID: ${socket.id}`);
    });

    // Handle connection errors
    socket.on("connect_error", (err) => {
      console.error("Connection Error:", err);
      alert("Failed to connect to the server. Please try again later.");
    });

    // Handle disconnections
    socket.on("disconnect", (reason) => {
      console.warn("Disconnected:", reason);
      alert("You have been disconnected from the server.");
      // Optionally redirect to the menu or attempt reconnection
    });
  }
});
