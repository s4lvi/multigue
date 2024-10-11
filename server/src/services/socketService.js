// server/src/services/socketService.js

const socketio = require("socket.io");
const User = require("../models/User"); // Ensure this is your plain JS User class
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
        // Select a random room center from the dungeon
        if (!dungeon.rooms || dungeon.rooms.length === 0) {
          return callback({ status: "error", message: "No rooms available" });
        }

        const randomIndex = Math.floor(Math.random() * dungeon.rooms.length);
        const selectedRoom = dungeon.rooms[randomIndex];

        // Create a new user with the selected position
        let user = new User({
          username,
          currentLocation: "overworld",
          position: { x: selectedRoom.x, y: 0, z: selectedRoom.z },
          inventory: [],
          stats: { health: 100, level: 1, experience: 0 },
        });

        // Optionally, save the user to the database
        // await user.save();

        // Assign user to in-memory players object
        players[socket.id] = {
          userId: socket.id, // Using socket.id as a unique identifier
          username: user.username,
          position: user.position,
        };

        // Join the player to the "overworld" room
        socket.join("overworld");

        // Notify all players in the "overworld" about the new player
        io.to("overworld").emit("playerJoined", players[socket.id]);

        // Send dungeon data via callback
        callback({
          status: "ok",
          player: players[socket.id],
          dungeon: dungeon.grid,
        });
      } catch (error) {
        console.error(error);
        callback({ status: "error", message: "Registration failed" });
      }
    });

    // Handle player movement
    socket.on("move", ({ position }) => {
      if (players[socket.id]) {
        const oldPos = players[socket.id].position;
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
