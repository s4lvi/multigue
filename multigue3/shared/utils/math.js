export const calculateDistance = (pointA, pointB) => {
    const dx = pointA.x - pointB.x;
    const dy = pointA.y - pointB.y;
    const dz = pointA.z - pointB.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };