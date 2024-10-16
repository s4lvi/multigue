// client/src/components/Game.js

import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Sky } from "@react-three/drei";
import * as THREE from "three";
import Dungeon from "./Dungeon";
import OtherPlayers from "./OtherPlayers";
import Items from "./Items";
import HitMarker from "./HitMarker";
import Bullets from "./Bullets";
import FirstPersonWeapon from "./FirstPersonWeapon";
import { v4 as uuidv4 } from "uuid"; // For unique bullet IDs
import PreloadSounds from "./PreloadSounds";
import PositionalSound from "./PositionalSound";

import { useAudio } from "../AudioContext";
import NPCs from "./NPCs";

const Player = ({ players, localId }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (players[localId]) {
      const { x, y, z } = players[localId].position;
      camera.position.set(x, y + 1.2, z);
      // Optionally, you can log the camera position for debugging
      // console.log("Camera initialized at:", camera.position.toArray());
    }
  }, [camera, players, localId]);

  return null;
};

const Game = ({
  socket,
  player,
  dungeon,
  initialItems,
  addChatMessage,
  onRequestChat,
  setHealth,
  setMana,
  setWeapon,
  initialPlayers,
  initialNPCs, // Initial NPCs from server
}) => {
  const [players, setPlayers] = useState(initialPlayers);
  const [npcs, setNPCs] = useState(initialNPCs);
  const [dungeonGrid, setDungeonGrid] = useState(dungeon);
  const [items, setItems] = useState(initialItems); // State to hold items
  const [localId, setLocalId] = useState(null);
  const [isHit, setIsHit] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const [bullets, setBullets] = useState([]);
  const [hitMarkers, setHitMarkers] = useState([]);
  const keysPressed = useRef({});
  const PLAYER_RADIUS = 0.2;
  const controlsRef = useRef();

  const [gunshotPositions, setGunshotPositions] = useState([]);

  const {
    triggerGunshot,
    triggerFootstep,
    triggerHit,
    triggerSwing,
    triggerDeath,
  } = useAudio();
  const { camera, scene } = useThree();

  // Function to calculate distance between two positions
  const calculateDistance = (pos1, pos2) => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };
  // Function to pick up nearby items
  const pickupNearbyItem = () => {
    if (!localId || !players[localId]) return;
    const playerPos = players[localId].position;
    const pickupRange = 1; // Define pickup range

    const nearbyItem = items.find((item) => {
      const distance = calculateDistance(playerPos, item.position);
      return distance < pickupRange;
    });

    if (nearbyItem) {
      socket.emit("pickupItem", nearbyItem.id, (response) => {
        if (response.status === "ok") {
          addChatMessage(`Picked up a ${nearbyItem.type}!`);
        } else {
          addChatMessage(`Failed to pick up item: ${response.message}`);
        }
      });
    } else {
      addChatMessage("No items nearby to pick up.");
    }
  };

  // Function to cycle through inventory
  const cycleInventory = () => {
    setPlayers((prev) => {
      const player = prev[localId];
      if (!player || !player.inventory.length) return prev;
      const newIndex = (player.equippedIndex + 1) % player.inventory.length;
      return {
        ...prev,
        [localId]: { ...player, equippedIndex: newIndex },
      };
    });
  };

  // Initialize player
  useEffect(() => {
    if (player) {
      console.log("Got player:", player);
      setLocalId(player.userId);
      setPlayers((prev) => ({ ...prev, [player.userId]: player }));
    }
  }, [player]);

  // Handle socket events
  useEffect(() => {
    // Player joined
    socket.on("playerJoined", (newPlayer) => {
      console.log("Player joined:", newPlayer.userId);
      setPlayers((prev) => ({ ...prev, [newPlayer.userId]: newPlayer }));
    });

    // Player moved
    socket.on("playerMoved", ({ userId, position }) => {
      if (userId === localId) return; // Local player movement is handled separately

      setPlayers((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], position },
      }));
    });

    // Player shot (optional for visual effects)
    socket.on("playerShot", ({ userId, direction, position }) => {
      console.log(
        `${
          players[userId]?.username || "Unknown"
        } shot towards ${JSON.stringify(direction)} from ${JSON.stringify(
          position
        )}`
      );
      // Implement shooting logic if needed
    });

    // Player left
    socket.on("playerLeft", ({ userId }) => {
      console.log("Player left:", userId);
      setPlayers((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    // Item added
    socket.on("itemAdded", (item) => {
      setItems((prev) => [...prev, item]);
      console.log("itemAdded", item);
    });

    // Item removed
    socket.on("itemRemoved", ({ itemId }) => {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    });

    // Inventory updated
    socket.on("inventoryUpdated", (inventory) => {
      setPlayers((prev) => ({
        ...prev,
        [localId]: {
          ...prev[localId],
          inventory,
          equippedIndex: inventory.length > 0 ? 0 : -1, // Reset equipped index
        },
      }));
    });

    // Player hit
    socket.on("playerHit", ({ userId, damage, newHealth }) => {
      if (userId === localId) {
        setIsHit(true); // Trigger hit marker
        setPlayers((prev) => ({
          ...prev,
          [localId]: {
            ...prev[localId],
            stats: { ...prev[localId].stats, health: newHealth },
          },
        }));
        addChatMessage(`You were hit! Health: ${newHealth}`);
        triggerHit();
        if (newHealth <= 0) {
          addChatMessage("You have died.");
          triggerDeath();
        }
      } else {
        // Optionally handle other players being hit
        addChatMessage(
          `Player ${players[userId]?.username || "Unknown"} was hit!`
        );
        if (
          calculateDistance(
            players[userId]?.position,
            players[localId]?.position
          ) < 15
        ) {
          triggerHit();
        }
      }
    });

    // Player respawned
    socket.on("playerRespawned", ({ userId, position }) => {
      if (userId === localId) {
        setPlayers((prev) => ({
          ...prev,
          [localId]: {
            ...prev[localId],
            position,
            inventory: [],
            stats: { ...prev[localId].stats, health: 100 },
            equippedIndex: -1,
          },
        }));
        addChatMessage("You have respawned.");
      } else {
        setPlayers((prev) => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            position,
            inventory: [],
            stats: { ...prev[userId].stats, health: 100 },
            equippedIndex: -1,
          },
        }));
      }
    });

    // Bullet hit
    socket.on("bulletHit", ({ shooterId, targetId, position }) => {
      if (targetId === localId) {
        setIsHit(true);
        setTimeout(() => setIsHit(false), 500);
      }
      // Add a new HitMarker at the hit position
      if (position) {
        const id = uuidv4();
        setHitMarkers((prev) => [...prev, { id, position }]);
      }
      // Trigger positional gunshot sound if another player fired
      if (shooterId !== localId && position) {
        setGunshotPositions((prev) => [...prev, position]);
      }
    });

    // NPC Added
    socket.on("npcAdded", (npc) => {
      console.log("NPC added:", npc.id);
      setNPCs((prev) => ({ ...prev, [npc.id]: npc }));
    });

    // NPC Removed
    socket.on("npcRemoved", ({ id }) => {
      console.log("NPC removed:", id);
      setNPCs((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    });

    // NPC Moved
    socket.on("npcMoved", ({ id, position }) => {
      setNPCs((prev) => ({
        ...prev,
        [id]: { ...prev[id], position },
      }));
    });

    // NPC Hit
    socket.on("npcHit", ({ id, damage, newHealth }) => {
      setNPCs((prev) => {
        if (!prev[id]) return prev;
        const newPrev = {
          ...prev,
          [id]: {
            ...prev[id],
            stats: { ...prev[id].stats, health: newHealth },
          },
        };
        return newPrev;
      });
      addChatMessage(`${npcs[id].type} was hit for ${damage} damage.`);
      if (newHealth <= 0) {
        addChatMessage(`${npcs[id].type} was killed`);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off("playerJoined");
      socket.off("playerMoved");
      socket.off("playerShot");
      socket.off("playerLeft");
      socket.off("itemAdded");
      socket.off("itemRemoved");
      socket.off("inventoryUpdated");
      socket.off("playerHit");
      socket.off("playerRespawned");
      socket.off("bulletHit");
      socket.off("npcAdded");
      socket.off("npcRemoved");
      socket.off("npcMoved");
      socket.off("npcHit");
    };
  }, [socket, localId, players, addChatMessage, triggerHit, triggerDeath]);

  // Set dungeon grid
  useEffect(() => {
    if (dungeon) {
      setDungeonGrid(dungeon); // Assuming dungeon has a 'grid' property
    }
  }, [dungeon]);

  // Handle key presses for movement, 'T' key, 'E' key, and 'Q' key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === "t" && controlsRef.current?.isLocked) {
        e.preventDefault();
        console.log("'T' key pressed. Requesting chat.");
        onRequestChat(); // Notify App.js to open chat
        controlsRef.current.unlock();
      } else if (e.key.toLowerCase() === "e" && controlsRef.current?.isLocked) {
        e.preventDefault();
        console.log("'E' key pressed. Attempting to pick up item.");
        pickupNearbyItem();
      } else if (e.key.toLowerCase() === "q" && controlsRef.current?.isLocked) {
        e.preventDefault();
        console.log("'Q' key pressed. Cycling inventory.");
        cycleInventory();
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
  }, [onRequestChat, cycleInventory, items, players, localId, socket]);

  // Re-acquire pointer lock when chat is closed
  useEffect(() => {
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

  // Update health, mana, and weapon based on player state
  useEffect(() => {
    if (players[localId]) {
      setHealth(players[localId].stats.health);
      setMana(players[localId].stats.mana);
      setWeapon(players[localId].inventory[players[localId].equippedIndex]);
    }
  }, [players, localId, setHealth, setMana, setWeapon]);

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
    const speed = 3;

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
        setPlayers((prev) => ({
          ...prev,
          [localId]: { ...prev[localId], position: desiredPos },
        }));

        triggerFootstep();
        socket.emit("move", { position: desiredPos });
      } else {
        // Attempt to slide along the X and Z axes separately

        const posX = { x: x + moveVector.x, y, z };
        const canMoveX = checkCollision(posX);

        const posZ = { x, y, z: z + moveVector.z };
        const canMoveZ = checkCollision(posZ);

        let finalPos = { x, y, z };

        if (canMoveX) {
          finalPos.x += moveVector.x;
        }

        if (canMoveZ) {
          finalPos.z += moveVector.z;
        }

        if (finalPos.x !== x || finalPos.z !== z) {
          setPlayers((prev) => ({
            ...prev,
            [localId]: { ...prev[localId], position: finalPos },
          }));

          triggerFootstep();
          socket.emit("move", { position: finalPos });
        } else {
          // Collision detected. Movement blocked.
          // Optionally, trigger a sound or visual effect
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
      if (!localId || !players[localId]) return;

      const equippedItem =
        players[localId].inventory[players[localId].equippedIndex];
      if (!equippedItem) return;

      setIsAttacking(true);
      if (equippedItem.class === "melee") {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        socket.emit("attack", { direction: direction });
        triggerSwing();
      } else if (equippedItem.class === "ranged") {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        socket.emit("attack", { direction: direction });
        triggerGunshot();
      }
    };
    const handleMouseUp = () => {
      setIsAttacking(false);
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    addChatMessage,
    camera,
    socket,
    localId,
    players,
    triggerSwing,
    triggerGunshot,
  ]);

  return (
    <>
      <PreloadSounds />
      <PointerLockControls ref={controlsRef} />
      <ambientLight intensity={0.1} />
      <pointLight
        color="#f93"
        intensity={5}
        position={[
          players[localId]?.position.x,
          1.4,
          players[localId]?.position.z,
        ]}
      />
      <directionalLight position={[10, 10, 5]} intensity={0.7} color="#645" />
      <Sky sunPosition={[100, 20, 100]} />
      <Items items={items} />
      <Player players={players} localId={localId} />
      <OtherPlayers players={players} localId={localId} />
      <NPCs npcs={npcs} />
      {dungeonGrid && <Dungeon grid={dungeonGrid} />}
      {hitMarkers.map((marker) => (
        <HitMarker
          key={marker.id}
          position={[marker.position.x, marker.position.y, marker.position.z]}
          onComplete={() =>
            setHitMarkers((prev) => prev.filter((m) => m.id !== marker.id))
          }
        />
      ))}
      {gunshotPositions.map((pos, index) => (
        <PositionalSound
          key={index}
          position={[pos.x, pos.y, pos.z]}
          volume={0.5}
        />
      ))}
      <FirstPersonWeapon
        equippedItem={
          players[localId]?.inventory[players[localId]?.equippedIndex]
        }
        attacking={isAttacking}
        hit={isHit}
      />
    </>
  );
};

export default Game;
