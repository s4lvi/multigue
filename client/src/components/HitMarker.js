// client/src/components/HitMarker.js

import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const HitMarker = ({ position, onComplete }) => {
  const markerRef = useRef();

  useEffect(() => {
    const timer = setTimeout(onComplete, 500); // Remove after 0.5 seconds
    return () => clearTimeout(timer);
  }, [onComplete]);

  useFrame(() => {
    if (markerRef.current) {
      // Optionally, add animations like scaling or fading
      markerRef.current.material.opacity -= 0.02;
      if (markerRef.current.material.opacity <= 0) {
        onComplete();
      }
    }
  });

  return (
    <sprite position={position} ref={markerRef}>
      <spriteMaterial
        color="red"
        transparent={true}
        opacity={1}
        depthWrite={false}
      />
    </sprite>
  );
};

export default HitMarker;
