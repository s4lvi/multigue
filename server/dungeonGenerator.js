// server/dungeonGenerator.js

const TILE_WALL = 1;
const TILE_FLOOR = 0;
const TILE_WATER = 3;
// Add more tile types as needed

function generateDungeon(width, height) {
  // Initialize dungeon with walls
  const dungeon = Array.from({ length: height }, () =>
    Array(width).fill(TILE_WALL)
  );

  const rooms = [];
  const numRooms = 10; // Adjust as needed
  const roomMinSize = 5;
  const roomMaxSize = 15;

  for (let i = 0; i < numRooms; i++) {
    const roomWidth = randomInt(roomMinSize, roomMaxSize);
    const roomHeight = randomInt(roomMinSize, roomMaxSize);
    const roomX = randomInt(1, width - roomWidth - 1);
    const roomY = randomInt(1, height - roomHeight - 1);

    // Create room
    for (let y = roomY; y < roomY + roomHeight; y++) {
      for (let x = roomX; x < roomX + roomWidth; x++) {
        dungeon[y][x] = TILE_FLOOR; // Floor
      }
    }

    const newRoom = {
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
    };
    rooms.push(newRoom);

    // Connect rooms with corridors
    if (rooms.length > 1) {
      const prevRoom = rooms[rooms.length - 2];
      const currCenter = getRoomCenter(newRoom);
      const prevCenter = getRoomCenter(prevRoom);

      // Randomly decide corridor direction
      if (Math.random() < 0.5) {
        carveHorizontalCorridor(
          dungeon,
          prevCenter.x,
          currCenter.x,
          prevCenter.y
        );
        carveVerticalCorridor(
          dungeon,
          prevCenter.y,
          currCenter.y,
          currCenter.x
        );
      } else {
        carveVerticalCorridor(
          dungeon,
          prevCenter.y,
          currCenter.y,
          prevCenter.x
        );
        carveHorizontalCorridor(
          dungeon,
          prevCenter.x,
          currCenter.x,
          currCenter.y
        );
      }
    }
  }

  // Add water tiles for variety
  const numWaterTiles = 50; // Adjust as needed
  for (let i = 0; i < numWaterTiles; i++) {
    const x = randomInt(1, width - 2);
    const y = randomInt(1, height - 2);
    if (dungeon[y][x] === TILE_FLOOR) {
      dungeon[y][x] = TILE_WATER; // Water tile
    }
  }

  return dungeon;
}

function getRoomCenter(room) {
  return {
    x: Math.floor(room.x + room.width / 2),
    y: Math.floor(room.y + room.height / 2),
  };
}

function carveHorizontalCorridor(dungeon, x1, x2, y) {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    dungeon[y][x] = TILE_FLOOR;
    dungeon[y + 1][x] = TILE_FLOOR;
  }
}

function carveVerticalCorridor(dungeon, y1, y2, x) {
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
    dungeon[y][x] = TILE_FLOOR;
    dungeon[y][x + 1] = TILE_FLOOR;
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = { generateDungeon };
