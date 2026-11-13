import * as THREE from "three";

export type CauldronParts = {
  group: THREE.Group;
  water: THREE.Mesh;
  bubbles: THREE.Mesh[];
  steam: THREE.Mesh[];
  fireLight: THREE.PointLight;
};

function ironMaterial(color: number, metalness = 0.72, roughness = 0.38) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

export function createCauldron(): CauldronParts {
  const group = new THREE.Group();
  group.name = "cauldron";
  group.userData.role = "pot";

  const profile = [
    new THREE.Vector2(0.12, 0.02),
    new THREE.Vector2(0.62, 0.05),
    new THREE.Vector2(0.98, 0.28),
    new THREE.Vector2(1.18, 0.7),
    new THREE.Vector2(1.22, 1.12),
    new THREE.Vector2(1.12, 1.38),
    new THREE.Vector2(1.0, 1.46),
    new THREE.Vector2(0.92, 1.38),
  ];

  const body = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 64),
    ironMaterial(0x2b2118, 0.78, 0.32),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  body.userData.role = "pot";
  group.add(body);

  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 0.7, 0.16, 48),
    new THREE.MeshStandardMaterial({
      color: 0x1a120c,
      metalness: 0.4,
      roughness: 0.7,
    }),
  );
  inner.position.y = 1.28;
  inner.userData.role = "pot";
  group.add(inner);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.055, 12, 64),
    ironMaterial(0x4a3726, 0.82, 0.28),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.44;
  rim.castShadow = true;
  rim.userData.role = "pot";
  group.add(rim);

  for (const side of [-1, 1]) {
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.035, 10, 24, Math.PI),
      ironMaterial(0x3a2a1c, 0.8, 0.3),
    );
    handle.position.set(side * 1.18, 1.18, 0);
    handle.rotation.z = side * (Math.PI / 2);
    handle.castShadow = true;
    group.add(handle);
  }

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(0.9, 48),
    new THREE.MeshStandardMaterial({
      color: 0x6b4318,
      roughness: 0.12,
      metalness: 0.08,
      transparent: true,
      opacity: 0.82,
      emissive: 0x3a1c08,
      emissiveIntensity: 0.18,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 1.22;
  water.userData.role = "pot";
  group.add(water);

  const bubbles: THREE.Mesh[] = [];
  const bubbleMat = new THREE.MeshStandardMaterial({
    color: 0xf3d7a0,
    roughness: 0.15,
    metalness: 0.05,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  for (let i = 0; i < 18; i += 1) {
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), bubbleMat);
    resetBubble(bubble, i);
    group.add(bubble);
    bubbles.push(bubble);
  }

  const steam: THREE.Mesh[] = [];
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xffe6c4,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
  });
  for (let i = 0; i < 14; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), steamMat);
    puff.position.set((Math.random() - 0.5) * 0.7, 1.5 + Math.random() * 0.6, (Math.random() - 0.5) * 0.7);
    puff.userData.speed = 0.18 + Math.random() * 0.12;
    group.add(puff);
    steam.push(puff);
  }

  const stove = new THREE.Group();
  const brickMat = new THREE.MeshStandardMaterial({
    color: 0x5a331f,
    roughness: 0.9,
    metalness: 0.05,
  });
  for (let i = 0; i < 10; i += 1) {
    const brick = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.2), brickMat);
    const angle = (i / 10) * Math.PI * 2;
    brick.position.set(Math.cos(angle) * 1.05, 0.12, Math.sin(angle) * 1.05);
    brick.lookAt(0, 0.12, 0);
    brick.castShadow = true;
    brick.receiveShadow = true;
    stove.add(brick);
  }
  group.add(stove);

  const fireLight = new THREE.PointLight(0xff6a1a, 6.5, 6, 2);
  fireLight.position.set(0, 0.18, 0);
  fireLight.castShadow = true;
  group.add(fireLight);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0.35 }),
  );
  glow.position.y = 0.16;
  group.add(glow);

  return { group, water, bubbles, steam, fireLight };
}

export function resetBubble(bubble: THREE.Mesh, seed = Math.random()): void {
  const angle = seed * Math.PI * 2;
  const radius = 0.15 + (seed % 1) * 0.55;
  bubble.position.set(Math.cos(angle) * radius, 0.95, Math.sin(angle) * radius);
  bubble.userData.speed = 0.25 + (seed % 1) * 0.35;
  bubble.scale.setScalar(0.6 + (seed % 1) * 0.8);
}

export function animateCauldron(parts: CauldronParts, time: number): void {
  parts.fireLight.intensity = 5.4 + Math.sin(time * 7.5) * 1.4;
  const waterMat = parts.water.material as THREE.MeshStandardMaterial;
  waterMat.emissiveIntensity = 0.18 + Math.sin(time * 2.2) * 0.06;

  for (const bubble of parts.bubbles) {
    bubble.position.y += bubble.userData.speed * 0.016;
    if (bubble.position.y > 1.28) resetBubble(bubble, Math.random() * 100);
  }

  for (const puff of parts.steam) {
    puff.position.y += puff.userData.speed * 0.016;
    puff.position.x += Math.sin(time * 1.4 + puff.position.z) * 0.002;
    const mat = puff.material as THREE.MeshBasicMaterial;
    const fade = 1 - (puff.position.y - 1.45) / 1.1;
    mat.opacity = Math.max(0.02, fade * 0.12);
    if (puff.position.y > 2.55) {
      puff.position.set((Math.random() - 0.5) * 0.6, 1.48, (Math.random() - 0.5) * 0.6);
    }
  }
}
