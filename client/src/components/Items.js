// client/src/components/Items.js

import React, { useContext } from "react";
import { TextureContext } from "./TextureContext";
import * as THREE from "three";

const Items = React.memo(({ items }) => {
  const { getTexture } = useContext(TextureContext);

  // Function to retrieve texture based on item type
  const getTextureByType = (type) => {
    return getTexture(type);
  };

  return (
    <>
      {items.map((item) => {
        const texture = getTextureByType(item.name);
        if (!texture) return null; // Skip rendering unknown item types

        return (
          <sprite
            key={item.id}
            position={[
              item.position.x,
              item.position.y + 0.75, // Adjust height as needed
              item.position.z,
            ]}
            scale={0.4}
          >
            <spriteMaterial
              map={texture}
              transparent={true}
              depthWrite={false}
            />
          </sprite>
        );
      })}
    </>
  );
});

export default Items;
