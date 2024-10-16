// client/src/components/FirstPersonWeapon.js

import React, { useRef, useEffect, useState } from "react";
import { useLoader, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import swordReadyImg from "../assets/textures/sword_ready.png";
import gunReadyImg from "../assets/textures/gun_ready.png";
import { Billboard } from "@react-three/drei";

const FirstPersonWeapon = ({ equippedItem, attacking, hit }) => {
  const { camera } = useThree();
  const weaponRef = useRef();
  const [texture, setTexture] = useState(null);

  const weaponTextures = {
    sword: useLoader(THREE.TextureLoader, swordReadyImg),
    gun: useLoader(THREE.TextureLoader, gunReadyImg),
    // Add new weapon types here
  };

  useEffect(() => {
    let tex;
    if (equippedItem) {
      tex = weaponTextures[equippedItem.name];
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
    }
    setTexture(equippedItem ? tex : null);
  }, [equippedItem]);

  useFrame(() => {
    if (weaponRef.current) {
      // Position the weapon relative to the camera
      weaponRef.current.position.copy(camera.position);
      weaponRef.current.rotation.copy(camera.rotation);
      weaponRef.current.updateMatrix();
      weaponRef.current.translateZ(-0.1); // Adjust as needed
    }
  });

  if (!equippedItem) return null;

  return (
    <>
      {texture && (
        <Billboard ref={weaponRef}>
          <sprite
            scale={0.15}
            position={attacking ? [0.09, -0.13, -0.1] : [0.1, -0.12, -0.1]}
          >
            <spriteMaterial
              map={texture}
              transparent={true}
              depthWrite={false}
            />
          </sprite>
        </Billboard>
      )}{" "}
    </>
  );
};

export default React.memo(FirstPersonWeapon);
