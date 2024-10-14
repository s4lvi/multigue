// client/src/components/FirstPersonWeapon.js

import React, { useRef } from "react";
import { useLoader, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import swordReadyImg from "../assets/textures/sword_ready.png";
import gunReadyImg from "../assets/textures/gun_ready.png";
import { Billboard } from "@react-three/drei";

const FirstPersonWeapon = ({ equippedItem }) => {
  const { camera } = useThree();
  const weaponRef = useRef();

  // Load the appropriate texture based on the equipped item
  const gunTexture = useLoader(THREE.TextureLoader, gunReadyImg);
  const swordTexture = useLoader(THREE.TextureLoader, swordReadyImg);

  useFrame(() => {
    if (weaponRef.current) {
      weaponRef.current.position.copy(camera.position);
      weaponRef.current.rotation.copy(camera.rotation);
      weaponRef.current.updateMatrix();
      weaponRef.current.translateZ(-0.1);
    }
  });

  if (!equippedItem) return null;

  return (
    <Billboard ref={weaponRef}>
      <sprite scale={0.15} position={[0.1, -0.12, -0.1]}>
        <spriteMaterial
          map={
            equippedItem?.type === "sword"
              ? swordTexture
              : equippedItem?.type === "gun"
              ? gunTexture
              : null
          }
          transparent={true}
          depthWrite={false}
        />
      </sprite>
    </Billboard>
  );
};

export default FirstPersonWeapon;
