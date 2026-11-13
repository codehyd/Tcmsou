import * as THREE from "three";

function canvas(size = 512): { el: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const el = document.createElement("canvas");
  el.width = size;
  el.height = size;
  const ctx = el.getContext("2d");
  if (!ctx) throw new Error("无法创建贴图");
  return { el, ctx };
}

function texture(el: HTMLCanvasElement): THREE.CanvasTexture {
  const map = new THREE.CanvasTexture(el);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  return map;
}

function noise(ctx: CanvasRenderingContext2D, alpha: number, color: string, count: number): void {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i += 1) {
    const x = Math.random() * ctx.canvas.width;
    const y = Math.random() * ctx.canvas.height;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  ctx.globalAlpha = 1;
}

export function ginsengMaps(palette?: { base: string; dark: string; light: string }): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
} {
  const base = palette?.base ?? "#b08950";
  const dark = palette?.dark ?? "#5a3c20";
  const light = palette?.light ?? "#c9a66c";
  const { el, ctx } = canvas();
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 36; i += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 18 + Math.random() * 48;
    const blot = ctx.createRadialGradient(x, y, 0, x, y, r);
    blot.addColorStop(0, i % 2 === 0 ? `${dark}99` : `${light}66`);
    blot.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = blot;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = `${dark}aa`;
  for (let i = 0; i < 48; i += 1) {
    ctx.lineWidth = 0.8 + Math.random() * 2.4;
    ctx.globalAlpha = 0.25 + Math.random() * 0.45;
    const x0 = Math.random() * 512;
    const y0 = Math.random() * 512;
    const len = 24 + Math.random() * 110;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    const segs = 4 + Math.floor(Math.random() * 8);
    for (let k = 1; k <= segs; k += 1) {
      ctx.lineTo(
        x0 + (len * k) / segs + Math.sin(k * 1.2 + i) * 6,
        y0 + (Math.random() - 0.48) * 16,
      );
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  noise(ctx, 0.18, light, 3200);
  noise(ctx, 0.22, dark, 4200);
  const map = texture(el);

  const bump = canvas();
  bump.ctx.fillStyle = "#b0b0b0";
  bump.ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 12 + Math.random() * 40;
    const g = bump.ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, i % 3 === 0 ? "#6a6a6a" : "#c8c8c8");
    g.addColorStop(1, "rgba(176,176,176,0)");
    bump.ctx.fillStyle = g;
    bump.ctx.beginPath();
    bump.ctx.arc(x, y, r, 0, Math.PI * 2);
    bump.ctx.fill();
  }
  for (let i = 0; i < 70; i += 1) {
    bump.ctx.strokeStyle = Math.random() > 0.45 ? "#3a3a3a" : "#d0d0d0";
    bump.ctx.lineWidth = 0.8 + Math.random() * 2.4;
    bump.ctx.globalAlpha = 0.35 + Math.random() * 0.5;
    const x0 = Math.random() * 512;
    const y0 = Math.random() * 512;
    const len = 28 + Math.random() * 120;
    const segs = 5 + Math.floor(Math.random() * 9);
    const ang = (Math.random() - 0.5) * 0.9 + (Math.random() > 0.72 ? Math.PI * 0.5 : 0);
    bump.ctx.beginPath();
    bump.ctx.moveTo(x0, y0);
    for (let k = 1; k <= segs; k += 1) {
      const u = k / segs;
      bump.ctx.lineTo(
        x0 + Math.cos(ang) * len * u + Math.sin(u * 9 + i) * 4,
        y0 + Math.sin(ang) * len * u + (Math.random() - 0.5) * 7,
      );
    }
    bump.ctx.stroke();
  }
  bump.ctx.globalAlpha = 1;
  for (let i = 0; i < 90; i += 1) {
    bump.ctx.fillStyle = Math.random() > 0.5 ? "#2f2f2f" : "#e2e2e2";
    bump.ctx.beginPath();
    bump.ctx.ellipse(
      Math.random() * 512,
      Math.random() * 512,
      1 + Math.random() * 3.5,
      0.6 + Math.random() * 2.2,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    bump.ctx.fill();
  }

  const rough = canvas();
  rough.ctx.fillStyle = "#d8d8d8";
  rough.ctx.fillRect(0, 0, 512, 512);
  noise(rough.ctx, 0.45, "#6a6a6a", 7000);
  return { map, bump: texture(bump.el), roughness: texture(rough.el) };
}

export function gojiMaps(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const { el, ctx } = canvas();
  const g = ctx.createRadialGradient(220, 180, 20, 256, 256, 280);
  g.addColorStop(0, "#ff5a3a");
  g.addColorStop(0.35, "#d31818");
  g.addColorStop(0.7, "#9a0c0c");
  g.addColorStop(1, "#5a0606");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "rgba(70, 8, 8, 0.55)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 28; i += 1) {
    ctx.beginPath();
    const y = 20 + i * 17;
    ctx.moveTo(0, y);
    for (let x = 0; x < 512; x += 6) {
      ctx.lineTo(x, y + Math.sin(x * 0.2 + i) * 7);
    }
    ctx.stroke();
  }
  noise(ctx, 0.22, "#3a0404", 2500);
  ctx.fillStyle = "rgba(255, 180, 120, 0.18)";
  ctx.beginPath();
  ctx.ellipse(180, 150, 70, 40, -0.4, 0, Math.PI * 2);
  ctx.fill();
  const map = texture(el);

  const bump = canvas();
  bump.ctx.fillStyle = "#777";
  bump.ctx.fillRect(0, 0, 512, 512);
  bump.ctx.strokeStyle = "#111";
  for (let i = 0; i < 30; i += 1) {
    bump.ctx.beginPath();
    bump.ctx.moveTo(0, i * 17);
    for (let x = 0; x < 512; x += 6) bump.ctx.lineTo(x, i * 17 + Math.sin(x * 0.25) * 8);
    bump.ctx.stroke();
  }
  return { map, bump: texture(bump.el) };
}

export function astragalusMaps(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const { el, ctx } = canvas();
  ctx.fillStyle = "#c9a24c";
  ctx.fillRect(0, 0, 512, 512);
  const g = ctx.createRadialGradient(256, 256, 8, 256, 256, 250);
  g.addColorStop(0, "#f7edd0");
  g.addColorStop(0.12, "#efe0a8");
  g.addColorStop(0.28, "#e2c56a");
  g.addColorStop(0.42, "#c9a24e");
  g.addColorStop(0.55, "#e6d07a");
  g.addColorStop(0.72, "#d4b45c");
  g.addColorStop(0.88, "#b8923a");
  g.addColorStop(1, "#7a5a22");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(256, 256, 252, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(120, 82, 24, 0.35)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 42; i += 1) {
    const a = (i / 42) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(a) * 28, 256 + Math.sin(a) * 28);
    ctx.lineTo(256 + Math.cos(a) * 246, 256 + Math.sin(a) * 246);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(90, 60, 18, 0.55)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 256, 118, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 188, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(70, 46, 12, 0.5)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i += 1) {
    const a = i * 0.9;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(a) * 40, 256 + Math.sin(a) * 40);
    ctx.quadraticCurveTo(300 + i * 8, 200 + i * 20, 256 + Math.cos(a + 0.4) * 230, 256 + Math.sin(a + 0.4) * 230);
    ctx.stroke();
  }
  noise(ctx, 0.16, "#6a4a18", 1800);
  const map = texture(el);

  const bump = canvas();
  bump.ctx.fillStyle = "#999";
  bump.ctx.fillRect(0, 0, 512, 512);
  bump.ctx.strokeStyle = "#333";
  bump.ctx.lineWidth = 5;
  bump.ctx.beginPath();
  bump.ctx.arc(256, 256, 118, 0, Math.PI * 2);
  bump.ctx.stroke();
  bump.ctx.lineWidth = 2;
  for (let i = 0; i < 36; i += 1) {
    const a = (i / 36) * Math.PI * 2;
    bump.ctx.beginPath();
    bump.ctx.moveTo(256, 256);
    bump.ctx.lineTo(256 + Math.cos(a) * 250, 256 + Math.sin(a) * 250);
    bump.ctx.stroke();
  }
  return { map, bump: texture(bump.el) };
}

