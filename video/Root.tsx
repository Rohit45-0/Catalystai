import { Composition } from "remotion";
import { FulfillGuardDemo, TOTAL_FRAMES } from "./FulfillGuardDemo";

export function RemotionRoot() {
  return (
    <Composition
      id="FulfillGuardDemo"
      component={FulfillGuardDemo}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
