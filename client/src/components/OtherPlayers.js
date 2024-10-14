// client/src/components/OtherPlayers.js

import React from "react";
import { useLoader } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei"; // Import Billboard
import * as THREE from "three";
import playerSpriteImg from "../assets/textures/player.png";

const OtherPlayers = ({ players, localId }) => {
  // Load the sprite texture
  const spriteTexture = useLoader(THREE.TextureLoader, playerSpriteImg);

  return (
    <>
      {Object.keys(players).map((id) => {
        const player = players[id];

        // Skip rendering the local player
        if (player.userId === localId) return null;

        const { x, y, z } = player.position
          ? player.position
          : { x: 0, y: 0, z: 0 };
        const username = player.username || "Unknown";

        return (
          <group key={id}>
            {/* Player Sprite */}
            <Billboard position={[x, y + 0.9, z]}>
              <sprite scale={[0.9, 0.9, 0.9]}>
                <spriteMaterial
                  map={spriteTexture}
                  transparent={true}
                  depthWrite={false}
                />
              </sprite>
            </Billboard>

            {/* Player Name */}
            <Billboard position={[x, y + 1.4, z]}>
              <Text
                fontSize={0.1}
                color="white"
                anchorX="center"
                anchorY="bottom"
              >
                {username}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </>
  );
};

export default OtherPlayers;
