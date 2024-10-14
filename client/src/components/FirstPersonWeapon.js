// client/src/components/FirstPersonWeapon.js

import React from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import swordReadyImg from "../assets/textures/sword_ready.png";
import gunReadyImg from "../assets/textures/gun_ready.png";

const FirstPersonWeapon = ({ equippedItem }) => {
  if (!equippedItem) return null;

  let texture;
  switch (equippedItem.type) {
    case "sword":
      texture = useLoader(THREE.TextureLoader, swordReadyImg);
      break;
    case "gun":
      texture = useLoader(THREE.TextureLoader, gunReadyImg);
      break;
    default:
      return null;
  }

  return (
    <sprite position={[0.5, -0.5, -1]} scale={0.5}>
      <spriteMaterial map={texture} transparent={true} depthWrite={false} />
    </sprite>
  );
};

export default FirstPersonWeapon;
