"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ScrollTrigger, prefersReducedMotion } from "./gsap";

const POINT_COUNT = 1600;

/*
 * One idea, one scene.
 *
 * The field starts scattered and, as you scroll the hero, resolves into a single
 * vertical helix — the whole thesis of the practice in one gesture, which is the
 * only reason a WebGL canvas earns a place on a five-page site. It is used
 * exactly once, behind the About hero, and nowhere else.
 *
 * Everything about it is defensive: it never blocks paint (the gradient behind
 * it is the real background), it renders nothing at all under reduced motion
 * beyond a single settled frame, it stops entirely when scrolled out of view or
 * the tab is hidden, and if WebGL is unavailable it silently does not exist.
 */

const VERTEX_SHADER = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;

  attribute vec3 aTarget;
  attribute float aSeed;

  varying float vAlpha;
  varying float vSeed;

  void main() {
    // Stagger each point's convergence by its seed so the field resolves in
    // waves. All-at-once reads as a switch; waves read as settling.
    float local = clamp((uProgress - aSeed * 0.35) / 0.65, 0.0, 1.0);
    float eased = local * local * (3.0 - 2.0 * local);

    vec3 pos = mix(position, aTarget, eased);

    // Ambient drift, damped as the point arrives — the resolved state should
    // look still, not restless.
    float drift = 1.0 - eased * 0.75;
    pos.x += sin(uTime * 0.25 + aSeed * 12.0) * 0.07 * drift;
    pos.y += cos(uTime * 0.21 + aSeed * 9.0) * 0.07 * drift;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // uSize is a CSS-pixel diameter at the camera's resting distance; the
    // perspective divide keeps nearer points larger, and uPixelRatio maps CSS
    // pixels onto the drawing buffer.
    gl_PointSize = uSize * uPixelRatio * (0.55 + aSeed * 0.75) * (7.0 / -mv.z);

    vAlpha = 0.10 + 0.34 * eased;
    vSeed = aSeed;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uClay;

  varying float vAlpha;
  varying float vSeed;

  void main() {
    // Round the square point sprite off into a soft disc.
    vec2 offset = gl_PointCoord - 0.5;
    float dist = dot(offset, offset);
    if (dist > 0.25) discard;
    float edge = smoothstep(0.25, 0.04, dist);

    // A minority of points carry the accent colour so the field has warmth
    // without turning into confetti.
    vec3 color = mix(uInk, uClay, step(0.85, vSeed));
    gl_FragColor = vec4(color, vAlpha * edge);
  }
`;

export function HeroField({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      // No WebGL — the gradient underneath is a complete background on its own.
      return;
    }

    const reduced = prefersReducedMotion();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      52,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.1,
      100,
    );
    camera.position.z = 6.2;

    const scattered = new Float32Array(POINT_COUNT * 3);
    const targets = new Float32Array(POINT_COUNT * 3);
    const seeds = new Float32Array(POINT_COUNT);

    for (let i = 0; i < POINT_COUNT; i += 1) {
      const i3 = i * 3;

      // Scattered state: a wide, slightly flattened cloud.
      const radius = 2.2 + Math.random() * 2.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      scattered[i3] = Math.sin(phi) * Math.cos(theta) * radius * 1.35;
      scattered[i3 + 1] = Math.cos(phi) * radius * 0.95;
      scattered[i3 + 2] = Math.sin(phi) * Math.sin(theta) * radius * 0.6;

      // Resolved state: a slow vertical helix — one continuous line, read top
      // to bottom, which is the direction the page is about to move.
      const t = i / POINT_COUNT;
      const angle = t * Math.PI * 2 * 4;
      const taper = 0.34 + Math.sin(t * Math.PI) * 0.34;
      targets[i3] = Math.cos(angle) * taper;
      targets[i3 + 1] = (t - 0.5) * 7.4;
      targets[i3 + 2] = Math.sin(angle) * taper;

      seeds[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(scattered, 3));
    geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const uniforms = {
      uProgress: { value: reduced ? 0.55 : 0 },
      uTime: { value: 0 },
      uSize: { value: 3.2 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uInk: { value: new THREE.Color("#2b241f") },
      uClay: { value: new THREE.Color("#b8563a") },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    // The headline occupies the lower left, so the field is offset up and to
    // the right. Nothing important should ever have to compete with it.
    points.position.set(1.9, 0.55, 0);
    scene.add(points);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    // Reduced motion: one settled frame, no loop, no scroll listener.
    if (reduced) {
      renderer.render(scene, camera);
      return () => {
        resizeObserver.disconnect();
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }

    /* -- Scroll link ------------------------------------------------------- */

    // ScrollTrigger writes to a ref rather than React state: this updates every
    // frame, and a re-render per frame would be the most expensive thing on the
    // page. The render loop reads it and eases toward it.
    const target = { progress: 0 };
    const scrollTrigger = ScrollTrigger.create({
      trigger: mount,
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => {
        target.progress = self.progress;
      },
    });

    /* -- Render loop ------------------------------------------------------- */

    let frame = 0;
    let running = true;
    const clock = new THREE.Clock();

    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!running) return;

      uniforms.uTime.value = clock.getElapsedTime();
      // Ease toward the scroll position so a flicked wheel doesn't snap the
      // field; Lenis smooths the page, this smooths the last few percent.
      uniforms.uProgress.value += (target.progress - uniforms.uProgress.value) * 0.08;

      // A little counter-rotation gives the helix depth as it forms.
      points.rotation.y = uniforms.uProgress.value * 0.9 + clock.getElapsedTime() * 0.02;
      // Ease the whole field toward centre as it resolves, so the finished
      // helix reads as a deliberate object rather than something parked at
      // the edge of frame.
      points.position.x = 1.9 - uniforms.uProgress.value * 0.5;

      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(tick);

    // Stop drawing when the hero is off-screen or the tab is backgrounded.
    // A canvas that nobody can see should not cost a frame.
    const visibility = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting && !document.hidden;
      },
      { threshold: 0 },
    );
    visibility.observe(mount);

    const onVisibilityChange = () => {
      running = !document.hidden && mount.getBoundingClientRect().bottom > 0;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      scrollTrigger.kill();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
