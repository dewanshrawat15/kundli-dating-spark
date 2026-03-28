import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { StarField } from "../components/StarField";

const KUTTAS = [
  { name: "Varna", max: 1, color: "#f472b6" },
  { name: "Vasya", max: 2, color: "#c084fc" },
  { name: "Tara", max: 3, color: "#818cf8" },
  { name: "Yoni", max: 4, color: "#38bdf8" },
  { name: "Graha Maitri", max: 5, color: "#34d399" },
  { name: "Gana", max: 6, color: "#fbbf24" },
  { name: "Bhakoot", max: 7, color: "#fb923c" },
  { name: "Nadi", max: 8, color: "#f87171" },
];

// Demo scores (out of each max)
const DEMO_SCORES = [1, 2, 2, 3, 4, 5, 6, 8];
const TOTAL_MAX = KUTTAS.reduce((s, k) => s + k.max, 0); // 36
const TOTAL_SCORE = DEMO_SCORES.reduce((s, v) => s + v, 0); // 31

export const CompatibilityScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const exitOpacity = interpolate(frame, [50, 60], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const headerY = spring({ frame, fps, from: -30, to: 0, durationInFrames: 20 });

  // Animate total score counter
  const displayedScore = Math.round(interpolate(frame, [10, 45], [0, TOTAL_SCORE], { extrapolateRight: "clamp" }));

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1e003d 0%, #0d1b69 50%, #2d1b69 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: containerOpacity * exitOpacity,
        overflow: "hidden",
        padding: "0 60px",
      }}
    >
      <StarField count={40} />

      {/* Header */}
      <div
        style={{
          transform: `translateY(${headerY}px)`,
          textAlign: "center",
          marginBottom: 36,
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif" }}>
          Ashtakoot Compatibility Score
        </div>
        <div style={{ fontSize: 20, color: "#c4b5fd", marginTop: 8, fontFamily: "system-ui, sans-serif" }}>
          Arjun ♏ &nbsp;×&nbsp; Priya ♓
        </div>
      </div>

      {/* Score bars */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", height: 160, marginBottom: 32 }}>
        {KUTTAS.map((k, i) => {
          const barProgress = interpolate(
            frame,
            [10 + i * 3, 30 + i * 3],
            [0, DEMO_SCORES[i] / k.max],
            { extrapolateRight: "clamp" }
          );
          const barHeight = barProgress * 140;
          const labelOpacity = interpolate(frame, [20 + i * 3, 35 + i * 3], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div
              key={k.name}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                flex: 1,
              }}
            >
              <div
                style={{
                  opacity: labelOpacity,
                  color: k.color,
                  fontSize: 13,
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 700,
                }}
              >
                {DEMO_SCORES[i]}/{k.max}
              </div>
              <div
                style={{
                  width: "100%",
                  height: barHeight,
                  background: `linear-gradient(to top, ${k.color}, ${k.color}88)`,
                  borderRadius: "6px 6px 0 0",
                  boxShadow: `0 0 16px ${k.color}66`,
                  transition: "height 0.1s",
                }}
              />
              <div
                style={{
                  color: "#a78bfa",
                  fontSize: 11,
                  fontFamily: "system-ui, sans-serif",
                  textAlign: "center",
                  opacity: labelOpacity,
                  maxWidth: 70,
                }}
              >
                {k.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total score */}
      <div
        style={{
          background: "rgba(192,132,252,0.15)",
          border: "1px solid rgba(192,132,252,0.5)",
          borderRadius: 16,
          padding: "16px 48px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 900, color: "#fff", fontFamily: "Georgia, serif", lineHeight: 1 }}>
          <span style={{ color: "#f472b6" }}>{displayedScore}</span>
          <span style={{ fontSize: 28, color: "#a78bfa" }}>/36</span>
        </div>
        <div style={{ fontSize: 16, color: "#c4b5fd", marginTop: 6, fontFamily: "system-ui, sans-serif" }}>
          Excellent Match ✨
        </div>
      </div>
    </AbsoluteFill>
  );
};
