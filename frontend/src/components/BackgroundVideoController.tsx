import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── Procedural SOC Background Engine ─────────────────────────────
// Replaces the video-based background with a real-time canvas animation
// perfectly synced to scroll position and click events.
//
// Scroll controls "threat energy level":
//   Top → calm surveillance mode (slow drift, dim nodes)
//   Bottom → active threat mode (faster particles, brighter connections)
//
// Click triggers a radial EMP pulse that ripples through the network.
// ──────────────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  radius: number;
  opacity: number;
  hue: number;       // 180=cyan, 200=teal, 270=purple
  pulsePhase: number;
}

interface Pulse {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  startTime: number;
}

// ── Configuration ──
const PARTICLE_COUNT  = 72;
const CONNECTION_DIST = 180;
const BASE_SPEED      = 0.15;
const MAX_SPEED_MULT  = 3.5;
const PULSE_DURATION  = 550; // ms
const PULSE_MAX_R     = 240;

// Color palette (HSL hues)
const HUES = [185, 190, 195, 200, 210, 260, 270]; // cyan → teal → purple

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

export const BackgroundVideoController: React.FC = () => {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const particlesRef  = useRef<Particle[]>([]);
  const pulsesRef     = useRef<Pulse[]>([]);
  const progressRef   = useRef(0);
  const smoothProgRef = useRef(0);
  const rafIdRef      = useRef<number>(0);
  const [ripples, setRipples] = useState<ClickRipple[]>([]);

  // ── Initialize particles ──
  const initParticles = useCallback((w: number, h: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const hue = HUES[Math.floor(Math.random() * HUES.length)];
      const vx = (Math.random() - 0.5) * BASE_SPEED * 2;
      const vy = (Math.random() - 0.5) * BASE_SPEED * 2;
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx, vy,
        baseVx: vx,
        baseVy: vy,
        radius: 1.2 + Math.random() * 2.5,
        opacity: 0.5 + Math.random() * 0.4,
        hue,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;
  }, []);

  // ── Scroll progress ──
  const getProgress = (): number => {
    const scrollY   = window.scrollY || 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    return maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // ── Resize handler ──
    const resize = () => {
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (particlesRef.current.length === 0) {
        initParticles(window.innerWidth, window.innerHeight);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Click: spawn EMP pulse in canvas and foreground HUD ripples ──
    const onClick = (e: MouseEvent) => {
      // 1. Add EMP pulse to canvas engine
      pulsesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: PULSE_MAX_R,
        opacity: 0.85,
        startTime: performance.now(),
      });

      // 2. Add tactical HUD ripple to foreground overlay (above all panels)
      const newRipple: ClickRipple = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
      };
      setRipples((prev) => [...prev.slice(-3), newRipple]);

      // Auto-cleanup ripple
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 550);
    };
    window.addEventListener('click', onClick);

    // ── Scroll tracking ──
    const onScroll = () => {
      progressRef.current = getProgress();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    progressRef.current = getProgress();

    // ── Main render loop ──
    let lastTime = 0;

    const render = (timestamp: number) => {
      const dt = lastTime === 0 ? 16 : Math.min(timestamp - lastTime, 50);
      lastTime = timestamp;
      const dtSec = dt / 1000;

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Smooth scroll interpolation
      smoothProgRef.current += (progressRef.current - smoothProgRef.current) * (1 - Math.exp(-dtSec * 6));
      const p = smoothProgRef.current;

      // Energy level: 0.6 (idle/calm) → 1.0 (active threat)
      const energy = 0.6 + p * 0.4;

      // ── Clear with deep navy gradient ──
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0,   '#0a1020');
      bgGrad.addColorStop(0.5, '#0c1428');
      bgGrad.addColorStop(1,   '#081018');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // ── Subtle radial ambient glow (top center) ──
      const ambientGrad = ctx.createRadialGradient(w * 0.5, -h * 0.1, 0, w * 0.5, -h * 0.1, h * 0.9);
      ambientGrad.addColorStop(0, `rgba(6, 182, 212, ${0.16 * energy})`);
      ambientGrad.addColorStop(0.4, `rgba(6, 160, 210, ${0.08 * energy})`);
      ambientGrad.addColorStop(0.8, `rgba(8, 120, 180, ${0.03 * energy})`);
      ambientGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, w, h);

      // Secondary glow (bottom right, purple)
      const glow2 = ctx.createRadialGradient(w * 0.85, h * 1.1, 0, w * 0.85, h * 1.1, h * 0.7);
      glow2.addColorStop(0, `rgba(139, 92, 246, ${0.07 * energy})`);
      glow2.addColorStop(0.5, `rgba(100, 60, 200, ${0.03 * energy})`);
      glow2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, w, h);

      const particles = particlesRef.current;
      const now = timestamp;

      // ── Update particles ──
      const speedMult = 1 + (MAX_SPEED_MULT - 1) * p;
      for (const pt of particles) {
        // Pulse phase for gentle breathing
        pt.pulsePhase += dtSec * (1.5 + energy);

        // Speed modulated by scroll energy
        pt.vx = pt.baseVx * speedMult;
        pt.vy = pt.baseVy * speedMult;

        pt.x += pt.vx * dt * 0.06;
        pt.y += pt.vy * dt * 0.06;

        // Wrap around edges with margin
        const margin = 20;
        if (pt.x < -margin)    pt.x = w + margin;
        if (pt.x > w + margin) pt.x = -margin;
        if (pt.y < -margin)    pt.y = h + margin;
        if (pt.y > h + margin) pt.y = -margin;

        // Pulse effect from EMP clicks
        for (const pulse of pulsesRef.current) {
          const dx = pt.x - pulse.x;
          const dy = pt.y - pulse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < pulse.radius + 40 && dist > pulse.radius - 40) {
            const pushForce = 0.6 * pulse.opacity;
            const angle = Math.atan2(dy, dx);
            pt.x += Math.cos(angle) * pushForce;
            pt.y += Math.sin(angle) * pushForce;
          }
        }
      }

      // ── Draw connections ──
      const connDist = CONNECTION_DIST * (0.8 + energy * 0.4);
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connDist) {
            const alpha = (1 - dist / connDist) * 0.25 * energy;
            const avgHue = (a.hue + b.hue) / 2;
            ctx.strokeStyle = `hsla(${avgHue}, 80%, 60%, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // ── Draw particles (nodes) ──
      for (const pt of particles) {
        const breathe = 0.7 + 0.3 * Math.sin(pt.pulsePhase);
        const alpha = pt.opacity * energy * breathe;
        const r = pt.radius * (0.8 + 0.4 * energy);

        // Outer glow
        ctx.shadowColor = `hsla(${pt.hue}, 85%, 65%, ${alpha * 0.6})`;
        ctx.shadowBlur = 12 * energy;

        // Core dot
        ctx.fillStyle = `hsla(${pt.hue}, 80%, 70%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.fillStyle = `hsla(${pt.hue}, 60%, 90%, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // ── Draw EMP pulses ──
      const activePulses: Pulse[] = [];
      for (const pulse of pulsesRef.current) {
        const elapsed = now - pulse.startTime;
        if (elapsed > PULSE_DURATION) continue;

        const t = elapsed / PULSE_DURATION;
        pulse.radius  = pulse.maxRadius * Math.pow(t, 0.6); // ease-out expansion
        pulse.opacity = 1.0 * (1 - t) * (1 - t);

        // Bright filled disc glow
        const discGrad = ctx.createRadialGradient(
          pulse.x, pulse.y, 0,
          pulse.x, pulse.y, pulse.radius
        );
        discGrad.addColorStop(0, `rgba(6, 220, 255, ${pulse.opacity * 0.15})`);
        discGrad.addColorStop(0.3, `rgba(6, 182, 212, ${pulse.opacity * 0.08})`);
        discGrad.addColorStop(0.7, `rgba(6, 182, 212, ${pulse.opacity * 0.03})`);
        discGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = discGrad;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        ctx.fill();

        // Delicate outer ring
        ctx.strokeStyle = `rgba(6, 230, 255, ${pulse.opacity * 0.8})`;
        ctx.lineWidth = 1.5 + 1.5 * (1 - t);
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Secondary inner ring
        if (pulse.radius > 20) {
          ctx.strokeStyle = `rgba(6, 182, 212, ${pulse.opacity * 0.35})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pulse.x, pulse.y, pulse.radius * 0.6, 0, Math.PI * 2);
          ctx.stroke();
        }

        activePulses.push(pulse);
      }
      pulsesRef.current = activePulses;

      // ── Subtle scan lines (every 4px) ──
      ctx.fillStyle = `rgba(0, 0, 0, ${0.03 + 0.02 * energy})`;
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }

      // ── Vignette ──
      const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.75);
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, w, h);

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', onClick);
      window.removeEventListener('scroll', onScroll);
    };
  }, [initParticles]);

  return (
    <>
      {/* ── Layer 1: Background Canvas & Cyber Grid (Behind all UI content) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -30 }} aria-hidden="true">
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: -31 }}
        />
        <div
          className="fixed inset-0 cyber-grid pointer-events-none"
          style={{ zIndex: -10, opacity: 0.35 }}
        />
      </div>

      {/* ── Layer 2: Foreground Tactical EMP Shockwave (Renders ABOVE all UI panels) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }} aria-hidden="true">
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="absolute pointer-events-none"
            style={{ left: ripple.x, top: ripple.y }}
          >
            {/* Ambient radial flare centered at click */}
            <div className="emp-ripple-flash" />

            {/* Inner high-speed cyan shockwave ring */}
            <div className="emp-ripple-ring-1" />

            {/* Outer expanding energy dispersion ring */}
            <div className="emp-ripple-ring-2" />

            {/* Tactical reticle crosshair at click epicenter */}
            <div className="emp-ripple-reticle">
              <svg
                viewBox="0 0 40 40"
                fill="none"
                className="w-full h-full text-cyan-400 filter drop-shadow-[0_0_8px_rgba(6,230,255,0.85)]"
              >
                {/* Target brackets */}
                <path d="M6 14V6H14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M26 6H34V14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M34 26V34H26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M14 34H6V26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                {/* Center crosshair dot */}
                <circle cx="20" cy="20" r="2.5" fill="#00f0ff" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
