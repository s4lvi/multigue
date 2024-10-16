// server/src/utils/collision.js

const calculateDistance = (pos1, pos2) => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const checkCollision = (position, dungeonGrid) => {
  const gridX = Math.floor(position.x + dungeonGrid[0].length / 2);
  const gridZ = Math.floor(position.z + dungeonGrid.length / 2);
  if (
    gridX < 0 ||
    gridX >= dungeonGrid[0].length ||
    gridZ < 0 ||
    gridZ >= dungeonGrid.length ||
    dungeonGrid[gridZ][gridX] === 1
  ) {
    return false;
  }

  return true;
};

module.exports = { calculateDistance, checkCollision };
