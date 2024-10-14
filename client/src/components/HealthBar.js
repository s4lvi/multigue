// client/src/components/HealthBar.js

import React from "react";

const HealthBar = ({ health, mana }) => {
  const barWidth = 200;
  const barHeight = 20;
  const filledWidthH = (health / 100) * barWidth;
  const filledWidthM = (mana / 100) * barWidth;

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          width: `${barWidth}px`,
          height: `${barHeight}px`,
          backgroundColor: "red",
          border: "2px solid black",
          zIndex: "1000",
        }}
      >
        <div
          style={{
            width: `${filledWidthH}px`,
            height: "100%",
            backgroundColor: "green",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: "40px",
          left: "10px",
          width: `${barWidth}px`,
          height: `${barHeight}px`,
          backgroundColor: "red",
          border: "2px solid black",
          zIndex: "1000",
        }}
      >
        <div
          style={{
            width: `${filledWidthM}px`,
            height: "100%",
            backgroundColor: "blue",
          }}
        />
      </div>
    </>
  );
};

export default HealthBar;
