// services/ChunkService.js
import { getChunkKey } from "../utils/helpers.js";

const ChunkService = {
  assignPlayerToChunk: (player, socket) => {
    const chunkKey = getChunkKey(player.position);
    socket.join(chunkKey);
    return chunkKey;
  },

  getChunkKey: (position) => {
    return getChunkKey(position);
  },
};

export default ChunkService;
