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
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(1, 1);

  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(1, 1);

  ceilingTexture.wrapS = ceilingTexture.wrapT = THREE.RepeatWrapping;
  ceilingTexture.repeat.set(1, 1);

  // Memoize meshes for performance
  const walls = useMemo(() => {
    const wallMeshes = [];
    const ceilingMeshes = [];
    for (let z = 0; z < grid.length; z++) {
      for (let x = 0; x < grid[0].length; x++) {
        if (grid[z][x] === 1) {
          // Wall Block
          wallMeshes.push(
            <mesh
              key={`wall-${x}-${z}`}
              position={[
                x - grid[0].length / 2,
                1, // Half the height to center the wall
                z - grid.length / 2,
              ]}
              receiveShadow
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial map={wallTexture} />
            </mesh>
          );
        } else if (grid[z][x] === 0) {
          // Floor Block
          wallMeshes.push(
            <mesh
              key={`floor-${x}-${z}`}
              position={[
                x - grid[0].length / 2,
                0, // Ground level
                z - grid.length / 2,
              ]}
              receiveShadow
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial map={floorTexture} />
            </mesh>
          );

          // Ceiling Block
          ceilingMeshes.push(
            <mesh
              key={`ceiling-${x}-${z}`}
              position={[
                x - grid[0].length / 2,
                2, // Position the ceiling above the wall
                z - grid.length / 2,
              ]}
              receiveShadow
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial map={ceilingTexture} />
            </mesh>
          );
        }
      }
    }

    return { wallMeshes, ceilingMeshes };
  }, [grid, wallTexture, floorTexture, ceilingTexture]);

  return (
    <group>
      {/* Render Floor Blocks */}
      {walls.wallMeshes
        .filter((mesh) => mesh.key.startsWith("floor"))
        .map((mesh) => mesh)}

      {/* Render Wall Blocks */}
      {walls.wallMeshes
        .filter(
          (mesh) => mesh.key.startsWith("wall") && !mesh.key.startsWith("floor")
        )
        .map((mesh) => mesh)}

      {/* Render Ceiling Blocks */}
      {walls.ceilingMeshes.map((mesh) => mesh)}
    </group>
  );
};

export default Dungeon;
