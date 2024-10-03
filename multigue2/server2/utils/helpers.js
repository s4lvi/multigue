// utils/helpers.js
import { CHUNK_SIZE } from "../../shared/constants.js";

export const getChunkKey = (position) => {
  const chunkX = Math.floor(position.x / CHUNK_SIZE.width);
  const chunkY = Math.floor(position.y / CHUNK_SIZE.height);
  return `${chunkX},${chunkY}`;
};
