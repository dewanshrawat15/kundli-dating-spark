import React, { useMemo } from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface StarFieldProps {
  count?: number;
}

export const StarField: React.FC<StarFieldProps> = ({ count = 60 }) => {
  const frame = useCurrentFrame();

  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: ((i * 137.508) % 100),
      y: ((i * 97.31) % 100),
      size: 1 + (i % 3),
      opacity: 0.2 + (i % 10) * 0.08,
      twinkleOffset: i * 7,
    }));
  }, [count]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {stars.map((star) => {
        const twinkle = Math.sin(((frame + star.twinkleOffset) / 45) * Math.PI) * 0.3 + 0.7;
        return (
          <div
            key={star.id}
            style={{
              position: "absolute",
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              borderRadius: "50%",
              background: "#ffffff",
              opacity: star.opacity * twinkle,
            }}
          />
        );
      })}
    </div>
  );
};
