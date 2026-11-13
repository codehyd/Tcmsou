import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  astragalusMaps,
  chenpiMaps,
  chrysanthemumMaps,
  ginsengMaps,
  gojiMaps,
} from "./herbTextures.ts";

function seedRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function physical(params: THREE.MeshPhysicalMaterialParameters): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    metalness: 0,
    sheen: 0.28,
    sheenRoughness: 0.82,
    ...params,
  });
}

function parallelFrames(curve: THREE.Curve<THREE.Vector3>, segments: number) {
  const tangents: THREE.Vector3[] = [];
  const normals: THREE.Vector3[] = [];
  const binormals: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i += 1) {
    tangents.push(curve.getTangentAt(i / segments).normalize());
  }

  const first = new THREE.Vector3();
  if (Math.abs(tangents[0].y) < 0.85) first.crossVectors(tangents[0], new THREE.Vector3(0, 1, 0));
  else first.crossVectors(tangents[0], new THREE.Vector3(1, 0, 0));
  first.normalize();
  normals.push(first);
  binormals.push(new THREE.Vector3().crossVectors(tangents[0], first).normalize());

  const axis = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  for (let i = 1; i <= segments; i += 1) {
    axis.crossVectors(tangents[i - 1], tangents[i]);
    if (axis.lengthSq() < 1e-10) {
      normals.push(normals[i - 1].clone());
    } else {
      axis.normalize();
      const angle = Math.acos(THREE.MathUtils.clamp(tangents[i - 1].dot(tangents[i]), -1, 1));
      quat.setFromAxisAngle(axis, angle);
      normals.push(normals[i - 1].clone().applyQuaternion(quat).normalize());
    }
    binormals.push(new THREE.Vector3().crossVectors(tangents[i], normals[i]).normalize());
  }

  return { normals, binormals };
}

type TubeBark = {
  grooves?: number;
  grooveDepth?: number;
  flatten?: number;
  lumps?: number;
  bowls?: boolean;
  bowlDepth?: number;
  rings?: boolean;
  capStart?: boolean;
  capEnd?: boolean;
};

