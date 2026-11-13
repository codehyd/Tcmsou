import * as THREE from "three";

export type Crop = { x: number; y: number; w: number; h: number };

const GRID = 96;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败：${src}`));
    img.src = src;
  });
}

function isBackdrop(r: number, g: number, b: number): boolean {
  const bluePaper = b > 155 && g > 150 && r > 110 && b >= r + 8 && g >= r - 6;
  const whitePaper = r > 248 && g > 248 && b > 248;
  return bluePaper || whitePaper;
}

function cutoutCanvas(img: HTMLImageElement, crop?: Crop): HTMLCanvasElement {
  const sx = crop ? Math.floor(crop.x * img.width) : 0;
  const sy = crop ? Math.floor(crop.y * img.height) : 0;
  const sw = crop ? Math.floor(crop.w * img.width) : img.width;
  const sh = crop ? Math.floor(crop.h * img.height) : img.height;

  const raw = document.createElement("canvas");
  raw.width = sw;
  raw.height = sh;
  const ctx = raw.getContext("2d")!;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  const pixels = ctx.getImageData(0, 0, sw, sh);
  const data = pixels.data;
  let minX = sw;
  let minY = sh;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const i = (y * sw + x) * 4;
      if (isBackdrop(data[i], data[i + 1], data[i + 2])) {
        data[i + 3] = 0;
        continue;
      }
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  ctx.putImageData(pixels, 0, 0);

  const pad = 4;
  const cx = Math.max(0, minX - pad);
  const cy = Math.max(0, minY - pad);
  const cw = Math.min(sw - cx, maxX - minX + pad * 2);
  const ch = Math.min(sh - cy, maxY - minY + pad * 2);
  const out = document.createElement("canvas");
  out.width = Math.max(1, cw);
  out.height = Math.max(1, ch);
  out.getContext("2d")!.drawImage(raw, cx, cy, cw, ch, 0, 0, cw, ch);
  return out;
}

function blurAlpha(values: Float32Array, size: number, passes: number): Float32Array {
  let current = values;
  for (let pass = 0; pass < passes; pass += 1) {
    const next = new Float32Array(size * size);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        let sum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue;
            sum += current[yy * size + xx];
            count += 1;
          }
        }
        next[y * size + x] = sum / count;
      }
    }
    current = next;
  }
  return current;
}

function sampleGrid(canvas: HTMLCanvasElement): { height: Float32Array; luma: Float32Array } {
  const tmp = document.createElement("canvas");
  tmp.width = GRID;
  tmp.height = GRID;
  const ctx = tmp.getContext("2d")!;
  ctx.drawImage(canvas, 0, 0, GRID, GRID);
  const { data } = ctx.getImageData(0, 0, GRID, GRID);
  const alpha = new Float32Array(GRID * GRID);
  const luma = new Float32Array(GRID * GRID);
  for (let i = 0; i < GRID * GRID; i += 1) {
    const o = i * 4;
    alpha[i] = data[o + 3] / 255;
    luma[i] = (data[o] * 0.3 + data[o + 1] * 0.59 + data[o + 2] * 0.11) / 255;
  }
  return { height: blurAlpha(alpha, GRID, 7), luma };
}

function displacePlane(
  width: number,
  height: number,
  heightMap: Float32Array,
  luma: Float32Array,
  thickness: number,
  invert: boolean,
): THREE.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(width, height, GRID - 1, GRID - 1);
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i += 1) {
    const u = uv.getX(i);
    const v = 1 - uv.getY(i);
    const x = Math.min(GRID - 1, Math.max(0, Math.round(u * (GRID - 1))));
    const y = Math.min(GRID - 1, Math.max(0, Math.round(v * (GRID - 1))));
    const idx = y * GRID + x;
    const mask = heightMap[idx];
    if (mask < 0.08) {
      pos.setZ(i, 0);
      continue;
    }
    const relief = mask * thickness + (1 - luma[idx]) * thickness * 0.35;
    pos.setZ(i, invert ? -relief * 0.55 : relief);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export async function createPhotoHerb(src: string, height: number, crop?: Crop): Promise<THREE.Group> {
  const img = await loadImage(src);
  const canvas = cutoutCanvas(img, crop);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const aspect = canvas.width / canvas.height;
  const width = height * aspect;
  const { height: heightMap, luma } = sampleGrid(canvas);
  const thickness = Math.min(width, height) * 0.28;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.16,
    roughness: 0.78,
    metalness: 0,
    side: THREE.FrontSide,
  });

  const group = new THREE.Group();
  const front = new THREE.Mesh(displacePlane(width, height, heightMap, luma, thickness, false), material);
  front.castShadow = true;
  front.receiveShadow = true;
  group.add(front);

  const back = new THREE.Mesh(
    displacePlane(width, height, heightMap, luma, thickness, true),
    material.clone(),
  );
  back.castShadow = true;
  group.add(back);

  group.userData.photoSize = { width, height };
  return group;
}
