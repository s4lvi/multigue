// client/src/components/PreloadSounds.js

import React from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

import gunshotSound from "../assets/sounds/gunshot.mp3";
import footstepSound from "../assets/sounds/footstep.mp3";
import hitSound from "../assets/sounds/hit.mp3";
import swingSound from "../assets/sounds/swing.mp3";
import deathSound from "../assets/sounds/death.mp3";
import npcGunshotSound from "../assets/sounds/swing.mp3"; // Example for NPC gunshot

const PreloadSounds = () => {
  // Preload all sounds to ensure they are cached
  const sounds = useLoader(THREE.AudioLoader, [
    gunshotSound,
    footstepSound,
    hitSound,
    swingSound,
    deathSound,
    npcGunshotSound,
  ]);

  return null; // This component does not render anything
};

export default PreloadSounds;