function variableTube(
  points: THREE.Vector3[],
  radiusAt: (t: number) => number,
  tubularSegments = 42,
  radialSegments = 14,
  minRadius = 0.008,
  bark: TubeBark = {},
): THREE.BufferGeometry {
  const grooves = bark.grooves ?? 0;
  const grooveDepth = bark.grooveDepth ?? 0.22;
  const flatten = bark.flatten ?? 0;
  const lumps = bark.lumps ?? 0;
  const bowls = bark.bowls ?? false;
  const rings = bark.rings ?? false;
  const capStart = bark.capStart ?? true;
  const capEnd = bark.capEnd ?? true;
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.12);
  const frames = parallelFrames(curve, tubularSegments);
  const ringSize = radialSegments + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i += 1) {
    const t = i / tubularSegments;
    const p = curve.getPointAt(t);
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];
    const radius = Math.max(minRadius, radiusAt(t));
    const lump =
      1 +
      lumps *
        (0.45 * Math.sin(t * 13.7 + 0.6) +
          0.3 * Math.sin(t * 31.1 - 1.2) +
          0.16 * Math.sin(t * 53 + 2.1));
    for (let j = 0; j <= radialSegments; j += 1) {
      const a = (j / radialSegments) * Math.PI * 2;
      const oval = 1 - flatten * Math.abs(Math.sin(a));
      const bowl =
        bowls && t > 0.02 && t < 0.22
          ? 1 -
            0.04 *
              Math.pow(Math.max(0, Math.sin(t * 23 + Math.sin(a * 1.4))), 2) *
              (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(a * 2.05 + t * 5)))
          : 1;
      const valley =
        grooves > 0
          ? 1 -
            grooveDepth *
              Math.pow(0.5 + 0.5 * Math.cos(a * grooves + t * 5 + Math.sin(a * 2.4)), 1.35) *
              (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(a * 1.7 + t * 19)))
          : 1;
      const flake = 1 + 0.05 * Math.sin(a * 11 + t * 27) * Math.sin(t * 15 + a * 3);
      const grit = 1 + 0.03 * Math.sin(a * 6.4 + t * 43) * Math.sin(t * 9.7 - a * 4.1);
      const band = Math.sin(t * 29.3 + 0.85 * Math.sin(a * 2.1 + t * 4.4) + Math.sin(t * 7.1));
      const sparse = band > 0.42 ? (band - 0.42) / 0.58 : 0;
      const broken = Math.pow(0.5 + 0.5 * Math.sin(a * 1.7 + t * 11 + 3.2 * Math.sin(a * 0.9)), 2.2);
      const ring = rings ? 1 - 0.09 * Math.pow(sparse, 1.35) * broken : 1;
      const rr = radius * lump * bowl * ring * oval * valley * flake * grit;
      positions.push(
        p.x + (normal.x * Math.cos(a) + binormal.x * Math.sin(a)) * rr,
        p.y + (normal.y * Math.cos(a) + binormal.y * Math.sin(a)) * rr,
        p.z + (normal.z * Math.cos(a) + binormal.z * Math.sin(a)) * rr,
      );
      uvs.push(t * 2.2, j / radialSegments);
    }
  }

  for (let i = 0; i < tubularSegments; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const a = i * ringSize + j;
      const b = a + ringSize;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }

  if (capStart || capEnd) {
    const start = curve.getPointAt(0);
    let startCenter = -1;
    if (capStart) {
      const tangent = curve.getTangentAt(0).normalize();
      const inset = Math.max(0.003, radiusAt(0) * 0.16);
      const innerStart = positions.length / 3;
      for (let j = 0; j <= radialSegments; j += 1) {
        const ox = positions[j * 3];
        const oy = positions[j * 3 + 1];
        const oz = positions[j * 3 + 2];
        positions.push(
          start.x + (ox - start.x) * 0.38 + tangent.x * inset,
          start.y + (oy - start.y) * 0.38 + tangent.y * inset,
          start.z + (oz - start.z) * 0.38 + tangent.z * inset,
        );
        uvs.push(0.04, j / radialSegments);
      }
      startCenter = positions.length / 3;
      const bowl = start.clone().addScaledVector(tangent, inset * 1.35);
      positions.push(bowl.x, bowl.y, bowl.z);
      uvs.push(0, 0.5);
      for (let j = 0; j < radialSegments; j += 1) {
        const i0 = innerStart + j;
        const i1 = innerStart + j + 1;
        indices.push(j, j + 1, i1, j, i1, i0);
        indices.push(startCenter, i1, i0);
      }
    }
    let endCenter = -1;
    if (capEnd) {
      endCenter = positions.length / 3;
      const end = curve.getPointAt(1);
      positions.push(end.x, end.y, end.z);
      uvs.push(1, 0.5);
      const e = tubularSegments * ringSize;
      for (let j = 0; j < radialSegments; j += 1) {
        indices.push(endCenter, e + j, e + j + 1);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function fiberPath(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  length: number,
  rand: () => number,
  bends = 6,
): THREE.Vector3[] {
  const dir = direction.clone().normalize();
  const side = new THREE.Vector3(0, 1, 0).cross(dir);
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0).cross(dir);
  side.normalize();
  const up = new THREE.Vector3().crossVectors(dir, side).normalize();
  const points = [origin.clone()];
  const swayA = (rand() - 0.5) * 6.2;
  const swayB = (rand() - 0.5) * 5.1;
  for (let i = 1; i <= bends; i += 1) {
    const t = i / bends;
    const point = origin.clone().addScaledVector(dir, length * t);
    const wobble = (0.014 + t * 0.07) * (0.7 + rand() * 0.9);
    point.addScaledVector(side, Math.sin(t * swayA + rand()) * wobble);
    point.addScaledVector(up, Math.cos(t * swayB) * wobble * 0.85);
    point.y += -t * t * (0.012 + rand() * 0.03) + (rand() - 0.5) * 0.01;
    points.push(point);
  }
  return points;
}

function collectRootlets(
  origin: THREE.Vector3,
  aim: THREE.Vector3,
  count: number,
  rand: () => number,
  lengthRange: [number, number],
): THREE.BufferGeometry[] {
  const geos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i += 1) {
    const spread = 0.8 + rand() * 1.1;
    const dir = aim
      .clone()
      .add(new THREE.Vector3((rand() - 0.5) * spread, (rand() - 0.7) * 0.9, (rand() - 0.5) * spread))
      .normalize();
    const start = origin.clone().add(
      new THREE.Vector3((rand() - 0.5) * 0.03, (rand() - 0.5) * 0.016, (rand() - 0.5) * 0.03),
    );
    const length = lengthRange[0] + rand() * (lengthRange[1] - lengthRange[0]);
    const radius = 0.0007 + rand() * 0.0013;
    geos.push(
      variableTube(
        fiberPath(start, dir, length, rand, 6 + Math.floor(rand() * 3)),
        (t) => radius * (1 - t * 0.78),
        12,
        4,
        0.00035,
      ),
    );
    if (rand() > 0.32) {
      const mid = start.clone().addScaledVector(dir, length * (0.28 + rand() * 0.4));
      const branchDir = dir
        .clone()
        .add(new THREE.Vector3((rand() - 0.5) * 1.8, (rand() - 0.5) * 1.1, (rand() - 0.5) * 1.8))
        .normalize();
      geos.push(
        variableTube(
          fiberPath(mid, branchDir, length * (0.3 + rand() * 0.35), rand, 5),
          (t) => radius * 0.55 * (1 - t * 0.75),
          8,
          4,
          0.0003,
        ),
      );
    }
  }
  return geos;
}

function addFiberCloud(group: THREE.Group, material: THREE.Material, geos: THREE.BufferGeometry[]): void {
  const valid = geos.filter((geo) => (geo.getAttribute("position")?.count ?? 0) > 6);
  if (valid.length === 0) return;
  const merged = mergeGeometries(valid, false);
  if (!merged) return;
  const mesh = new THREE.Mesh(merged, material);
  mesh.castShadow = true;
  group.add(mesh);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败：${src}`));
    img.src = src;
  });
}

async function sampleBarkPalette(src: string): Promise<{ base: string; dark: string; light: string } | null> {
  try {
    const img = await loadImage(src);
    const width = 160;
    const height = Math.round((img.height / img.width) * width);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, width, height);
    const { data } = ctx.getImageData(0, 0, width, height);
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    let darkR = 0;
    let darkG = 0;
    let darkB = 0;
    let darkN = 0;
    let lightR = 0;
    let lightG = 0;
    let lightB = 0;
    let lightN = 0;
    for (let i = 0; i < data.length; i += 4) {
      const pr = data[i];
      const pg = data[i + 1];
      const pb = data[i + 2];
      const luma = pr * 0.3 + pg * 0.59 + pb * 0.11;
      const chroma = Math.max(pr, pg, pb) - Math.min(pr, pg, pb);
      if (luma > 210 || luma < 35 || chroma < 12 || pr < pb + 8) continue;
      r += pr;
      g += pg;
      b += pb;
      count += 1;
      if (luma < 95) {
        darkR += pr;
        darkG += pg;
        darkB += pb;
        darkN += 1;
      } else if (luma < 175) {
        lightR += pr;
        lightG += pg;
        lightB += pb;
        lightN += 1;
      }
    }
    if (count < 40) return null;
    const hex = (rr: number, gg: number, bb: number) =>
      `#${[rr, gg, bb].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
    return {
      base: hex(r / count, g / count, b / count),
      dark: darkN ? hex(darkR / darkN, darkG / darkN, darkB / darkN) : "#5a3c20",
      light: lightN ? hex(lightR / lightN, lightG / lightN, lightB / lightN) : "#c9a66c",
    };
  } catch {
    return null;
  }
}

