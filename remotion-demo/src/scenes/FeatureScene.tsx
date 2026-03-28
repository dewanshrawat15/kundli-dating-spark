import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { StarField } from "../components/StarField";

interface FeatureSceneProps {
  icon: string;
  title: string;
  description: string;
  accentColor: string;
}

export const FeatureScene: React.FC<FeatureSceneProps> = ({ icon, title, description, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardScale = spring({ frame, fps, from: 0.8, to: 1, durationInFrames: 20, config: { damping: 12 } });
  const cardOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const iconRotate = interpolate(frame, [0, 30], [0, 360], { extrapolateRight: "clamp" });
  const textOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const textY = spring({ frame: frame - 10, fps, from: 20, to: 0, durationInFrames: 20 });

  const exitOpacity = interpolate(frame, [50, 60], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1e003d 0%, #0d1b69 50%, #2d1b69 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: exitOpacity,
        overflow: "hidden",
      }}
    >
      <StarField count={50} />

      <div
        style={{
          opacity: cardOpacity,
          transform: `scale(${cardScale})`,
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${accentColor}55`,
          borderRadius: 24,
          padding: "56px 64px",
          maxWidth: 700,
          textAlign: "center",
          boxShadow: `0 0 60px ${accentColor}22`,
        }}
      >
        <div
          style={{
            fontSize: 80,
            marginBottom: 24,
            display: "inline-block",
            transform: `rotate(${iconRotate}deg)`,
            filter: `drop-shadow(0 0 24px ${accentColor})`,
          }}
        >
          {icon}
        </div>

        <div
          style={{
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: "#ffffff",
              fontFamily: "Georgia, serif",
              marginBottom: 16,
              textShadow: `0 2px 20px ${accentColor}88`,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#c4b5fd",
              fontFamily: "system-ui, sans-serif",
              lineHeight: 1.6,
            }}
          >
            {description}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
