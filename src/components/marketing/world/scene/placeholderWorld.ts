import {
  BackSide,
  BoxGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from "three";
import { smoothstep } from "@/lib/plant-growth";
import { undergroundAt } from "@/lib/acts";
import type { TierSettings } from "@/lib/quality-tier";

// Stand-in world for Phase 1: just enough to see the camera rail, the act colours
// and the transitions. Phase 2 replaces it with the real cutaway, roots and stalks.

export interface WorldContent {
  group: Group;
  update(progress: number, time: number): void;
  dispose(): void;
}

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildPlaceholderWorld(settings: TierSettings): WorldContent {
  const random = seeded(20261115);
  const group = new Group();

  const topMaterial = new MeshStandardMaterial({ color: "#8a6b4a", roughness: 1, flatShading: true, side: DoubleSide });
  const top = new Mesh(new CircleGeometry(40, 48), topMaterial);
  top.rotation.x = -Math.PI / 2;
  group.add(top);

  const earthMaterial = new MeshStandardMaterial({ color: "#2f221a", roughness: 1, side: BackSide });
  const earth = new Mesh(new BoxGeometry(80, 16, 80), earthMaterial);
  earth.position.y = -8.01;
  group.add(earth);

  const seed = new Mesh(new SphereGeometry(1, 16, 12), new MeshStandardMaterial({ color: "#1d1b19", roughness: 0.6 }));
  seed.scale.set(0.22, 0.4, 0.15);
  seed.position.set(0, 0.2, 0);
  group.add(seed);

  const stalkGeometry = new CylinderGeometry(0.05, 0.08, 1, 8);
  stalkGeometry.translate(0, 0.5, 0);
  const stalkMaterial = new MeshStandardMaterial({ color: "#8fbd5e", roughness: 0.7 });
  const stalks = new InstancedMesh(stalkGeometry, stalkMaterial, settings.plants);
  const stalkBase: { x: number; z: number; h: number; delay: number }[] = [];
  for (let i = 0; i < settings.plants; i++) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 6;
    stalkBase.push({ x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, h: 2.4 + random() * 1.2, delay: random() * 0.08 });
  }
  stalks.frustumCulled = false;
  group.add(stalks);

  const hemisphere = new HemisphereLight("#f6f7e0", "#4a3a2a", 0.9);
  const sun = new DirectionalLight("#fff0c2", 1.8);
  sun.position.set(5, 9, 6);
  group.add(hemisphere, sun);

  const dummy = new Object3D();
  const surfaceColor = new Color();

  return {
    group,
    update(progress) {
      const under = undergroundAt(progress);
      hemisphere.intensity = MathUtils.lerp(0.9, 0.55, under);
      sun.intensity = MathUtils.lerp(1.8, 0.2, under);
      topMaterial.color.set("#8a6b4a");
      surfaceColor.set("#8a6b4a");

      for (let i = 0; i < stalkBase.length; i++) {
        const s = stalkBase[i];
        const grow = smoothstep(0.34 + s.delay, 0.9, progress);
        dummy.position.set(s.x, 0, s.z);
        dummy.scale.set(1, Math.max(0.001, s.h * grow), 1);
        dummy.updateMatrix();
        stalks.setMatrixAt(i, dummy.matrix);
      }
      stalks.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      for (const mesh of [top, earth, seed]) {
        mesh.geometry.dispose();
        (mesh.material as MeshStandardMaterial).dispose();
      }
      stalkGeometry.dispose();
      stalkMaterial.dispose();
      stalks.dispose();
    },
  };
}