function saucer(radius = 0.28): THREE.Mesh {
  const dish = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.92, 0.028, 28, 1, false),
    physical({ color: 0x6a3d24, roughness: 0.7, sheen: 0.08 }),
  );
  dish.receiveShadow = true;
  dish.castShadow = true;
  dish.userData.stayOnTray = true;
  return dish;
}

export async function createGinsengBody(): Promise<THREE.Group> {
  const group = new THREE.Group();
  const maps = ginsengMaps({
    base: "#9a9a9a",
    dark: "#6a6a6a",
    light: "#b4b4b4",
  });
  const bark = { grooves: 3, grooveDepth: 0.05, flatten: 0.035, lumps: 0.06, bowls: true, rings: true };
  const skin = physical({
    bumpMap: maps.bump,
    bumpScale: 0.22,
    roughnessMap: maps.roughness,
    roughness: 0.86,
    color: 0xb08954,
    sheen: 0.08,
    sheenColor: new THREE.Color(0xc4a06a),
  });
  const fiberMat = physical({
    color: 0xb08954,
    roughness: 0.94,
    sheen: 0.015,
  });

  const body = new THREE.Mesh(
    variableTube(
      [
        new THREE.Vector3(0.26, 0.1, 0.04),
        new THREE.Vector3(0.22, 0.088, 0.022),
        new THREE.Vector3(0.16, 0.076, 0.006),
        new THREE.Vector3(0.06, 0.074, -0.008),
        new THREE.Vector3(-0.04, 0.07, 0.006),
        new THREE.Vector3(-0.16, 0.05, 0.02),
        new THREE.Vector3(-0.28, 0.03, 0.038),
      ],
      (t) => {
        const n0 = 0.5 - 0.5 * Math.cos(Math.min(1, t / 0.34) * Math.PI);
        if (t < 0.34) return 0.041 + 0.017 * n0 + 0.004 * Math.sin(t * 21);
        if (t < 0.58) return 0.058 + 0.005 * Math.sin(t * 9.4) + 0.003 * Math.sin(t * 23);
        return Math.max(0.01, 0.056 * (1 - (t - 0.58) * 1.35));
      },
      88,
      28,
      0.012,
      { ...bark, capStart: true, flatten: 0.05, bowls: true, lumps: 0.07, grooveDepth: 0.08 },
    ),
    skin,
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.028, 16), skin);
  plug.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-0.85, -0.28, -0.4).normalize(),
  );
  plug.position.set(0.244, 0.093, 0.032);
  plug.castShadow = true;
  group.add(plug);

  const branches = [
    {
      pts: [
        new THREE.Vector3(0.04, 0.07, 0.02),
        new THREE.Vector3(-0.06, 0.048, 0.05),
        new THREE.Vector3(-0.15, 0.03, 0.095),
        new THREE.Vector3(-0.23, 0.018, 0.13),
      ],
      r0: 0.038,
    },
    {
      pts: [
        new THREE.Vector3(0.04, 0.068, -0.018),
        new THREE.Vector3(-0.07, 0.046, -0.048),
        new THREE.Vector3(-0.17, 0.028, -0.085),
        new THREE.Vector3(-0.26, 0.016, -0.11),
      ],
      r0: 0.036,
    },
    {
      pts: [
        new THREE.Vector3(0.02, 0.082, 0.012),
        new THREE.Vector3(-0.08, 0.11, 0.04),
        new THREE.Vector3(-0.16, 0.14, 0.07),
        new THREE.Vector3(-0.22, 0.16, 0.1),
      ],
      r0: 0.024,
    },
    {
      pts: [
        new THREE.Vector3(0.02, 0.08, -0.012),
        new THREE.Vector3(-0.09, 0.108, -0.04),
        new THREE.Vector3(-0.17, 0.135, -0.072),
        new THREE.Vector3(-0.24, 0.155, -0.095),
      ],
      r0: 0.02,
    },
    {
      pts: [
        new THREE.Vector3(0.0, 0.078, 0.028),
        new THREE.Vector3(-0.1, 0.082, 0.07),
        new THREE.Vector3(-0.18, 0.078, 0.11),
        new THREE.Vector3(-0.25, 0.07, 0.14),
      ],
      r0: 0.016,
    },
    {
      pts: [
        new THREE.Vector3(-0.02, 0.06, -0.02),
        new THREE.Vector3(-0.12, 0.05, -0.055),
        new THREE.Vector3(-0.2, 0.038, -0.09),
        new THREE.Vector3(-0.27, 0.028, -0.12),
      ],
      r0: 0.014,
    },
    {
      pts: [
        new THREE.Vector3(-0.04, 0.088, 0.0),
        new THREE.Vector3(-0.12, 0.12, 0.012),
        new THREE.Vector3(-0.18, 0.145, 0.02),
      ],
      r0: 0.011,
    },
  ];

  for (const branch of branches) {
    const mesh = new THREE.Mesh(
      variableTube(
        branch.pts,
        (t) => Math.max(0.006, branch.r0 * (1 - t * 0.7)),
        40,
        16,
        0.005,
        { grooves: 4, grooveDepth: 0.06, flatten: 0.03, lumps: 0.025, rings: true, capStart: false },
      ),
      skin,
    );
    mesh.castShadow = true;
    group.add(mesh);
  }

  const rand = seedRand(27);
  const fibers = [
    ...collectRootlets(new THREE.Vector3(-0.28, 0.03, 0.038), new THREE.Vector3(-1, -0.25, 0.1), 58, rand, [0.07, 0.18]),
    ...collectRootlets(new THREE.Vector3(-0.23, 0.018, 0.13), new THREE.Vector3(-0.45, -0.35, 0.9), 42, rand, [0.06, 0.16]),
    ...collectRootlets(new THREE.Vector3(-0.26, 0.016, -0.11), new THREE.Vector3(-0.5, -0.35, -0.9), 40, rand, [0.06, 0.15]),
    ...collectRootlets(new THREE.Vector3(-0.22, 0.16, 0.1), new THREE.Vector3(-0.4, 0.85, 0.55), 36, rand, [0.05, 0.13]),
    ...collectRootlets(new THREE.Vector3(-0.24, 0.155, -0.095), new THREE.Vector3(-0.45, 0.8, -0.5), 32, rand, [0.05, 0.12]),
    ...collectRootlets(new THREE.Vector3(-0.18, 0.145, 0.02), new THREE.Vector3(-0.35, 0.95, 0.1), 22, rand, [0.04, 0.1]),
    ...collectRootlets(new THREE.Vector3(-0.25, 0.07, 0.14), new THREE.Vector3(-0.6, 0.15, 0.85), 24, rand, [0.05, 0.12]),
    ...collectRootlets(new THREE.Vector3(-0.27, 0.028, -0.12), new THREE.Vector3(-0.7, -0.2, -0.75), 22, rand, [0.05, 0.11]),
    ...collectRootlets(new THREE.Vector3(-0.16, 0.034, 0.02), new THREE.Vector3(-0.8, -0.15, 0), 28, rand, [0.05, 0.12]),
    ...collectRootlets(new THREE.Vector3(-0.12, 0.048, 0.01), new THREE.Vector3(-0.4, 0.2, 0.05), 16, rand, [0.035, 0.09]),
  ];
  addFiberCloud(group, fiberMat, fibers);
  group.userData.ginsengSkin = skin;

  group.rotation.y = 0.28;
  return group;
}

