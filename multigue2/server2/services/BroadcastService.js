// services/BroadcastService.js
import { io } from "../server.js";

const BroadcastService = {
  broadcastChat: (message) => {
    io.emit("chatMessage", {
      message,
      timestamp: Date.now(),
    });
  },

  broadcastChatMessage: (playerName, message) => {
    io.emit("chatMessage", {
      player: playerName,
      message,
      timestamp: Date.now(),
    });
  },

  broadcastPositionUpdate: (playerId, position) => {
    io.emit("updatePosition", {
      player: playerId,
      position,
    });
  },

  broadcastWorldData: (worldChunk) => {
    io.emit("worldData", worldChunk);
  },

  broadcastWorldUpdate: (chunkKey, updatedData) => {
    io.to(chunkKey).emit("worldUpdate", updatedData);
  },

  broadcastPlayerDisconnected: (playerId) => {
    io.emit("playerDisconnected", playerId);
  },
};

export default BroadcastService;
