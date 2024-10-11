// client/src/components/OtherPlayers.js

import React from "react";
import { useLoader } from "@react-three/fiber";
import { Text } from "@react-three/drei"; // Import Text component
import * as THREE from "three";
import playerSpriteImg from "../assets/textures/player.png";

const OtherPlayers = ({ players, localId }) => {
  // Load the sprite texture
  const spriteTexture = useLoader(THREE.TextureLoader, playerSpriteImg);

  return (
    <>
      {Object.keys(players).map((id) => {
        // Skip rendering the local player
        if (players[id].userId === localId) return null;

        const { x, y, z, username } = players[id].position
          ? { ...players[id].position, username: players[id].username }
          : { x: 0, y: 0, z: 0, username: "Unknown" };

        return (
          <group key={id}>
            {/* Player Sprite */}
            <sprite position={[x, y + 0.9, z]} scale={0.9}>
              <spriteMaterial
                map={spriteTexture}
                transparent={true}
                depthWrite={false} // Prevent z-buffer issues
              />
            </sprite>
            {/* Player Name */}
            <Text
              position={[x, y + 1.2, z]} // Position above the sprite
              fontSize={0.1}
              color="white"
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.005}
              outlineColor="black"
            >
              {username}
            </Text>
          </group>
        );
      })}
    </>
  );
};

export default OtherPlayers;
