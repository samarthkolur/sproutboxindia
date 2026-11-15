import { Vector2 } from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// The look of the scene changes: one full-screen pass does the shader transitions
// (displacement, tearing, chromatic aberration, dew on the lens), plus a light
// vignette and film grain. Strength comes from the act timeline (lib/acts.ts).

export const PostFxShader = {
  name: "SproutPostFx",
  uniforms: {
    tDiffuse: { value: null as unknown },
    uTime: { value: 0 },
    /** 0 to 1: how strongly a transition is playing (dive or surface). */
    uStrength: { value: 0 },
    /** 0 to 1: coming back out into the light (adds dew on the lens). */
    uSurface: { value: 0 },
    /** 0 to 1: diving into the soil (adds a darker, inkier edge). */
    uDive: { value: 0 },
    /** 0 at the very start of the intro, 1 once it has settled. */
    uIntro: { value: 1 },
    uGrain: { value: 0.03 },
    uVignette: { value: 0.3 },
    uResolution: { value: new Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uStrength;
    uniform float uSurface;
    uniform float uDive;
    uniform float uIntro;
    uniform float uGrain;
    uniform float uVignette;
    uniform vec2 uResolution;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    void main() {
      vec2 uv = vUv;
      // The intro starts as a heavy glitch and settles, like a signal locking in.
      float s = max(uStrength, 1.0 - uIntro);
      float tick = floor(uTime * 9.0);

      // Horizontal tearing: a few bands of rows slide sideways.
      float band = floor(uv.y * 24.0);
      float torn = step(0.62, hash(vec2(band, tick)));
      uv.x += (hash(vec2(band, tick + 3.0)) - 0.5) * 0.07 * s * torn;

      // Warp the picture with moving noise.
      vec2 warp = vec2(
        noise(uv * vec2(4.0, 9.0) + uTime * 0.7),
        noise(uv * vec2(9.0, 4.0) - uTime * 0.6)
      ) - 0.5;
      uv += warp * 0.06 * s;

      // Chromatic aberration: red and blue pull apart, more towards the edges.
      vec2 dir = vUv - 0.5;
      float spread = 0.0012 + 0.016 * s;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + dir * spread).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - dir * spread).b;

      // Dew on the lens as the camera comes out of the soil: patches of soft blur and shine.
      float dew = uSurface * smoothstep(0.3, 0.8, noise(vUv * 6.0 + uTime * 0.15));
      if (dew > 0.001) {
        vec3 acc = vec3(0.0);
        for (int i = 0; i < 8; i++) {
          float a = float(i) * 0.785398;
          acc += texture2D(tDiffuse, uv + vec2(cos(a), sin(a)) * 0.007 * dew).rgb;
        }
        col = mix(col, acc / 8.0, dew * 0.85);
        col += vec3(0.9, 0.97, 1.0) * dew * 0.06;
      }

      // Diving: the edges close in, like going under.
      col *= 1.0 - uDive * 0.3 * smoothstep(0.2, 0.8, length(dir) * 1.6);

      // Vignette and grain (both faded to nothing at the end, so the scene meets the page without a seam).
      float vig = smoothstep(0.95, 0.3, length(dir));
      col *= mix(1.0, vig, uVignette);
      col += (hash(vUv * uResolution + fract(uTime) * 91.0) - 0.5) * uGrain;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export function createPostFxPass() {
  // ShaderPass clones the uniforms, so every pass instance has its own values.
  return new ShaderPass(PostFxShader);
}
