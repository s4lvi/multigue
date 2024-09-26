// server/dungeonGenerator.js

function generateDungeon(width, height) {
  // Initialize dungeon with walls (1)
  const dungeon = Array.from({ length: height }, () => Array(width).fill(1));

  // Starting position at the center
  let x = Math.floor(width / 2);
  let y = Math.floor(height / 2);
  dungeon[y][x] = 0;

  const steps = width * height * 2; // Adjust steps as needed

  for (let i = 0; i < steps; i++) {
    const direction = Math.floor(Math.random() * 4);
    switch (direction) {
      case 0: // Up
        y = y > 0 ? y - 1 : y;
        break;
      case 1: // Down
        y = y < height - 1 ? y + 1 : y;
        break;
      case 2: // Left
        x = x > 0 ? x - 1 : x;
        break;
      case 3: // Right
        x = x < width - 1 ? x + 1 : x;
        break;
    }
    dungeon[y][x] = 0;
  }

  return dungeon;
}

module.exports = { generateDungeon };