export function chrysanthemumMaps(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const { el, ctx } = canvas();
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#fff6d2");
  g.addColorStop(0.4, "#f3e3a2");
  g.addColorStop(0.75, "#e2c56a");
  g.addColorStop(1, "#c9a24e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = "rgba(150, 110, 40, 0.4)";
  for (let x = 16; x < 512; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + 8, 256, x - 4, 512);
    ctx.stroke();
  }
  noise(ctx, 0.12, "#a07830", 1600);
  const map = texture(el);

  const bump = canvas();
  bump.ctx.fillStyle = "#aaa";
  bump.ctx.fillRect(0, 0, 512, 512);
  bump.ctx.strokeStyle = "#444";
  for (let x = 16; x < 512; x += 16) {
    bump.ctx.beginPath();
    bump.ctx.moveTo(x, 0);
    bump.ctx.lineTo(x + 6, 512);
    bump.ctx.stroke();
  }
  return { map, bump: texture(bump.el) };
}

export function chenpiMaps(): { outer: THREE.CanvasTexture; inner: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const { el, ctx } = canvas();
  ctx.fillStyle = "#8a3a12";
  ctx.fillRect(0, 0, 512, 512);
  const g = ctx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, "#c45a1c");
  g.addColorStop(0.4, "#9a3c12");
  g.addColorStop(1, "#5a220c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 220; i += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = `rgba(40, 12, 4, ${0.25 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, 2 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  noise(ctx, 0.2, "#3a1408", 1800);
  const outer = texture(el);

  const innerC = canvas();
  const ig = innerC.ctx.createLinearGradient(0, 0, 0, 512);
  ig.addColorStop(0, "#f6e6c4");
  ig.addColorStop(0.5, "#e8d2a4");
  ig.addColorStop(1, "#d2b07a");
  innerC.ctx.fillStyle = ig;
  innerC.ctx.fillRect(0, 0, 512, 512);
  innerC.ctx.strokeStyle = "rgba(160, 120, 70, 0.35)";
  for (let y = 10; y < 512; y += 10) {
    innerC.ctx.beginPath();
    innerC.ctx.moveTo(0, y);
    innerC.ctx.lineTo(512, y + 3);
    innerC.ctx.stroke();
  }
  const inner = texture(innerC.el);

  const bump = canvas();
  bump.ctx.fillStyle = "#888";
  bump.ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 180; i += 1) {
    bump.ctx.fillStyle = Math.random() > 0.5 ? "#222" : "#ddd";
    bump.ctx.beginPath();
    bump.ctx.arc(Math.random() * 512, Math.random() * 512, 3, 0, Math.PI * 2);
    bump.ctx.fill();
  }
  return { outer, inner, bump: texture(bump.el) };
}

export function wrinkleGeometry(geometry: THREE.BufferGeometry, amount: number, scale = 18): void {
  const pos = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();
  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  for (let i = 0; i < pos.count; i += 1) {
    vertex.fromBufferAttribute(pos, i);
    normal.fromBufferAttribute(normals, i);
    const n =
      Math.sin(vertex.x * scale + vertex.y * 11) *
      Math.cos(vertex.y * (scale + 4) + vertex.z * 9) *
      Math.sin(vertex.z * scale);
    vertex.addScaledVector(normal, n * amount);
    pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}