export function createGojiPile(): THREE.Group {
  const group = new THREE.Group();
  group.add(saucer(0.26));
  const maps = gojiMaps();
  const rand = seedRand(44);

  for (let i = 0; i < 26; i += 1) {
    const geo = new THREE.SphereGeometry(1, 18, 14);
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v += 1) {
      const x = pos.getX(v);
      const y = pos.getY(v);
      const z = pos.getZ(v);
      const wrinkle = 1 - 0.14 * Math.abs(Math.sin(y * 7.5)) * (0.55 + 0.45 * Math.sin(x * 6 + z * 4));
      pos.setXYZ(v, x * wrinkle * 0.52, y * wrinkle * 0.88, z * wrinkle * 0.48);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const berry = new THREE.Mesh(
      geo,
      physical({
        map: maps.map,
        bumpMap: maps.bump,
        bumpScale: 0.55,
        color: new THREE.Color().setHSL(0.015, 0.82, 0.38 + rand() * 0.1),
        roughness: 0.46,
        sheen: 0.48,
        sheenColor: new THREE.Color(0xff7048),
        sheenRoughness: 0.55,
      }),
    );
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand()) * 0.16;
    berry.position.set(Math.cos(angle) * radius, 0.03 + (i % 5) * 0.012, Math.sin(angle) * radius * 0.72);
    berry.rotation.set(rand() * 1.2, rand() * Math.PI, rand() * 1.2);
    berry.scale.setScalar(0.036 + rand() * 0.012);
    berry.castShadow = true;
    berry.receiveShadow = true;
    group.add(berry);
  }
  return group;
}

