// server/src/services/socketService.js

const socketio = require("socket.io");
const User = require("../models/User");
const generateDungeon = require("./generationService");

const players = {}; // In-memory storage for prototype
let dungeon = generateDungeon(); // Generate dungeon once

exports.initialize = (server) => {
  const io = socketio(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Handle player registration
    socket.on("register", async ({ username }, callback) => {
      try {
        let user = await User.findOne({ username });
        if (!user) {
          user = new User({ username, position: { x: 0, y: 0, z: 0 } });
          await user.save();
        }
        players[socket.id] = {
          userId: user._id,
          username: user.username,
          position: user.position,
        };
        socket.join("overworld");
        io.to("overworld").emit("playerJoined", players[socket.id]);

        // Send dungeon data via callback
        callback({ status: "ok", player: players[socket.id], dungeon });
      } catch (error) {
        console.error(error);
        callback({ status: "error", message: "Registration failed" });
      }
    });

    // Handle player movement
    socket.on("move", ({ position }) => {
      if (players[socket.id]) {
        let oldPos = players[socket.id].position;
        players[socket.id].position = position;
        console.log(
          `Player ${players[socket.id].userId} moved from ${JSON.stringify(
            oldPos
          )} to ${JSON.stringify(position)}`
        );
        io.to("overworld").emit("playerMoved", {
          userId: players[socket.id].userId,
          position,
        });
      }
    });

    // Handle shooting
    socket.on("shoot", (data) => {
      if (players[socket.id]) {
        // Broadcast the shooting action to other players
        io.to("overworld").emit("playerShot", {
          userId: players[socket.id].userId,
          direction: data.direction,
          position: players[socket.id].position,
        });
      }
    });

    // Handle chat messages
    socket.on("chatMessage", (message) => {
      if (players[socket.id]) {
        io.to("overworld").emit("chatMessage", {
          username: players[socket.id].username,
          message,
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      if (players[socket.id]) {
        io.to("overworld").emit("playerLeft", {
          userId: players[socket.id].userId,
        });
        delete players[socket.id];
      }
    });
  });
};
