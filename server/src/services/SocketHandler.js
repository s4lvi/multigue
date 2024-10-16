// server/src/services/SocketHandler.js

class SocketHandler {
  constructor(server) {
    const socketio = require("socket.io");
    const io = socketio(server, {
      cors: {
        origin: "*",
      },
    });

    const GameManager = require("../managers/GameManager");
    this.gameManager = new GameManager(io);
    this.gameManager.startGameLoop();

    io.on("connection", (socket) => {
      console.log(`New client connected: ${socket.id}`);

      // Handle player registration
      socket.on("register", ({ username }) => {
        try {
          this.gameManager.addPlayer(socket, { username });
          //callback({ status: "ok" });
        } catch (error) {
          console.error(error);
          //callback({ status: "error", message: "Registration failed" });
        }
      });

      // Handle player movement
      socket.on("move", ({ position }) => {
        this.gameManager.handlePlayerMove(socket.id, position);
      });

      // Handle player attack
      socket.on("attack", (attackData) => {
        this.gameManager.handlePlayerAttack(socket.id, attackData);
      });

      // Handle item pickup
      socket.on("pickupItem", (itemId, callback) => {
        this.gameManager.handlePlayerPickup(socket.id, itemId, callback);
      });

      // Handle item pickup
      socket.on("useItem", (direction) => {
        this.gameManager.handlePlayerUseItem(socket.id, direction);
      });

      socket.on("readyItem", (index, callback) => {
        this.gameManager.handlePlayerReadyItem(socket.id, index, callback);
      });

      // Handle chat messages
      socket.on("chatMessage", (message) => {
        this.gameManager.handleChatMessage(socket.id, message);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.gameManager.removePlayer(socket.id);
      });
    });
  }
}

module.exports = SocketHandler;
