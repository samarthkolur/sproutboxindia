import {
  Color,
  FogExp2,
  HalfFloatType,
  MathUtils,
  NoToneMapping,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { INTRO_FROM, INTRO_SECONDS, easeOutCubic, railAt, skyAt, transitionsAt } from "@/lib/acts";
import { clamp01, dayAt, smoothstep } from "@/lib/plant-growth";
import { TIERS, downgrade, shouldDowngrade, type Tier } from "@/lib/quality-tier";
import { createPostFxPass } from "./postfx";
import { buildPlaceholderWorld } from "../scene/placeholderWorld";

// The engine: renderer, post-processing, camera rail, intro and adaptive quality.
// Everything it draws is a function of scroll progress (see lib/acts.ts), so the
// page can scrub the journey forwards and backwards.

export interface FrameInfo {
  /** Smoothed progress actually being drawn. */
  progress: number;
  /** 0 to 1: how far the intro has played. */
  intro: number;
  day: number;
}

export interface WorldOptions {
  tier: Tier;
  /** Draw one still frame (no loop, no intro). */
  reducedMotion: boolean;
  /** Where the page wants the journey to be; the world eases towards it. */
  getTarget: () => number;
  onFrame?: (frame: FrameInfo) => void;
  onContextLost?: () => void;
  onTierChange?: (tier: Tier) => void;
}

export interface World {
  start(): void;
  stop(): void;
  resize(width: number, height: number): void;
  renderStill(progress: number): void;
  tier(): Tier;
  dispose(): void;
}

const lerp = MathUtils.lerp;

export async function createWorld(canvas: HTMLCanvasElement, options: WorldOptions): Promise<World> {
  let tier = options.tier;
  let settings = TIERS[tier];

  const renderer = new WebGLRenderer({
    canvas,
    antialias: settings.antialias && !settings.post, // post-processing has its own multisampled target
    powerPreference: "high-performance",
  });
  // The stylised look is flat and graphic: no tone mapping, so the sky matches the page colour exactly.
  renderer.toneMapping = NoToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const background = new Color();
  scene.background = background;
  scene.fog = new FogExp2(0xffffff, 0.03);

  const camera = new PerspectiveCamera(40, 1, 0.1, 140);
  const content = buildPlaceholderWorld(settings);
  scene.add(content.group);

  // ── Post-processing
  const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: tier === "high" ? 4 : 0 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.32, 0.65, 0.88);
  composer.addPass(bloom);
  const postFx = createPostFxPass();
  composer.addPass(postFx);
  composer.addPass(new OutputPass());

  let width = Math.max(1, canvas.clientWidth || window.innerWidth);
  let height = Math.max(1, canvas.clientHeight || window.innerHeight);

  function applyTier(next: Tier) {
    tier = next;
    settings = TIERS[next];
    const dpr = Math.min(window.devicePixelRatio || 1, settings.maxDpr);
    renderer.setPixelRatio(dpr);
    composer.setPixelRatio(dpr);
    bloom.enabled = settings.bloom;
    composer.setSize(width, height);
    renderer.setSize(width, height, false);
  }
  applyTier(tier);

  // ── State
  let displayed = 0;
  let time = 0;
  let last = 0;
  let raf = 0;
  let running = false;
  let introElapsed = options.reducedMotion ? INTRO_SECONDS : 0;
  const frameTimes: number[] = [];

  function frameCamera(progress: number, intro: number) {
    const rail = railAt(progress);
    const e = easeOutCubic(intro);
    camera.position.set(
      lerp(INTRO_FROM.position[0], rail.position[0], e),
      lerp(INTRO_FROM.position[1], rail.position[1], e),
      lerp(INTRO_FROM.position[2], rail.position[2], e)
    );
    camera.lookAt(
      lerp(INTRO_FROM.target[0], rail.target[0], e),
      lerp(INTRO_FROM.target[1], rail.target[1], e),
      lerp(INTRO_FROM.target[2], rail.target[2], e)
    );

    const aspect = width / height;
    // Portrait screens see less sideways, so widen the lens and lift the scene above the text card.
    camera.fov = aspect < 1 ? Math.min(62, 40 + (1 - aspect) * 34) : 40;
    camera.aspect = aspect;
    if (aspect >= 1.15) camera.setViewOffset(width, height, -0.12 * width, 0, width, height); // room for the headline on the left
    else if (aspect < 1) camera.setViewOffset(width, height, 0, 0.14 * height, width, height); // room for the card below
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }

  function draw(progress: number, t: number, intro: number) {
    const sky = skyAt(progress);
    background.setRGB(sky.color[0], sky.color[1], sky.color[2], SRGBColorSpace);
    const fog = scene.fog as FogExp2;
    fog.color.copy(background);
    fog.density = sky.fog;

    content.update(progress, t);
    frameCamera(progress, intro);

    const transitions = transitionsAt(progress);
    // The very end of the journey is the page's own colour: no vignette or grain, so there is no seam.
    const seam = smoothstep(0.9, 1, progress);
    const uniforms = postFx.uniforms;
    uniforms.uTime.value = t;
    uniforms.uStrength.value = transitions.strength;
    uniforms.uSurface.value = transitions.surface;
    uniforms.uDive.value = transitions.dive;
    uniforms.uIntro.value = easeOutCubic(intro);
    uniforms.uVignette.value = 0.28 * (1 - seam);
    uniforms.uGrain.value = 0.03 * (1 - seam);
    (uniforms.uResolution.value as Vector2).set(width, height);
    bloom.strength = 0.32 * (1 - seam);

    if (settings.post) composer.render();
    else renderer.render(scene, camera);

    options.onFrame?.({ progress, intro, day: dayAt(progress) });
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const elapsed = (now - last) / 1000 || 0;
    last = now;
    time += Math.min(0.05, elapsed);
    introElapsed = Math.min(INTRO_SECONDS, introElapsed + elapsed);

    // Ease towards the scroll position using real time, so a slow device still catches up.
    const goal = clamp01(options.getTarget());
    displayed += (goal - displayed) * (1 - Math.exp(-Math.min(0.5, elapsed) * 5));
    if (Math.abs(goal - displayed) < 1e-4) displayed = goal;

    draw(displayed, time, introElapsed / INTRO_SECONDS);

    // Measure, and step down a tier if the device cannot keep up.
    frameTimes.push(elapsed * 1000);
    if (frameTimes.length > 240) frameTimes.splice(0, frameTimes.length - 240);
    if (shouldDowngrade(frameTimes)) {
      const lower = downgrade(tier);
      if (lower) {
        applyTier(lower);
        frameTimes.length = 0;
        options.onTierChange?.(lower);
      }
    }
  }

  const onContextLost = (event: Event) => {
    event.preventDefault();
    options.onContextLost?.();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  // Compile every shader before the first frame, behind the loader, so nothing hitches mid-scroll.
  await renderer.compileAsync(scene, camera);

  return {
    start() {
      if (running || options.reducedMotion) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    resize(nextWidth, nextHeight) {
      width = Math.max(1, nextWidth);
      height = Math.max(1, nextHeight);
      composer.setSize(width, height);
      renderer.setSize(width, height, false);
      if (!running) draw(displayed, time, introElapsed / INTRO_SECONDS);
    },
    renderStill(progress) {
      displayed = clamp01(progress);
      draw(displayed, 0, 1);
    },
    tier: () => tier,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      content.dispose();
      composer.dispose();
      target.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
