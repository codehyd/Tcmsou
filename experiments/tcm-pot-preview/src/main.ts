import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { animateCauldron, createCauldron } from "./cauldron.ts";
import { createHerbLabel, createHerbModels, createHerbTray, type HerbInfo } from "./herbs.ts";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const potList = document.querySelector<HTMLDivElement>("#pot-list")!;
const dropHint = document.querySelector<HTMLDivElement>("#drop-hint")!;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x140e0a);
scene.fog = new THREE.Fog(0x140e0a, 8, 16);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 40);
camera.position.set(2.6, 2.15, 4.6);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0.7, 1.05);
controls.minDistance = 2.2;
controls.maxDistance = 9;
controls.maxPolarAngle = Math.PI / 2.08;

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.inset = "0";
labelRenderer.domElement.style.pointerEvents = "none";
document.querySelector("#app")!.appendChild(labelRenderer.domElement);

const hemi = new THREE.HemisphereLight(0xffe2c4, 0x1a120c, 1.15);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffd8a8, 1.55);
sun.position.set(4.2, 6.2, 3.2);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 18;
scene.add(sun);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.42;

const fill = new THREE.PointLight(0x7ab8ff, 0.28, 12);
fill.position.set(-3.5, 2.2, 2.4);
scene.add(fill);

const trayLight = new THREE.SpotLight(0xffe6c4, 4.2, 6, 0.7, 0.35, 1);
trayLight.position.set(0.2, 2.4, 2.6);
trayLight.target.position.set(0, 0.25, 1.9);
scene.add(trayLight, trayLight.target);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(9, 48),
  new THREE.MeshStandardMaterial({ color: 0x120c08, roughness: 1, metalness: 0 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.08;
floor.receiveShadow = true;
scene.add(floor);

const table = new THREE.Mesh(
  new THREE.BoxGeometry(5.4, 0.14, 3.8),
  new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.88, metalness: 0.04 }),
);
table.receiveShadow = true;
table.castShadow = true;
scene.add(table);

const cauldron = createCauldron();
cauldron.group.position.y = 0.07;
scene.add(cauldron.group);
scene.add(createHerbTray());

const herbs = await createHerbModels();
for (const herb of herbs) scene.add(herb);

const ginsengSkin = herbs[0]?.userData.ginsengSkin as THREE.MeshPhysicalMaterial | undefined;
const colorTrials: Array<{ name: string; color: number }> = [
  { name: "须根同色", color: 0xb08954 },
  { name: "暖浅金", color: 0xc4a06a },
  { name: "浅羊皮", color: 0xd2bc90 },
  { name: "深褐", color: 0x8a6230 },
];
const sandbox = new THREE.Group();
sandbox.position.set(0, 0.28, 1.45);
colorTrials.forEach((trial, index) => {
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 20, 16),
    new THREE.MeshPhysicalMaterial({ color: trial.color, roughness: 0.88, metalness: 0 }),
  );
  ball.position.x = -1.35 + index * 0.32;
  ball.castShadow = true;
  ball.userData.sandboxColor = trial.color;
  ball.userData.sandboxName = trial.name;
  sandbox.add(ball);
});
scene.add(sandbox);

const inPot: HerbInfo[] = [];
const waterColor = new THREE.Color(0x6b4318);
const herbTints: Record<string, number> = {
  ginseng: 0xc9a45c,
  goji: 0x8a1d12,
  astragalus: 0xd4b85a,
  chrysanthemum: 0xe7d48a,
  chenpi: 0xb85a1c,
};

type Toss = {
  mesh: THREE.Group;
  from: THREE.Vector3;
  to: THREE.Vector3;
  t: number;
};

const tosses: Toss[] = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pointerDown = new THREE.Vector2();
const gltfLoader = new GLTFLoader();
let droppedModels = 0;

function herbFromObject(object: THREE.Object3D): THREE.Group | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.userData.info && current instanceof THREE.Group) return current;
    current = current.parent;
  }
  return null;
}

function updateHud(): void {
  if (inPot.length === 0) {
    potList.innerHTML =
      "锅里还是空的<br />药盘从左到右：人参、枸杞、黄芪、菊花、陈皮<br />桌前四个色球可试人参主根颜色，须根不变";
    return;
  }
  potList.innerHTML = inPot
    .map((item) => `<div>${item.name} ${item.grams}g · ${item.effect}</div>`)
    .join("");
}

function tintWater(id: string): void {
  const tint = new THREE.Color(herbTints[id] ?? 0x8a6230);
  waterColor.lerp(tint, 0.28);
  const mat = cauldron.water.material as THREE.MeshStandardMaterial;
  mat.color.copy(waterColor);
}

function leaveStayPieces(herb: THREE.Group): void {
  const stays = herb.children.filter((child) => child.userData.stayOnTray);
  for (const piece of stays) {
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    piece.getWorldPosition(worldPos);
    piece.getWorldQuaternion(worldQuat);
    herb.remove(piece);
    scene.add(piece);
    piece.position.copy(worldPos);
    piece.quaternion.copy(worldQuat);
  }
}

