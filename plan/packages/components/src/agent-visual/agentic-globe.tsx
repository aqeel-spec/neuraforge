'use client';

import { motion, useReducedMotion } from 'framer-motion';

export interface GlobeConnection {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
}

export interface AgenticGlobeProps {
  connections?: GlobeConnection[];
  size?: number;
  className?: string;
}

function latLngToXY(lat: number, lng: number, r: number, cx: number, cy: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  const x = cx + r * Math.sin(phi) * Math.cos(theta);
  const y = cy - r * Math.cos(phi);
  return { x, y };
}

export function AgenticGlobe({ connections = [], size = 200, className = '' }: AgenticGlobeProps) {
  const shouldReduceMotion = useReducedMotion();
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;

  return (
    <motion.div
      className={`inline-block ${className}`}
      animate={shouldReduceMotion ? {} : { rotate: 360 }}
      transition={{ duration: 30, repeat: shouldReduceMotion ? 0 : Infinity, ease: 'linear' }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
        {/* Globe circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          className="stroke-blue-500/30 dark:stroke-blue-400/30"
          strokeWidth={1.5}
        />
        {/* Latitude lines */}
        {[-45, 0, 45].map((lat) => {
          const yOffset = cy - r * Math.cos(((90 - lat) * Math.PI) / 180);
          const rLine = r * Math.sin(((90 - lat) * Math.PI) / 180);
          return (
            <ellipse
              key={`lat-${lat}`}
              cx={cx}
              cy={yOffset}
              rx={rLine}
              ry={rLine * 0.3}
              fill="none"
              className="stroke-blue-400/20 dark:stroke-blue-300/20"
              strokeWidth={0.75}
            />
          );
        })}
        {/* Longitude lines */}
        {[0, 60, 120].map((lng) => (
          <ellipse
            key={`lng-${lng}`}
            cx={cx}
            cy={cy}
            rx={r * Math.abs(Math.cos((lng * Math.PI) / 180)) * 0.5 + 5}
            ry={r}
            fill="none"
            className="stroke-blue-400/20 dark:stroke-blue-300/20"
            strokeWidth={0.75}
            transform={`rotate(${lng} ${cx} ${cy})`}
          />
        ))}
        {/* Connection arcs */}
        {connections.map((conn, i) => {
          const from = latLngToXY(conn.from.lat, conn.from.lng, r, cx, cy);
          const to = latLngToXY(conn.to.lat, conn.to.lng, r, cx, cy);
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2 - 20;
          return (
            <g key={i}>
              <motion.path
                d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                fill="none"
                className="stroke-cyan-400 dark:stroke-cyan-300"
                strokeWidth={1.5}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: i * 0.3, repeat: shouldReduceMotion ? 0 : Infinity, repeatDelay: 3 }}
              />
              <circle cx={from.x} cy={from.y} r={3} className="fill-cyan-500 dark:fill-cyan-400" />
              <circle cx={to.x} cy={to.y} r={3} className="fill-cyan-500 dark:fill-cyan-400" />
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}

export default AgenticGlobe;
