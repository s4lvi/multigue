// client/src/components/PositionalSound.js

import React, { useRef, useEffect } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gunshotSound from "../assets/sounds/gunshot.mp3";

const PositionalSound = ({ position, volume = 1.0 }) => {
  const soundRef = useRef();
  const { camera, scene } = useThree();
  const buffer = useLoader(THREE.AudioLoader, gunshotSound);

  useEffect(() => {
    const sound = new THREE.PositionalAudio(camera.listener);
    sound.setBuffer(buffer);
    sound.setRefDistance(20);
    sound.setVolume(volume);
    sound.setLoop(false);
    sound.play();

    sound.position.set(...position);
    scene.add(sound);
    soundRef.current = sound;

    return () => {
      if (soundRef.current) {
        soundRef.current.stop();
        scene.remove(soundRef.current);
        soundRef.current.disconnect();
      }
    };
  }, [buffer, position, volume, camera.listener, scene]);

  return null;
};

export default PositionalSound;
