// controllers/playerController.js
import WorldManager from "../worldManager.js";
import BroadcastService from "../services/BroadcastService.js";
import ChunkService from "../services/ChunkService.js";
import logger from "../utils/logger.js";

const playerController = {
  initPlayer: (socket, playerName) => {
    if (WorldManager.isNameTaken(playerName)) {
      socket.emit(
        "nameError",
        "Name is already taken. Please choose another one."
      );
    } else {
      const player = WorldManager.addPlayer(socket.id, playerName);
      socket.player = player;
      socket.emit("initPlayer", [socket.id, WorldManager.world.players]);
      socket.broadcast.emit(
        "playerConnected",
        WorldManager.world.players[socket.id]
      );
      socket.emit("worldData", WorldManager.getWorldChunk(player.position));

      BroadcastService.broadcastChat(`Player ${playerName} connected`);
      socket.emit("chatMessage", {
        message: "Welcome to MULTIGUE",
        timestamp: Date.now(),
      });

      ChunkService.assignPlayerToChunk(player, socket);
    }
  },

  handleChatMessage: (socket, message) => {
    if (!socket.player) return;
    logger.message(socket.player.name, message);
    BroadcastService.broadcastChatMessage(socket.player.name, message);
  },

  handleMoveRequest: (socket, direction) => {
    if (!socket.player) return;
    const oldChunk = ChunkService.getChunkKey(socket.player.position);
    const updatedPosition = WorldManager.movePlayer(socket.id, direction);
    socket.player.position = updatedPosition;
    const newChunk = ChunkService.getChunkKey(socket.player.position);

    if (oldChunk !== newChunk) {
      socket.leave(oldChunk);
      socket.join(newChunk);
    }

    BroadcastService.broadcastPositionUpdate(socket.player.id, updatedPosition);
    BroadcastService.broadcastWorldData(
      WorldManager.getWorldChunk(updatedPosition)
    );
  },

  handleDisconnect: (socket) => {
    logger.log(`Player disconnected: ${socket.id}`);
    BroadcastService.broadcastPlayerDisconnected(socket.id);
    if (WorldManager.world.players[socket.id]) {
      BroadcastService.broadcastChat(
        `Player ${WorldManager.world.players[socket.id].name} disconnected`
      );
      WorldManager.removePlayer(socket.id);
    }
  },
};

export default playerController;
