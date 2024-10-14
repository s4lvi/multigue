// client/src/components/BackgroundMusic.js

import React from "react";
import ReactHowler from "react-howler";
import backgroundMusic from "../assets/sounds/background-music.mp3";

const BackgroundMusic = () => {
  return (
    <ReactHowler
      src={backgroundMusic}
      playing={true}
      loop={true}
      volume={0.5} // Adjust volume between 0.0 and 1.0
    />
  );
};

export default BackgroundMusic;
