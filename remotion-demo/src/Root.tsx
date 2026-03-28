import React from "react";
import { Composition } from "remotion";
import { KundliPromo } from "./KundliPromo";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="KundliPromo"
        component={KundliPromo}
        durationInFrames={270}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
