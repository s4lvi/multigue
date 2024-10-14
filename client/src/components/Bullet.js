// client/src/components/Bullet.js

import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Bullet = ({ position, direction, speed = 10, setBullets, id }) => {
  const bulletRef = useRef();

  useEffect(() => {
    // Initialize bullet position and direction
    bulletRef.current.position.set(position.x, position.y, position.z);
  }, [position]);

  useFrame((state, delta) => {
    if (bulletRef.current) {
      const moveDistance = speed * delta;
      const moveVector = direction.clone().multiplyScalar(moveDistance);
      bulletRef.current.position.add(moveVector);

      // Remove bullet after certain distance or time
      const distance = bulletRef.current.position.distanceTo(
        new THREE.Vector3(position.x, position.y, position.z)
      );
      if (distance > 50) {
        setBullets((prev) => prev.filter((b) => b.id !== id));
      }
    }
  });

  return (
    <mesh ref={bulletRef}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="yellow" />
    </mesh>
  );
};

export default Bullet;