export function createAstragalusPile(): THREE.Group {
  const group = new THREE.Group();
  group.add(saucer(0.27));
  const maps = astragalusMaps();
  const face = physical({
    map: maps.map,
    bumpMap: maps.bump,
    bumpScale: 0.4,
    roughness: 0.74,
    sheenColor: new THREE.Color(0xf0e0b0),
  });
  const rind = physical({ color: 0x8a6a32, roughness: 0.82 });
  const rand = seedRand(71);

  for (let i = 0; i < 9; i += 1) {
    const slice = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.068, 28), face);
    top.rotation.x = -Math.PI / 2;
    top.position.y = 0.006;
    const bottom = top.clone();
    bottom.position.y = -0.006;
    bottom.rotation.x = Math.PI / 2;
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.07, 0.012, 28, 1, true), rind);
    slice.add(top, bottom, edge);
    slice.position.set((rand() - 0.5) * 0.22, 0.03 + i * 0.008, (rand() - 0.5) * 0.16);
    slice.rotation.set(rand() * 0.35, rand() * Math.PI, rand() * 0.4);
    slice.scale.set(0.85 + rand() * 0.35, 1, 0.8 + rand() * 0.3);
    slice.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    group.add(slice);
  }
  return group;
}

export function createChrysanthemum(): THREE.Group {
  const group = new THREE.Group();
  group.add(saucer(0.26));
  const maps = chrysanthemumMaps();
  const petalMat = physical({
    map: maps.map,
    bumpMap: maps.bump,
    bumpScale: 0.25,
    roughness: 0.88,
    sheen: 0.18,
    sheenColor: new THREE.Color(0xfff1c4),
    side: THREE.DoubleSide,
  });
  const rand = seedRand(12);

  for (let layer = 0; layer < 4; layer += 1) {
    const count = 14 + layer * 4;
    for (let i = 0; i < count; i += 1) {
      const petal = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 0.13, 6, 10), petalMat);
      const pos = petal.geometry.attributes.position;
      for (let v = 0; v < pos.count; v += 1) {
        const x = pos.getX(v);
        const y = pos.getY(v);
        const flare = 1 - Math.abs(x) * 6 * Math.max(0, y + 0.02);
        pos.setX(v, x * flare);
        pos.setZ(v, 0.03 * Math.sin((y + 0.06) * 9) - y * y * 0.8);
      }
      pos.needsUpdate = true;
      petal.geometry.computeVertexNormals();

      const a = (i / count) * Math.PI * 2 + layer * 0.18;
      const lift = 0.12 + layer * 0.08;
      petal.position.set(Math.cos(a) * (0.04 + layer * 0.018), 0.04, Math.sin(a) * (0.04 + layer * 0.018));
      petal.rotation.set(-0.9 + lift + rand() * 0.15, 0, a + Math.PI / 2);
      petal.scale.setScalar(0.85 + rand() * 0.25);
      petal.castShadow = true;
      group.add(petal);
    }
  }

  const heart = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 12, 10),
    physical({ color: 0xc9a24a, roughness: 0.7 }),
  );
  heart.position.y = 0.045;
  heart.scale.set(1, 0.45, 1);
  group.add(heart);
  return group;
}

