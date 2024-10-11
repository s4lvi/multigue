// server/src/services/generationService.js

const generateDungeon = () => {
  const width = 50;
  const height = 50;
  const grid = Array.from({ length: height }, () => Array(width).fill(1)); // Initialize grid with walls

  const rooms = [];
  const maxRooms = 10;
  const roomMinSize = 5;
  const roomMaxSize = 10;

  // Helper function to check if two rooms overlap
  const doesOverlap = (roomA, roomB) => {
    return (
      roomA.x <= roomB.x + roomB.width + 1 &&
      roomA.x + roomA.width + 1 >= roomB.x &&
      roomA.y <= roomB.y + roomB.height + 1 &&
      roomA.y + roomA.height + 1 >= roomB.y
    );
  };

  // Helper function to carve out a room
  const carveRoom = (room) => {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        grid[y][x] = 0; // 0 represents floor
      }
    }
  };

  // Helper function to carve a corridor between two points
  const carveCorridor = (x1, y1, x2, y2) => {
    if (Math.random() > 0.5) {
      // Horizontal first, then vertical
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        grid[y1][x] = 0;
      }
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        grid[y][x2] = 0;
      }
    } else {
      // Vertical first, then horizontal
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        grid[y][x1] = 0;
      }
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        grid[y2][x] = 0;
      }
    }
  };

  for (let i = 0; i < maxRooms; i++) {
    const roomWidth = Math.floor(
      Math.random() * (roomMaxSize - roomMinSize + 1) + roomMinSize
    );
    const roomHeight = Math.floor(
      Math.random() * (roomMaxSize - roomMinSize + 1) + roomMinSize
    );
    const roomX = Math.floor(Math.random() * (width - roomWidth - 1)) + 1;
    const roomY = Math.floor(Math.random() * (height - roomHeight - 1)) + 1;

    const newRoom = {
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
    };

    let failed = false;
    for (const otherRoom of rooms) {
      if (doesOverlap(newRoom, otherRoom)) {
        failed = true;
        break;
      }
    }

    if (!failed) {
      carveRoom(newRoom);

      if (rooms.length > 0) {
        // Connect to the previous room with a corridor
        const prevRoom = rooms[rooms.length - 1];
        const prevCenterX = Math.floor(prevRoom.x + prevRoom.width / 2);
        const prevCenterY = Math.floor(prevRoom.y + prevRoom.height / 2);
        const newCenterX = Math.floor(newRoom.x + newRoom.width / 2);
        const newCenterY = Math.floor(newRoom.y + newRoom.height / 2);
        carveCorridor(prevCenterX, prevCenterY, newCenterX, newCenterY);
      }

      rooms.push(newRoom);
    }
  }

  // Calculate room centers
  const roomCenters = rooms.map((room) => ({
    x: Math.floor(room.x + room.width / 2),
    z: Math.floor(room.y + room.height / 2),
  }));

  // Ensure the starting position is clear and within the first room
  if (roomCenters.length > 0) {
    const startingRoomCenter = roomCenters[0];
    grid[startingRoomCenter.z][startingRoomCenter.x] = 0;
  }

  return { grid, rooms: roomCenters };
};

module.exports = generateDungeon;
