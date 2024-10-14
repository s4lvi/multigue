// client/src/components/Bullets.js

import React from "react";
import Bullet from "./Bullet";

const Bullets = ({ bullets, setBullets }) => {
  return (
    <>
      {bullets.map((bullet) => (
        <Bullet
          key={bullet.id}
          id={bullet.id}
          position={bullet.position}
          direction={bullet.direction}
          setBullets={setBullets}
        />
      ))}
    </>
  );
};

export default Bullets;
