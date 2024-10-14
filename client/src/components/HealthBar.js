// client/src/components/HealthBar.js

import React from "react";

const HealthBar = ({ health }) => {
  const barWidth = 200;
  const barHeight = 20;
  const filledWidth = (health / 100) * barWidth;

  return (
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
          width: `${filledWidth}px`,
          height: "100%",
          backgroundColor: "green",
        }}
      />
    </div>
  );
};

export default HealthBar;
