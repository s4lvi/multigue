// client/src/utils/TextureContext.js

import React, { createContext } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

// Import all your texture images here
import swordReadyImg from "../assets/textures/sword_ready.png";
import gunReadyImg from "../assets/textures/gun_ready.png";
import swordImg from "../assets/textures/sword.png";
import gunImg from "../assets/textures/gun.png";
import corpseTextureImg from "../assets/textures/corpse.png";
import bulletTextureImg from "../assets/textures/bullet.png";
import healthPotionTextureImg from "../assets/textures/health_potion.png";
import manaPotionTextureImg from "../assets/textures/mana_potion.png";

// Create the context with a default getTexture function
const TextureContext = createContext({
  getTexture: () => null,
});

const TextureProvider = ({ children }) => {
  // Define an array of texture image paths
  const textureImages = [
    swordReadyImg,
    gunReadyImg,
    swordImg,
    gunImg,
    corpseTextureImg,
    bulletTextureImg,
    healthPotionTextureImg,
    manaPotionTextureImg,
    // Add more textures here as needed
  ];

  // Load all textures using useLoader
  const loadedTextures = useLoader(THREE.TextureLoader, textureImages);

  // Map each texture to a corresponding name
  const textureMap = {
    sword_ready: loadedTextures[0],
    gun_ready: loadedTextures[1],
    sword: loadedTextures[2],
    gun: loadedTextures[3],
    corpse: loadedTextures[4],
    bullet: loadedTextures[5],
    health_potion: loadedTextures[6],
    mana_potion: loadedTextures[7],
    // Extend this mapping as you add more textures
  };

  // Optionally, set texture filters or other properties here
  Object.values(textureMap).forEach((texture) => {
    if (texture) {
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      // Add any other texture settings here
    }
  });

  // Define the getTexture function
  const getTexture = (name) => {
    return textureMap[name] || null;
  };

  return (
    <TextureContext.Provider value={{ getTexture }}>
      {children}
    </TextureContext.Provider>
  );
};

export { TextureContext, TextureProvider };
