// client/src/components/HitMarker.js

import React, { useEffect, useRef } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import hitMarkerImg from "../assets/textures/hit_marker.png"; // Ensure this path is correct

const HitMarker = ({ position, onComplete }) => {
  const texture = useLoader(THREE.TextureLoader, hitMarkerImg);
  const spriteRef = useRef();
  const lifetime = 0.5; // seconds
  const startTime = useRef(performance.now());

  useFrame(() => {
    const elapsed = (performance.now() - startTime.current) / 1000;
    if (elapsed > lifetime) {
      if (onComplete) onComplete();
    } else {
      // Optional: Add scaling or fading effects
      const scale = THREE.MathUtils.lerp(1, 0.5, elapsed / lifetime);
      spriteRef.current.scale.set(scale, scale, scale);
      spriteRef.current.material.opacity = THREE.MathUtils.lerp(
        1,
        0,
        elapsed / lifetime
      );
    }
  });

  return (
    <sprite ref={spriteRef} position={position}>
      <spriteMaterial
        map={texture}
        transparent={true}
        opacity={1}
        depthWrite={false}
      />
    </sprite>
  );
};

export default HitMarker;
