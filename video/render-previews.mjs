import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..");
const outputDir = join(projectRoot, "demo-output", "previews");
mkdirSync(outputDir, { recursive: true });

const frames = [
  ["01-title", 90],
  ["02-overview", 300],
  ["03-connections", 570],
  ["04-agent-result", 910],
  ["05-case", 1150],
  ["06-approved", 1280],
  ["07-problem-input", 1530],
  ["08-agent-build", 1910],
  ["09-generated-output", 2125],
  ["10-maintainer", 2380],
  ["11-version-diff", 2685],
  ["12-deployed", 2805],
  ["13-audit", 2955],
  ["14-outro", 3205],
];

const serveUrl = await bundle({
  entryPoint: join(here, "index.ts"),
  onProgress: (progress) => {
    if (progress === 1) console.log("Remotion bundle ready");
  },
});

const compositions = await getCompositions(serveUrl, { logLevel: "warn" });
const composition = compositions.find((item) => item.id === "CatalystAIDemo");

if (!composition) {
  throw new Error("CatalystAIDemo composition was not found");
}

for (const [name, frame] of frames) {
  const output = join(outputDir, `${name}.png`);
  await renderStill({
    composition,
    serveUrl,
    output,
    frame,
    imageFormat: "png",
    logLevel: "warn",
  });
  console.log(`Rendered ${name} at frame ${frame}`);
}
