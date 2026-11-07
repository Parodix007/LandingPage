"use client";

import { useEffect, useRef } from "react";

// Brama identyczna z PointerFx.tsx i blokami pointer-FX w globals.css (kontrakt spec §4.1).
// Canvas z cząstkami to zatwierdzony odstępstwo od reguły "tylko transform/opacity": warstwa
// jest aria-hidden, bez treści, a jej jedynym celem jest zatrzymanie odwiedzającego w hero.
const GATE_QUERY = "(prefers-reduced-motion: no-preference) and (pointer: fine)";

// Budżet renderowania (spec §4.4): gęstość na pole, twardy limit liczby, clamp DPR — canvas
// hero bywa pełnoszerokościowy, bez limitów zapłaciłby klatkami na mobilnym GPU.
const AREA_PER_PARTICLE = 16_000;
const MAX_PARTICLES = 90;
const DPR_CLAMP = 1.5;

const REPEL_RADIUS = 120;
const MAX_PUSH = 20;
const DRIFT = 0.35;

type Particle = { x: number; y: number; vx: number; vy: number };

export function HeroParticleField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!window.matchMedia(GATE_QUERY).matches) {
      canvas.dataset.loop = "disabled";
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      // jsdom / przeglądarka bez 2d: pętla nie startuje, canvas pusty — brak awansu.
      canvas.dataset.loop = "off";
      return;
    }

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame: number | null = null;
    let stopped = false;
    const pointer = { x: 0, y: 0, active: false };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nextW = Math.max(0, Math.round(rect.width));
      const nextH = Math.max(0, Math.round(rect.height));
      if (nextW === 0 || nextH === 0) return;
      width = nextW;
      height = nextH;

      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CLAMP);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const wanted = Math.min(MAX_PARTICLES, Math.round((width * height) / AREA_PER_PARTICLE));
      canvas.dataset.particleCount = String(wanted);
      if (particles.length !== wanted) {
        particles = Array.from({ length: wanted }, () => {
          const angle = Math.random() * Math.PI * 2;
          return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: Math.cos(angle) * DRIFT,
            vy: Math.sin(angle) * DRIFT,
          };
        });
      }
    };

    const step = () => {
      frame = null;
      if (stopped) return;
      if (width === 0 || height === 0) {
        resize();
        if (width === 0 || height === 0) return;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#7ce38b"; // = --color-accent; canvas nie czyta zmiennych CSS

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= 0 || p.x >= width) p.vx = -p.vx;
        if (p.y <= 0 || p.y >= height) p.vy = -p.vy;

        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REPEL_RADIUS && dist > 0.001) {
            const force = (1 - dist / REPEL_RADIUS) * MAX_PUSH;
            p.x += (dx / dist) * force * 0.12;
            p.y += (dy / dist) * force * 0.12;
          }
        }

        ctx.fillRect(p.x, p.y, 2, 2);
      }

      frame = window.requestAnimationFrame(step);
    };

    const start = () => {
      if (stopped || frame !== null) return;
      canvas.dataset.loop = "running";
      frame = window.requestAnimationFrame(step);
    };

    const pause = () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
      canvas.dataset.loop = "paused";
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active =
        pointer.x >= 0 &&
        pointer.x <= rect.width &&
        pointer.y >= 0 &&
        pointer.y <= rect.height;
    };

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (stopped) return;
        if (entry.isIntersecting) start();
        else pause();
      }
    });

    resize();
    // ResizeObserver nie jest w jsdom — fallback na resize okna wystarczy w testach, a w
    // przeglądarce reaguje i na zmianę rozmiaru okna (hero jest pełnoszerokościowy).
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        if (!stopped) resize();
      });
      ro.observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    io.observe(canvas);
    start();

    return () => {
      stopped = true;
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      io.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      canvas.dataset.loop = "stopped";
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`.trim()}
    />
  );
}
