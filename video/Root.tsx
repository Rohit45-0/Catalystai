import { Composition } from "remotion";
import { CatalystAIDemo, TOTAL_FRAMES } from "./CatalystAIDemo";

export function RemotionRoot() {
  return (
    <Composition
      id="CatalystAIDemo"
      component={CatalystAIDemo}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
