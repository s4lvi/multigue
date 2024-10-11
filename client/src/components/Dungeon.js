// client/src/components/Dungeon.js

import React, { useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";

// Import textures
import wallTextureImg from "../assets/textures/wall.png";
import floorTextureImg from "../assets/textures/floor.png";
import ceilingTextureImg from "../assets/textures/ceiling.png";

const Dungeon = ({ grid }) => {
  console.log(grid);
  // Load textures using Three.js's TextureLoader
  const wallTexture = useLoader(THREE.TextureLoader, wallTextureImg);
  const floorTexture = useLoader(THREE.TextureLoader, floorTextureImg);
  const ceilingTexture = useLoader(THREE.TextureLoader, ceilingTextureImg);

  // Repeat textures to cover larger surfaces
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(1, 1);

  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(1, 1);

  ceilingTexture.wrapS = ceilingTexture.wrapT = THREE.RepeatWrapping;
  ceilingTexture.repeat.set(1, 1);

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
          // Wall Block
          wallMeshes.push(
            <mesh
              key={`wall-${x}-${z}`}
              position={[worldX, 1, worldZ]} // Half the height to center the wall
              receiveShadow
              userData={{ type: "wall" }} // Tagging as wall
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial map={wallTexture} />
            </mesh>
          );
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
              <meshStandardMaterial map={floorTexture} />
            </mesh>
          );

          // Ceiling Block
          ceilingMeshes.push(
            <mesh
              key={`ceiling-${x}-${z}`}
              position={[worldX, 2, worldZ]} // Position the ceiling above the wall
              receiveShadow
              userData={{ type: "ceiling" }} // Tagging as ceiling
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial map={ceilingTexture} />
            </mesh>
          );
        }
      }
    }

    return { wallMeshes, floorMeshes, ceilingMeshes };
  }, [grid, wallTexture, floorTexture, ceilingTexture]);

  return (
    <group>
      {/* Render Floor Blocks */}
      {floorMeshes.map((mesh) => mesh)}

      {/* Render Wall Blocks */}
      {wallMeshes.map((mesh) => mesh)}

      {/* Render Ceiling Blocks */}
      {ceilingMeshes.map((mesh) => mesh)}
    </group>
  );
};

export default Dungeon;
