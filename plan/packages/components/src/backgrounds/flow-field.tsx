'use client';
import { useEffect, useRef, type ReactNode } from "react";


export interface FlowFieldProps {
  particleCount?: number;
  color?: string;
  speed?: number;
  className?: string;
  children?: ReactNode;
}

export function FlowField({
  particleCount = 80,
  color = '#a855f7',
  speed = 1,
  className = '',
  children,
}: FlowFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.parentElement?.clientWidth ?? window.innerWidth;
      height = canvas.parentElement?.clientHeight ?? window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
    }));

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.005 * speed;

      for (const p of particles) {
        // Sine-noise flow
        const angle = Math.sin(p.x * 0.01 + time) * Math.PI + Math.cos(p.y * 0.01 + time) * Math.PI;
        p.vx += Math.cos(angle) * 0.1 * speed;
        p.vy += Math.sin(angle) * 0.1 * speed;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [particleCount, color, speed]);

  return (
    <div className={`relative overflow-hidden bg-white dark:bg-gray-950 ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

export default FlowField;
