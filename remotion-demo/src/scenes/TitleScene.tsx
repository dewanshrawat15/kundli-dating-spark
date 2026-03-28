import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { StarField } from "../components/StarField";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = spring({ frame, fps, from: 40, to: 0, durationInFrames: 25 });

  const subtitleOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const subtitleY = spring({ frame: frame - 15, fps, from: 30, to: 0, durationInFrames: 25 });

  const heartScale = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20, config: { damping: 8 } });
  const starScale = spring({ frame: frame - 5, fps, from: 0, to: 1, durationInFrames: 20, config: { damping: 8 } });

  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });

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
      <StarField count={80} />

      {/* Icon cluster */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24, gap: 8 }}>
        <span
          style={{
            fontSize: 64,
            transform: `scale(${starScale})`,
            display: "inline-block",
            filter: "drop-shadow(0 0 20px #facc15)",
          }}
        >
          ⭐
        </span>
        <span
          style={{
            fontSize: 40,
            transform: `scale(${heartScale})`,
            display: "inline-block",
            filter: "drop-shadow(0 0 16px #f472b6)",
            marginTop: -20,
            marginLeft: -12,
          }}
        >
          💖
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 72,
          fontWeight: 900,
          color: "#ffffff",
          fontFamily: "Georgia, serif",
          textAlign: "center",
          letterSpacing: "-1px",
          textShadow: "0 4px 32px rgba(192,132,252,0.6)",
        }}
      >
        Kundli Dating
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          fontSize: 26,
          color: "#c4b5fd",
          fontFamily: "Georgia, serif",
          textAlign: "center",
          marginTop: 16,
          fontStyle: "italic",
          letterSpacing: "0.5px",
        }}
      >
        Let the stars guide you to your soulmate
      </div>

      {/* Feature pills */}
      <div
        style={{
          opacity: taglineOpacity,
          display: "flex",
          gap: 16,
          marginTop: 40,
        }}
      >
        {["Vedic Astrology", "AI-Powered", "Ashtakoot Matching"].map((label) => (
          <div
            key={label}
            style={{
              background: "rgba(192,132,252,0.15)",
              border: "1px solid rgba(192,132,252,0.4)",
              borderRadius: 999,
              padding: "8px 20px",
              color: "#e9d5ff",
              fontSize: 16,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
