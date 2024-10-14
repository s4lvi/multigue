// client/src/contexts/AudioContext.js

import React, { createContext, useContext, useState } from "react";
import ReactHowler from "react-howler";
import backgroundMusic from "../src/assets/sounds/background-music.mp3";
import gunshotSound from "../src/assets/sounds/gunshot.mp3";
import footstepSound from "../src/assets/sounds/footstep.mp3";
import hitSound from "../src/assets/sounds/hit.mp3";
import swingSound from "../src/assets/sounds/swing.mp3";
import deathSound from "../src/assets/sounds/death.mp3";

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const [playGunshot, setPlayGunshot] = useState(false);
  const [playFootstep, setPlayFootstep] = useState(false);
  const [playHit, setPlayHit] = useState(false);
  const [playSwing, setPlaySwing] = useState(false);
  const [playDeath, setPlayDeath] = useState(false);

  const triggerGunshot = () => setPlayGunshot(true);
  const triggerFootstep = () => setPlayFootstep(true);
  const triggerHit = () => setPlayHit(true);
  const triggerSwing = () => setPlaySwing(true);
  const triggerDeath = () => setPlayDeath(true);

  return (
    <AudioContext.Provider
      value={{
        triggerGunshot,
        triggerFootstep,
        triggerHit,
        triggerSwing,
        triggerDeath,
      }}
    >
      {children}

      {/* Gunshot Sound */}
      <ReactHowler
        src={gunshotSound}
        playing={playGunshot}
        onEnd={() => setPlayGunshot(false)}
        volume={0.5}
      />

      {/* Footstep Sound */}
      <ReactHowler
        src={footstepSound}
        playing={playFootstep}
        onEnd={() => setPlayFootstep(false)}
        volume={0.3}
      />

      {/* Hit Sound */}
      <ReactHowler
        src={hitSound}
        playing={playHit}
        onEnd={() => setPlayHit(false)}
        volume={0.7}
      />

      {/* Hit Sound */}
      <ReactHowler
        src={swingSound}
        playing={playSwing}
        onEnd={() => setPlaySwing(false)}
        volume={0.9}
      />

      {/* Hit Sound */}
      <ReactHowler
        src={deathSound}
        playing={playDeath}
        onEnd={() => setPlayDeath(false)}
        volume={0.7}
      />
    </AudioContext.Provider>
  );
};
