// client/src/components/Game.js

import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Sky } from "@react-three/drei";
import * as THREE from "three";
import Dungeon from "./Dungeon";
import OtherPlayers from "./OtherPlayers";

const Player = ({ socket, players, localId }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (players[localId]) {
      const { x, y, z } = players[localId].position;
      camera.position.set(x, y + 1.2, z);
      console.log("Camera initialized at:", camera.position.toArray());
    }
  }, [camera, players, localId]);

  return null;
};

const Game = ({
  socket,
  player,
  dungeon,
  addChatMessage,
  onRequestChat, // Callback to open chat
}) => {
  const [players, setPlayers] = useState({});
  const [dungeonGrid, setDungeonGrid] = useState(null);
  const [localId, setLocalId] = useState(null);
  const keysPressed = useRef({});
  const PLAYER_RADIUS = 0.2;
  const controlsRef = useRef(); // Ref for PointerLockControls
  const { camera, scene } = useThree();
  // Initialize player
  useEffect(() => {
    if (player) {
      console.log("got player", player);
      setLocalId(player.userId);
      setPlayers((prev) => ({ ...prev, [player.userId]: player }));
    }
  }, [player]);

  // Handle socket events
  useEffect(() => {
    socket.on("playerJoined", (newPlayer) => {
      console.log("Player joined:", newPlayer.userId);
      setPlayers((prev) => ({ ...prev, [newPlayer.userId]: newPlayer }));
    });

    socket.on("playerMoved", ({ userId, position }) => {
      // Avoid updating the local player's position here to prevent conflicts
      if (userId === localId) return;

      setPlayers((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], position },
      }));
    });

    socket.on("playerShot", ({ userId, direction, position }) => {
      console.log(
        `${JSON.stringify(players[userId])} shot towards ${JSON.stringify(
          direction
        )} from ${JSON.stringify(position)}`
      );
      // Implement shooting logic if needed
    });

    socket.on("playerLeft", ({ userId }) => {
      console.log("Player left:", userId);
      setPlayers((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    // Cleanup on unmount
    return () => {
      socket.off("playerJoined");
      socket.off("playerMoved");
      socket.off("playerShot");
      socket.off("playerLeft");
    };
  }, [socket, localId, players]);

  // Set dungeon grid
  useEffect(() => {
    if (dungeon) {
      setDungeonGrid(dungeon);
    }
  }, [dungeon]);

  // Handle key presses for movement and 'T' key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === "t" && controlsRef.current?.isLocked) {
        e.preventDefault();
        console.log("'T' key pressed. Requesting chat.");
        onRequestChat(); // Notify App.js to open chat
        // Release pointer lock to allow typing
        controlsRef.current.unlock();
      } else {
        if (controlsRef.current?.isLocked) {
          const key = e.key.toLowerCase();
          keysPressed.current[key] = true;
        }
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [onRequestChat]);

  // Re-acquire pointer lock when chat is closed
  useEffect(() => {
    // Listen for a custom event when chat is closed
    const handleChatClose = () => {
      if (controlsRef.current && !controlsRef.current.isLocked) {
        controlsRef.current.lock();
        console.log("Re-acquired pointer lock after chat closed.");
      }
    };

    window.addEventListener("chatClosed", handleChatClose);

    return () => {
      window.removeEventListener("chatClosed", handleChatClose);
    };
  }, []);

  // Handle continuous movement with sliding
  useFrame((state, delta) => {
    if (!controlsRef.current?.isLocked) return;
    if (!localId || !players[localId]) return;
    const { x, y, z } = players[localId].position;
    const cameraDirection = new THREE.Vector3();
    state.camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(state.camera.up, cameraDirection).normalize();

    const moveVector = new THREE.Vector3(0, 0, 0);
    const speed = 5;

    if (keysPressed.current["w"]) {
      moveVector.add(cameraDirection);
    }
    if (keysPressed.current["s"]) {
      moveVector.sub(cameraDirection);
    }
    if (keysPressed.current["a"]) {
      moveVector.add(cameraRight);
    }
    if (keysPressed.current["d"]) {
      moveVector.sub(cameraRight);
    }
    if (moveVector.length() > 0) {
      moveVector.normalize().multiplyScalar(speed * delta);
      const desiredPos = { x: x + moveVector.x, y, z: z + moveVector.z };

      const canMove = checkCollision(desiredPos);

      if (canMove) {
        // Optimistically update the local player's position
        setPlayers((prev) => ({
          ...prev,
          [localId]: { ...prev[localId], position: desiredPos },
        }));

        // Emit the move event to the server
        socket.emit("move", { position: desiredPos });
        console.log(`player ${localId} moved to ${JSON.stringify(desiredPos)}`);
      } else {
        // Attempt to slide along the X and Z axes separately

        // Attempt X-axis movement
        const posX = { x: x + moveVector.x, y, z };
        const canMoveX = checkCollision(posX);

        // Attempt Z-axis movement
        const posZ = { x, y, z: z + moveVector.z };
        const canMoveZ = checkCollision(posZ);

        let finalPos = { x, y, z };

        if (canMoveX) {
          finalPos.x += moveVector.x;
        }

        if (canMoveZ) {
          finalPos.z += moveVector.z;
        }
        // Check if any movement is possible
        if (finalPos.x !== x || finalPos.z !== z) {
          setPlayers((prev) => ({
            ...prev,
            [localId]: { ...prev[localId], position: finalPos },
          }));

          socket.emit("move", { position: finalPos });
          console.log(`player ${localId} slid to ${JSON.stringify(finalPos)}`);
        } else {
          console.log("Collision detected. Movement blocked.");
        }
      }
    }
  });

  // Collision detection based on dungeon grid
  const checkCollision = (position) => {
    if (!dungeonGrid) return false;

    // Convert world position to grid indices
    const gridX = Math.floor(position.x + dungeonGrid[0].length / 2);
    const gridZ = Math.floor(position.z + dungeonGrid.length / 2);

    // Check bounds
    if (
      gridX < 0 ||
      gridX >= dungeonGrid[0].length ||
      gridZ < 0 ||
      gridZ >= dungeonGrid.length
    ) {
      return false; // Out of bounds treated as wall
    }

    // Check surrounding cells based on player radius
    // Determine the cells the player occupies
    const cellsToCheck = [
      {
        x: Math.round(position.x + dungeonGrid[0].length / 2),
        y: Math.round(position.z + dungeonGrid.length / 2),
      },
      {
        x: Math.round(position.x + dungeonGrid[0].length / 2 + PLAYER_RADIUS),
        y: Math.round(position.z + dungeonGrid.length / 2),
      },
      {
        x: Math.round(position.x + dungeonGrid[0].length / 2 - PLAYER_RADIUS),
        y: Math.round(position.z + dungeonGrid.length / 2),
      },
      {
        x: Math.round(position.x + dungeonGrid[0].length / 2),
        y: Math.round(position.z + dungeonGrid.length / 2 + PLAYER_RADIUS),
      },
      {
        x: Math.round(position.x + dungeonGrid[0].length / 2),
        y: Math.round(position.z + dungeonGrid.length / 2 - PLAYER_RADIUS),
      },
    ];

    for (const cell of cellsToCheck) {
      const { x, y } = cell;
      if (
        x < 0 ||
        x >= dungeonGrid[0].length ||
        y < 0 ||
        y >= dungeonGrid.length ||
        dungeonGrid[y][x] === 1
      ) {
        return false; // Collision detected
      }
    }

    return true; // No collision
  };

  // Function to add debug messages
  const addDebugMessage = (msg) => {
    if (addChatMessage) {
      addChatMessage(`DEBUG: ${msg}`);
    }
  };

  // Raycasting logic on firing action
  useEffect(() => {
    const handleMouseDown = () => {
      if (!controlsRef.current?.isLocked) return; // Only allow firing when controls are locked

      // Create a raycaster
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(0, 0); // Center of the screen

      // Set the raycaster from the camera's position and direction
      raycaster.setFromCamera(mouse, camera);

      // Define objects to intersect (excluding the player's own mesh if necessary)
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        // Find the first valid intersection
        for (let i = 0; i < intersects.length; i++) {
          const intersect = intersects[i];
          const { object } = intersect;
          const { type, userId } = object.userData;

          if (type === "wall" || type === "floor" || type === "ceiling") {
            // Hit a block
            addDebugMessage(
              `Firing at ${type} block at position (${intersect.point.x.toFixed(
                2
              )}, ${intersect.point.y.toFixed(2)}, ${intersect.point.z.toFixed(
                2
              )})`
            );
            // Optionally, implement block damage or interaction
            break;
          } else if (type === "player" && userId) {
            // Hit another player
            addDebugMessage(`Firing at Player: ${userId}`);
            // Optionally, implement player damage or interaction
            break;
          }
        }
      } else {
        addDebugMessage("Firing into empty space.");
      }
    };

    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [addChatMessage, camera, scene]);

  return (
    <>
      <PointerLockControls ref={controlsRef} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Sky sunPosition={[100, 20, 100]} />
      {dungeonGrid && <Dungeon grid={dungeonGrid} />}
      <Player socket={socket} players={players} localId={localId} />
      <OtherPlayers players={players} localId={localId} />
    </>
  );
};

export default Game;
