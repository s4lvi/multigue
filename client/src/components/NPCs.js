// client/src/components/NPCs.js

import React from "react";
import { useLoader } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import npcSpriteImg from "../assets/textures/orc.png"; // Ensure correct texture path

const NPCs = React.memo(({ npcs }) => {
  // Load the sprite texture
  const spriteTexture = useLoader(THREE.TextureLoader, npcSpriteImg);

  return (
    <>
      {Object.keys(npcs).map((id) => {
        const npc = npcs[id];
        if (!npc.position || !npc.id) return null; // Ensure position exists

        const { x, y, z } = npc.position;
        const npcName = npc.type ? npc.type : "NPC";

        return (
          <group key={id}>
            {/* NPC Sprite */}
            <Billboard position={[x, y + 0.9, z]}>
              <sprite scale={[0.9, 0.9, 0.9]}>
                <spriteMaterial
                  map={spriteTexture}
                  transparent={true}
                  depthWrite={false}
                />
              </sprite>
            </Billboard>

            {/* NPC Name */}
            <Billboard position={[x, y + 1.4, z]}>
              <Text
                fontSize={0.1}
                color={npc.stats.health > 0 ? "yellow" : "red"} // Color based on health
                anchorX="center"
                anchorY="bottom"
              >
                {npcName}
              </Text>
            </Billboard>

            {/* NPC Health Bar */}
            <Billboard position={[x, y + 1.6, z]}>
              <mesh>
                <planeGeometry args={[(npc.stats.health / 100) * 0.5, 0.03]} />
                <meshBasicMaterial
                  color={
                    npc.stats.health > 50
                      ? "green"
                      : npc.stats.health > 20
                      ? "yellow"
                      : "red"
                  }
                  transparent
                  opacity={0.7}
                />
              </mesh>
              <Text
                position={[0, 0.15, 0]}
                fontSize={0.05}
                color="white"
                anchorX="center"
                anchorY="top"
              ></Text>
            </Billboard>

            {/* Optional: Point Light for NPC */}
            <pointLight
              color="#0f0"
              intensity={npc.stats.health > 0 ? 3 : 0}
              position={[x, y + 1.4, z]}
            />
          </group>
        );
      })}
    </>
  );
});

export default NPCs;
