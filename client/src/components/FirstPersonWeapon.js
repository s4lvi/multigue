// client/src/components/FirstPersonWeapon.js

import React, { useRef, useEffect, useContext, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { TextureContext } from "./TextureContext";

const FirstPersonWeapon = ({ equippedItem, attacking, hit }) => {
  const { camera } = useThree();
  const weaponRef = useRef();
  const { getTexture } = useContext(TextureContext);
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (equippedItem) {
      // Attempt to get the ready texture first
      const readyTexture = getTexture(`${equippedItem.name}_ready`);
      // Fallback to the base texture if ready texture is not found
      const tex = readyTexture || getTexture(equippedItem.name);
      if (tex) {
        setTexture(tex);
      }
    } else {
      setTexture(null);
    }
  }, [equippedItem, getTexture]);

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
      )}
    </>
  );
};

export default React.memo(FirstPersonWeapon);
