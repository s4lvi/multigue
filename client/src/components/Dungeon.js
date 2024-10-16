// client/src/components/Dungeon.js

import React, { useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";

// Import textures
import wallTextureImg from "../assets/textures/wall.png";
import floorTextureImg from "../assets/textures/floor.png";
import ceilingTextureImg from "../assets/textures/ceiling.png";

const Dungeon = ({ grid }) => {
  // Load textures using Three.js's TextureLoader
  const wallTexture = useLoader(THREE.TextureLoader, wallTextureImg);
  const floorTexture = useLoader(THREE.TextureLoader, floorTextureImg);
  const ceilingTexture = useLoader(THREE.TextureLoader, ceilingTextureImg);

  // Repeat textures to cover larger surfaces
  [wallTexture, floorTexture, ceilingTexture].forEach((texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  });

  // Memoize meshes for performance
  const { wallMeshes, floorMeshes, ceilingMeshes } = useMemo(() => {
    const wallMeshes = [];
    const floorMeshes = [];
    const ceilingMeshes = [];
    for (let z = 0; z < grid.length; z++) {
      for (let x = 0; x < grid[0].length; x++) {
        const worldX = x - grid[0].length / 2;
        const worldZ = z - grid.length / 2;
        if (grid[z][x] === 1) {
          // Wall Block (Two vertical slices)
          [1, 2].forEach((yOffset) => {
            wallMeshes.push(
              <mesh
                key={`wall-${x}-${z}-${yOffset}`}
                position={[worldX, yOffset, worldZ]}
                receiveShadow
                userData={{ type: "wall" }} // Tagging as wall
              >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial map={wallTexture} />
              </mesh>
            );
          });
        } else if (grid[z][x] === 0) {
          // Floor Block
          floorMeshes.push(
            <mesh
              key={`floor-${x}-${z}`}
              position={[worldX, 0, worldZ]} // Ground level
              receiveShadow
              userData={{ type: "floor" }} // Tagging as floor
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                map={floorTexture}
                side={THREE.DoubleSide}
              />
            </mesh>
          );

          // Ceiling Block
          ceilingMeshes.push(
            <mesh
              key={`ceiling-${x}-${z}`}
              position={[worldX, 3, worldZ]}
              receiveShadow
              userData={{ type: "ceiling" }}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                map={ceilingTexture}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        }
      }
    }
    return { wallMeshes, floorMeshes, ceilingMeshes };
  }, [grid, wallTexture, floorTexture, ceilingTexture]);

  return (
    <group>
      {floorMeshes}
      {wallMeshes}
      {ceilingMeshes}
    </group>
  );
};

export default Dungeon;
