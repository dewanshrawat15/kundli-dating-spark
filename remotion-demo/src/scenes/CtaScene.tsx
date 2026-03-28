import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { StarField } from "../components/StarField";

export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, from: 0.7, to: 1, durationInFrames: 18, config: { damping: 10 } });
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const pulse = Math.sin((frame / 30) * Math.PI * 2) * 0.04 + 1;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1e003d 0%, #0d1b69 50%, #2d1b69 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <StarField count={60} />

      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 16, filter: "drop-shadow(0 0 24px #f472b6)" }}>
          💖
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: "#fff",
            fontFamily: "Georgia, serif",
            textShadow: "0 4px 32px rgba(244,114,182,0.5)",
            marginBottom: 16,
          }}
        >
          Start Your Journey
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#c4b5fd",
            fontFamily: "system-ui, sans-serif",
            marginBottom: 40,
          }}
        >
          Find love written in the stars
        </div>

        <div
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
            borderRadius: 999,
            padding: "20px 60px",
            fontSize: 26,
            fontWeight: 700,
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            transform: `scale(${pulse})`,
            boxShadow: "0 8px 40px rgba(168,85,247,0.5)",
          }}
        >
          Get Started Free
        </div>
      </div>
    </AbsoluteFill>
  );
};
