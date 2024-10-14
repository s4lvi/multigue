// client/src/components/HitMarker.js

import React, { useEffect, useState } from "react";
import { Html } from "@react-three/drei";

const HitMarker = ({ isHit }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isHit) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 500); // Hide after 0.5 seconds
      return () => clearTimeout(timer);
    }
  }, [isHit]);

  if (!visible) return null;

  return (
    <Html center>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "50px",
          height: "50px",
          marginLeft: "-25px",
          marginTop: "-25px",
          border: "2px solid red",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
    </Html>
  );
};

export default HitMarker;
