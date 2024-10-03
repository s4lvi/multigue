// controllers/interactionController.js
import WorldManager from "../worldManager.js";
import BroadcastService from "../services/BroadcastService.js";
import { io } from "../server.js";

const interactionController = {
  handleInteractRequest: (socket, interactionRequest) => {
    if (!socket.player) return;
    try {
      const result = WorldManager.handleInteraction(
        socket.id,
        interactionRequest.targetPos,
        interactionRequest.item
      );

      if (result.type === "attack") {
        BroadcastService.broadcastChat(result.message);
        if (result.isDefeated) {
          const deadPlayer = WorldManager.world.players[result.target];
          if (deadPlayer) {
            io.to(result.target).emit("kill", {
              position: deadPlayer.position,
              inventory: deadPlayer.contents.inventory,
              stats: deadPlayer.stats,
            });

            BroadcastService.broadcastPositionUpdate(
              deadPlayer.id,
              deadPlayer.position
            );
            BroadcastService.broadcastWorldData(
              WorldManager.getWorldChunk(deadPlayer.position)
            );
          }
        } else {
          io.to(result.target).emit("updateStats", {
            hp: WorldManager.world.players[result.target].stats.hp,
          });
        }
      } else {
        socket.emit("interactionResult", result);
        BroadcastService.broadcastWorldData(
          WorldManager.getWorldChunk(socket.player.position)
        );
      }
    } catch (error) {
      console.error(`Interaction error: ${error.message}`);
      socket.emit(
        "error",
        "An error occurred while processing your interaction."
      );
    }
  },
};

export default interactionController;
