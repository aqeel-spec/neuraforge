'use client';

import { useId, useMemo } from 'react';
import { motion } from 'framer-motion';

export interface AiLoaderProps {
  variant?: 'wave' | 'neural' | 'stream';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizes = { sm: 48, md: 64, lg: 96 } as const;

function WaveVariant({ size }: { size: number }) {
  const bars = 7;
  const barWidth = size * 0.08;
  const gap = size * 0.04;
  const totalWidth = bars * barWidth + (bars - 1) * gap;
  const maxH = size * 0.85;
  const minH = size * 0.2;

  return (
    <svg width={totalWidth} height={size} viewBox={`0 0 ${totalWidth} ${size}`} aria-hidden="true">
      <defs>
        <linearGradient id="nf-wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="nf-wave-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.rect
          key={i}
          x={i * (barWidth + gap)}
          rx={barWidth / 2}
          ry={barWidth / 2}
          width={barWidth}
          fill="url(#nf-wave-grad)"
          filter="url(#nf-wave-glow)"
          animate={{
            height: [minH, maxH, minH],
            y: [size - minH, size - maxH, size - minH],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.12,
          }}
        />
      ))}
    </svg>
  );
}

function NeuralVariant({ size }: { size: number }) {
  const nodes = useMemo(() => [
    { x: size * 0.5, y: size * 0.12 },
    { x: size * 0.15, y: size * 0.4 },
    { x: size * 0.85, y: size * 0.4 },
    { x: size * 0.25, y: size * 0.78 },
    { x: size * 0.75, y: size * 0.78 },
    { x: size * 0.5, y: size * 0.55 },
  ], [size]);

  const connections: [number, number][] = [
    [0, 1], [0, 2], [0, 5], [1, 3], [1, 5], [2, 4], [2, 5], [3, 5], [4, 5],
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <filter id="nf-neural-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="nf-node-grad">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6366f1" />
        </radialGradient>
      </defs>
      {connections.map(([a, b], i) => (
        <motion.line
          key={`l-${i}`}
          x1={nodes[a]!.x}
          y1={nodes[a]!.y}
          x2={nodes[b]!.x}
          y2={nodes[b]!.y}
          stroke="#8b5cf6"
          strokeWidth={1.5}
          animate={{ strokeOpacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
      {nodes.map((node, i) => (
        <motion.circle
          key={`n-${i}`}
          cx={node.x}
          cy={node.y}
          fill="url(#nf-node-grad)"
          filter="url(#nf-neural-glow)"
          animate={{
            r: [size * 0.05, size * 0.07, size * 0.05],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.25,
          }}
        />
      ))}
    </svg>
  );
}

function StreamVariant({ size }: { size: number }) {
  const particles = 12;
  const height = size * 0.5;
  const width = size * 2;
  const colors = ['#8b5cf6', '#6366f1', '#06b6d4'];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id="nf-stream-fade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="15%" stopColor="white" stopOpacity="1" />
          <stop offset="85%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="nf-stream-mask">
          <rect width={width} height={height} fill="url(#nf-stream-fade)" />
        </mask>
      </defs>
      <g mask="url(#nf-stream-mask)">
        {Array.from({ length: particles }).map((_, i) => {
          const y = (height / (particles + 1)) * (i + 1);
          const r = 1.5 + (i % 3);
          return (
            <motion.circle
              key={i}
              cy={y}
              r={r}
              fill={colors[i % 3]}
              opacity={0.85}
              animate={{ cx: [-10, width + 10] }}
              transition={{
                duration: 2 + (i % 4) * 0.4,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.18,
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}

export function AiLoader({ variant = 'wave', size = 'md', label, className = '' }: AiLoaderProps) {
  const id = useId();
  const px = sizes[size];

  return (
    <div
      role="status"
      aria-label={label ?? 'Loading'}
      className={`inline-flex flex-col items-center justify-center gap-2 ${className}`}
      style={{ minHeight: px }}
    >
      {variant === 'wave' && <WaveVariant size={px} />}
      {variant === 'neural' && <NeuralVariant size={px} />}
      {variant === 'stream' && <StreamVariant size={px} />}
      {label && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      )}
      <span className="sr-only" id={id}>{label ?? 'Loading'}</span>
    </div>
  );
}

export default AiLoader;
