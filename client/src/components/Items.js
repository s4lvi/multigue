// client/src/components/Items.js

import React from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import swordTextureImg from "../assets/textures/sword.png";
import gunTextureImg from "../assets/textures/gun.png";
import corpseTextureImg from "../assets/textures/corpse.png";
import bulletTextureImg from "../assets/textures/bullet.png";
import healthPotionTextureImg from "../assets/textures/health_potion.png";
import manaPotionTextureImg from "../assets/textures/mana_potion.png"; // Add bullet texture

const Items = React.memo(({ items }) => {
  const swordTexture = useLoader(THREE.TextureLoader, swordTextureImg);
  const gunTexture = useLoader(THREE.TextureLoader, gunTextureImg);
  const corpseTexture = useLoader(THREE.TextureLoader, corpseTextureImg);
  const bulletTexture = useLoader(THREE.TextureLoader, bulletTextureImg);
  const healthPotionTexture = useLoader(
    THREE.TextureLoader,
    healthPotionTextureImg
  );
  const manaPotionTexture = useLoader(
    THREE.TextureLoader,
    manaPotionTextureImg
  ); // Load bullet texture

  const getTextureByType = (type) => {
    switch (type) {
      case "sword":
        return swordTexture;
      case "gun":
        return gunTexture;
      case "corpse":
        return corpseTexture;
      case "bullet":
        return bulletTexture;
      case "mana_potion":
        return manaPotionTexture;
      case "health_potion":
        return healthPotionTexture;
      default:
        console.warn(`Unknown item type: ${type}`);
        return null;
    }
  };

  return (
    <>
      {items.map((item) => {
        const texture = getTextureByType(item.name);
        if (!texture) return null; // Skip rendering unknown item types

        return (
          <sprite
            key={item.id}
            position={[
              item.position.x,
              item.position.y + 0.75, // Adjust height as needed
              item.position.z,
            ]}
            scale={0.4}
          >
            <spriteMaterial
              map={texture}
              transparent={true}
              depthWrite={false}
            />
          </sprite>
        );
      })}
    </>
  );
});

export default Items;
