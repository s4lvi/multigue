// client/src/components/PreloadSounds.js

import React from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import backgroundMusic from "../assets/sounds/background-music.mp3";
import gunshotSound from "../assets/sounds/gunshot.mp3";
import footstepSound from "../assets/sounds/footstep.mp3";
import hitSound from "../assets/sounds/hit-sound.mp3";

const PreloadSounds = () => {
  const bgMusic = useLoader(THREE.AudioLoader, backgroundMusic);
  const gunshot = useLoader(THREE.AudioLoader, gunshotSound);
  const footstep = useLoader(THREE.AudioLoader, footstepSound);
  const hit = useLoader(THREE.AudioLoader, hitSound);

  return null; // This component doesn't render anything
};

export default PreloadSounds;
