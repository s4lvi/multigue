// client/src/components/NPCs.js

import React from "react";
import { useLoader } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import npcSpriteImg from "../assets/textures/orc.png"; // Ensure you have a sprite for NPCs

const NPCs = ({ npcs }) => {
  // Load the sprite texture
  const spriteTexture = useLoader(THREE.TextureLoader, npcSpriteImg);
  console.log(npcs);
  return (
    <>
      {Object.keys(npcs).map((nid) => {
        const { id, type, position } = npcs[nid];

        const displayName = type;

        return (
          <group key={id}>
            {/* NPC Sprite */}
            <Billboard position={[position.x, position.y + 0.9, position.z]}>
              <sprite scale={[0.9, 0.9, 0.9]}>
                <spriteMaterial
                  map={spriteTexture}
                  transparent={true}
                  depthWrite={false}
                />
              </sprite>
            </Billboard>

            {/* NPC Name */}
            <Billboard position={[position.x, position.y + 1.4, position.z]}>
              <Text
                fontSize={0.1}
                color="white"
                anchorX="center"
                anchorY="bottom"
              >
                {displayName}
              </Text>
            </Billboard>

            {/* NPC Light (optional) */}
            <pointLight
              color="#0f0"
              intensity={2}
              position={[position.x, position.y + 1.4, position.z]}
            />
          </group>
        );
      })}
    </>
  );
};

export default NPCs;