export function createChenpi(): THREE.Group {
  const group = new THREE.Group();
  const maps = chenpiMaps();
  const outer = physical({
    map: maps.outer,
    bumpMap: maps.bump,
    bumpScale: 1.6,
    roughness: 0.8,
    sheen: 0.12,
    sheenColor: new THREE.Color(0xc45a1c),
  });
  const shape = new THREE.Shape();
  shape.moveTo(-0.16, -0.1);
  shape.bezierCurveTo(-0.2, -0.02, -0.18, 0.08, -0.08, 0.12);
  shape.bezierCurveTo(0.02, 0.16, 0.14, 0.1, 0.18, 0.02);
  shape.bezierCurveTo(0.2, -0.06, 0.12, -0.14, 0.02, -0.13);
  shape.bezierCurveTo(-0.06, -0.13, -0.12, -0.14, -0.16, -0.1);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 20,
  });
  const pos = geo.attributes.position;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    vertex.fromBufferAttribute(pos, i);
    const t = (vertex.x + 0.2) / 0.4;
    const curl = t * 1.15;
    const s = Math.sin(curl);
    const c = Math.cos(curl);
    const y = vertex.y;
    const z = vertex.z;
    pos.setXYZ(i, vertex.x, y * c - z * s + 0.04, y * s + z * c);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const peel = new THREE.Mesh(geo, outer);
  peel.castShadow = true;
  peel.receiveShadow = true;
  peel.position.y = 0.03;
  peel.rotation.y = -0.4;
  group.add(peel);
  return group;
}
