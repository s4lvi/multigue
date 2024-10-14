// client/src/components/Items.js

import React from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import swordTextureImg from "../assets/textures/sword.png";
import gunTextureImg from "../assets/textures/gun.png";
import corpseTextureImg from "../assets/textures/corpse.png";
import bulletTextureImg from "../assets/textures/bullet.png"; // Add bullet texture

const Items = ({ items }) => {
  const swordTexture = useLoader(THREE.TextureLoader, swordTextureImg);
  const gunTexture = useLoader(THREE.TextureLoader, gunTextureImg);
  const corpseTexture = useLoader(THREE.TextureLoader, corpseTextureImg);
  const bulletTexture = useLoader(THREE.TextureLoader, bulletTextureImg); // Load bullet texture

  return (
    <>
      {items.map((item) => {
        let texture;
        switch (item.type) {
          case "sword":
            texture = swordTexture;
            break;
          case "gun":
            texture = gunTexture;
            break;
          case "corpse":
            texture = corpseTexture;
            break;
          case "bullet":
            texture = bulletTexture;
            break;
          default:
            return null;
        }

        return (
          <sprite
            key={item.id}
            position={[
              item.position.x,
              item.position.y + 0.75,
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
};

export default Items;
