import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { FeatureScene } from "./scenes/FeatureScene";
import { CompatibilityScene } from "./scenes/CompatibilityScene";
import { CtaScene } from "./scenes/CtaScene";

// Scene timings (in frames at 30fps)
// 0-60:   Title / Hero (2s)
// 60-120: Feature: Kundli Matching (2s)
// 120-180: Feature: Ashtakoot Score (2s)
// 180-240: Compatibility animation (2s)
// 240-270: CTA (1s)

export const KundliPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0f0c29" }}>
      <Sequence from={0} durationInFrames={60}>
        <TitleScene />
      </Sequence>
      <Sequence from={60} durationInFrames={60}>
        <FeatureScene
          icon="✨"
          title="Vedic Kundli Matching"
          description="Ancient wisdom powered by Swiss Ephemeris — precise birth chart calculations for your exact moment of birth."
          accentColor="#c084fc"
        />
      </Sequence>
      <Sequence from={120} durationInFrames={60}>
        <FeatureScene
          icon="🔯"
          title="Ashtakoot Algorithm"
          description="36-point compatibility scoring across Varna, Vasya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, and Nadi."
          accentColor="#f472b6"
        />
      </Sequence>
      <Sequence from={180} durationInFrames={60}>
        <CompatibilityScene />
      </Sequence>
      <Sequence from={240} durationInFrames={30}>
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  );
};