function tossHerb(herb: THREE.Group): void {
  if (herb.userData.inPot) return;
  herb.userData.inPot = true;
  const info = herb.userData.info as HerbInfo;
  inPot.push(info);
  updateHud();
  tintWater(info.id);
  leaveStayPieces(herb);
  tosses.push({
    mesh: herb,
    from: herb.position.clone(),
    to: new THREE.Vector3((Math.random() - 0.5) * 0.45, 1.3, (Math.random() - 0.5) * 0.45),
    t: 0,
  });
}

let hovered: THREE.Group | null = null;

function setHover(herb: THREE.Group | null): void {
  if (hovered === herb) return;
  const prev = hovered?.userData.labelEl as HTMLElement | undefined;
  prev?.classList.remove("is-hover");
  hovered = herb;
  const next = herb?.userData.labelEl as HTMLElement | undefined;
  next?.classList.add("is-hover");
  document.body.style.cursor = herb ? "pointer" : "default";
}

canvas.addEventListener("pointermove", (event) => {
  pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(herbs, true);
  const herb = hits[0] ? herbFromObject(hits[0].object) : null;
  setHover(herb && !herb.userData.inPot ? herb : null);
});

canvas.addEventListener("pointerdown", (event) => {
  pointerDown.set(event.clientX, event.clientY);
});

canvas.addEventListener("pointerup", (event) => {
  const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  if (moved > 6) return;

  pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  const herbHit = hits.find((hit) => herbFromObject(hit.object));
  const swatch = hits.find((hit) => hit.object.userData.sandboxColor != null);
  if (swatch && ginsengSkin) {
    const color = swatch.object.userData.sandboxColor as number;
    const name = swatch.object.userData.sandboxName as string;
    ginsengSkin.color.setHex(color);
    potList.innerHTML = `主根试色：${name}<br />点色球换色，须根不变`;
    return;
  }
  if (!herbHit) return;
  const herb = herbFromObject(herbHit.object);
  if (herb) tossHerb(herb);
});

function placeDroppedModel(root: THREE.Object3D, fileName: string): void {
  const wrapper = new THREE.Group();
  wrapper.add(root);
  scene.add(wrapper);

  const box = new THREE.Box3().setFromObject(wrapper);
  const size = box.getSize(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z, 0.001);
  wrapper.scale.setScalar(0.85 / maxSize);
  box.setFromObject(wrapper);
  const center = box.getCenter(new THREE.Vector3());
  wrapper.position.set(-2.15 + droppedModels * 0.95, 0.18 - box.min.y, 0.15);
  wrapper.position.x -= center.x;
  wrapper.position.z -= center.z;

  const label = fileName.replace(/\.(glb|gltf)$/i, "");
  wrapper.userData.role = "herb";
  wrapper.userData.info = {
    id: `custom-${droppedModels}`,
    name: label || "自定义药材",
    grams: 10,
    effect: "你拖进来的 3D 模型",
    look: "导入模型",
  } satisfies HerbInfo;
  const tag = createHerbLabel(wrapper.userData.info as HerbInfo, 0.55);
  wrapper.add(tag);
  wrapper.userData.labelEl = tag.element;
  wrapper.userData.inPot = false;
  wrapper.userData.home = wrapper.position.clone();
  wrapper.traverse((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
  droppedModels += 1;
}

async function loadDroppedFile(file: File): Promise<void> {
  const isGltf = /\.(glb|gltf)$/i.test(file.name);
  if (!isGltf) {
    potList.textContent = "请拖入 .glb 或 .gltf 模型文件";
    return;
  }
  const buffer = await file.arrayBuffer();
  const gltf = await gltfLoader.parseAsync(buffer, "");
  placeDroppedModel(gltf.scene, file.name);
}

window.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropHint.hidden = false;
});

window.addEventListener("dragleave", () => {
  dropHint.hidden = true;
});

window.addEventListener("drop", (event) => {
  event.preventDefault();
  dropHint.hidden = true;
  const file = event.dataTransfer?.files[0];
  if (file) void loadDroppedFile(file);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

updateHud();

const timer = new THREE.Timer();
timer.connect(document);

function tick(): void {
  timer.update();
  const time = timer.getElapsed();
  animateCauldron(cauldron, time);
  controls.update();

  for (let i = tosses.length - 1; i >= 0; i -= 1) {
    const toss = tosses[i];
    toss.t += 0.028;
    const t = Math.min(toss.t, 1);
    const ease = 1 - (1 - t) * (1 - t);
    toss.mesh.position.lerpVectors(toss.from, toss.to, ease);
    toss.mesh.position.y += Math.sin(t * Math.PI) * 1.1;
    toss.mesh.rotation.y += 0.08;
    toss.mesh.scale.setScalar(1 - t * 0.35);
    if (t >= 1) {
      const labelEl = toss.mesh.userData.labelEl as HTMLElement | undefined;
      labelEl?.classList.add("is-hidden");
      tosses.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
