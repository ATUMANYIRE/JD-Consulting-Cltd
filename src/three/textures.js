import * as THREE from "three";

function hash(x, y, seed) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y, seed, octaves = 5) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * valueNoise(x * frequency, y * frequency, seed + i * 13);
    frequency *= 2;
    amplitude *= 0.5;
  }
  return value;
}

const cache = new Map();

// Tileable-enough procedural surface texture; returns { map, bump } canvas textures.
export function surfaceTextures({ key, size = 256, scale = 6, dark, light, speckle = 0, veins = null, repeat = 1 }) {
  if (cache.has(key)) return cache.get(key);

  const colorCanvas = document.createElement("canvas");
  const bumpCanvas = document.createElement("canvas");
  colorCanvas.width = colorCanvas.height = bumpCanvas.width = bumpCanvas.height = size;
  const colorCtx = colorCanvas.getContext("2d");
  const bumpCtx = bumpCanvas.getContext("2d");
  const colorData = colorCtx.createImageData(size, size);
  const bumpData = bumpCtx.createImageData(size, size);
  const c1 = new THREE.Color(dark);
  const c2 = new THREE.Color(light);
  const vein = veins ? new THREE.Color(veins) : null;
  const tmp = new THREE.Color();
  const seed = key.length * 3.7;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * scale;
      const ny = (y / size) * scale;
      let n = fbm(nx, ny, seed);
      const cracks = Math.abs(fbm(nx * 1.7 + 11, ny * 1.7 + 5, seed + 3, 4) - 0.5);
      if (cracks < 0.025) n *= 0.55;
      if (speckle && hash(x, y, seed) > 1 - speckle) n = Math.min(1, n + 0.35);
      tmp.copy(c1).lerp(c2, n);
      if (vein) {
        const band = Math.abs(Math.sin((ny + fbm(nx * 0.8, ny * 0.8, seed + 9, 3) * 3) * 2.2));
        if (band < 0.06) tmp.lerp(vein, 0.85);
      }
      const i = (y * size + x) * 4;
      colorData.data[i] = tmp.r * 255;
      colorData.data[i + 1] = tmp.g * 255;
      colorData.data[i + 2] = tmp.b * 255;
      colorData.data[i + 3] = 255;
      const h = Math.floor(n * 255);
      bumpData.data[i] = bumpData.data[i + 1] = bumpData.data[i + 2] = h;
      bumpData.data[i + 3] = 255;
    }
  }
  colorCtx.putImageData(colorData, 0, 0);
  bumpCtx.putImageData(bumpData, 0, 0);

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = new THREE.CanvasTexture(bumpCanvas);
  for (const texture of [map, bump]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    texture.anisotropy = 4;
  }
  const result = { map, bump };
  cache.set(key, result);
  return result;
}

let glow = null;

export function glowTexture() {
  if (glow) return glow;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,244,220,1)");
  gradient.addColorStop(0.25, "rgba(234,149,52,0.85)");
  gradient.addColorStop(0.6, "rgba(226,138,46,0.25)");
  gradient.addColorStop(1, "rgba(226,138,46,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  glow = new THREE.CanvasTexture(canvas);
  glow.colorSpace = THREE.SRGBColorSpace;
  return glow;
}
