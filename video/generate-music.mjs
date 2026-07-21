import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = join(here, "..", "public", "demo", "audio");
mkdirSync(outputDir, { recursive: true });

const sampleRate = 22050;

function writeWave(path, duration, sampleAt) {
  const sampleCount = Math.ceil(duration * sampleRate);
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const value = Math.max(-1, Math.min(1, sampleAt(time)));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  }

  writeFileSync(path, buffer);
}

const chords = [
  [110, 164.81, 220],
  [98, 146.83, 196],
  [130.81, 164.81, 261.63],
  [87.31, 130.81, 174.61],
];
const sceneStarts = [0, 8, 21, 33, 48, 62, 70, 82, 97, 109, 123, 134];

writeWave(join(outputDir, "ambient.wav"), 146, (time) => {
  const chord = chords[Math.floor(time / 8) % chords.length];
  const local = time % 8;
  const fade = Math.min(1, local / 1.8) * Math.min(1, (8 - local) / 1.8);
  const movement = 0.84 + 0.16 * Math.sin(Math.PI * 2 * time / 12);
  let pad = 0;

  chord.forEach((frequency, index) => {
    pad += Math.sin(Math.PI * 2 * frequency * time + index * 0.7) * (0.11 - index * 0.018);
    pad += Math.sin(Math.PI * 2 * frequency * 0.5 * time) * 0.035;
  });

  let marker = 0;
  for (const start of sceneStarts) {
    const age = time - start;
    if (age >= 0 && age < 1.4) {
      marker += Math.sin(Math.PI * 2 * 659.25 * age) * Math.exp(-age * 4.2) * 0.08;
      marker += Math.sin(Math.PI * 2 * 987.77 * age) * Math.exp(-age * 5.1) * 0.035;
    }
  }

  return pad * fade * movement + marker;
});

writeWave(join(outputDir, "click.wav"), 0.22, (time) => {
  const envelope = Math.exp(-time * 24);
  return (
    Math.sin(Math.PI * 2 * 900 * time) * envelope * 0.55 +
    Math.sin(Math.PI * 2 * 420 * time) * envelope * 0.25
  );
});

writeWave(join(outputDir, "success.wav"), 1.05, (time) => {
  const notes = [523.25, 659.25, 783.99];
  let value = 0;
  notes.forEach((frequency, index) => {
    const start = index * 0.16;
    const age = time - start;
    if (age >= 0) {
      value += Math.sin(Math.PI * 2 * frequency * age) * Math.exp(-age * 4.6) * 0.32;
    }
  });
  return value;
});

console.log(`Generated original demo audio in ${outputDir}`);
