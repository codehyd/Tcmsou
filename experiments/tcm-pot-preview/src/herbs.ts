import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import {
  createAstragalusPile,
  createChenpi,
  createChrysanthemum,
  createGinsengBody,
  createGojiPile,
} from "./tactileHerbs.ts";

export type HerbInfo = {
  id: string;
  name: string;
  grams: number;
  effect: string;
  look: string;
};

export function createHerbTray(): THREE.Group {
  const tray = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.07, 1.15),
    new THREE.MeshStandardMaterial({ color: 0x5c3a22, roughness: 0.85, metalness: 0.04 }),
  );
  board.castShadow = true;
  board.receiveShadow = true;
  tray.add(board);

  const rimMat = new THREE.MeshStandardMaterial({ color: 0x3d2616, roughness: 0.8 });
  const front = new THREE.Mesh(new THREE.BoxGeometry(4.44, 0.05, 0.04), rimMat);
  front.position.set(0, 0.05, 0.505);
  tray.add(front);
  const back = front.clone();
  back.position.z = -0.505;
  tray.add(back);

  tray.position.set(0, 0.16, 1.92);
  return tray;
}

export async function createHerbModels(): Promise<THREE.Group[]> {
  const ginseng = await createGinsengBody();
  const setups: Array<{
    info: HerbInfo;
    body: THREE.Group;
    position: THREE.Vector3;
    labelHeight: number;
  }> = [
    {
      info: { id: "ginseng", name: "人参", grams: 9, effect: "大补元气，生津安神", look: "带须整支" },
      body: ginseng,
      position: new THREE.Vector3(-1.7, 0.22, 1.9),
      labelHeight: 0.28,
    },
    {
      info: { id: "goji", name: "枸杞", grams: 12, effect: "滋补肝肾，明目", look: "一撮干果" },
      body: createGojiPile(),
      position: new THREE.Vector3(-0.85, 0.2, 1.9),
      labelHeight: 0.26,
    },
    {
      info: { id: "astragalus", name: "黄芪", grams: 15, effect: "补气升阳，固表", look: "饮片" },
      body: createAstragalusPile(),
      position: new THREE.Vector3(0, 0.2, 1.9),
      labelHeight: 0.26,
    },
    {
      info: { id: "chrysanthemum", name: "菊花", grams: 8, effect: "疏风清热，平肝明目", look: "干花" },
      body: createChrysanthemum(),
      position: new THREE.Vector3(0.85, 0.2, 1.9),
      labelHeight: 0.26,
    },
    {
      info: { id: "chenpi", name: "陈皮", grams: 6, effect: "理气健脾，燥湿化痰", look: "橘皮" },
      body: createChenpi(),
      position: new THREE.Vector3(1.7, 0.2, 1.9),
      labelHeight: 0.24,
    },
  ];

  return setups.map((setup) => decorateHerb(setup.body, setup.info, setup.position, setup.labelHeight));
}

export function createHerbLabel(info: HerbInfo, height = 0.42): CSS2DObject {
  const el = document.createElement("div");
  el.className = "herb-label";
  el.innerHTML = `<strong>${info.name}</strong><span>${info.grams}g · ${info.look}</span>`;
  const label = new CSS2DObject(el);
  label.position.set(0, height, 0);
  return label;
}

function decorateHerb(
  mesh: THREE.Group,
  info: HerbInfo,
  position: THREE.Vector3,
  labelHeight: number,
): THREE.Group {
  mesh.position.copy(position);
  mesh.userData.role = "herb";
  mesh.userData.info = info;
  mesh.userData.inPot = false;
  mesh.userData.home = position.clone();

  const label = createHerbLabel(info, labelHeight);
  mesh.add(label);
  mesh.userData.labelEl = label.element;

  const plate = makeNameplate(info.name);
  plate.position.set(0, 0.205 - position.y, 0.42);
  mesh.add(plate);
  mesh.userData.plate = plate;

  mesh.traverse((child) => {
    if (child !== plate) {
      child.userData.role = "herb";
      child.userData.herbRoot = mesh;
    }
    if (child instanceof THREE.Mesh) child.castShadow = true;
  });
  return mesh;
}

function makeNameplate(name: string): THREE.Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#2b1c12";
  ctx.fillRect(0, 0, 256, 80);
  ctx.strokeStyle = "#c4a574";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 240, 64);
  ctx.fillStyle = "#f4e6d0";
  ctx.font = "bold 40px 'Microsoft YaHei', 'PingFang SC', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, 128, 42);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.13),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
  );
  plate.rotation.x = -Math.PI / 2;
  plate.userData.stayOnTray = true;
  return plate;
}
