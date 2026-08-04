'use client';

import { useState, useEffect, useRef, useId, useCallback, memo } from 'react';
import { motion } from 'framer-motion';

// ─── Glass Effect Utilities ─────────────────────────────────────────────────

const GLASS_SHADOW_LIGHT = "shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)]";
const GLASS_SHADOW_DARK = "dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]";
const GLASS_SHADOW = `${GLASS_SHADOW_LIGHT} ${GLASS_SHADOW_DARK}`;

function GlassFilter({ id, scale = 30 }: { id: string; scale?: number }) {
  return (
    <svg aria-hidden="true" className="hidden" focusable={false}>
      <title>Glass Effect</title>
      <defs>
        <filter colorInterpolationFilters="sRGB" height="200%" id={id} width="200%" x="-50%" y="-50%">
          <feTurbulence baseFrequency="0.05 0.05" numOctaves="1" result="turbulence" seed="1" type="fractalNoise" />
          <feGaussianBlur in="turbulence" result="blurredNoise" stdDeviation="2" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" result="displaced" scale={scale} xChannelSelector="R" yChannelSelector="B" />
          <feGaussianBlur in="displaced" result="finalBlur" stdDeviation="4" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

// ─── Liquid Glass Card ──────────────────────────────────────────────────────

export interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  glassEffect?: boolean;
}

export function LiquidGlassCard({ children, className = '', glassEffect = true }: LiquidGlassCardProps) {
  const filterId = useId();
  return (
    <div className={`group relative overflow-hidden bg-white/20 dark:bg-black/20 backdrop-blur-[2px] rounded-3xl border border-zinc-200/60 dark:border-zinc-700/60 ${className}`}>
      <div className={`pointer-events-none absolute inset-0 rounded-[inherit] ${GLASS_SHADOW}`} />
      {glassEffect && (
        <>
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]" style={{ backdropFilter: `url("#${filterId}")` }} />
          <GlassFilter id={filterId} scale={30} />
        </>
      )}
      <div className="relative z-10">{children}</div>
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:via-white/5" />
    </div>
  );
}

// ─── Liquid Button ──────────────────────────────────────────────────────────

export interface LiquidButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

export function LiquidButton({ children, onClick, className = '', ariaLabel }: LiquidButtonProps) {
  const filterId = useId();
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`relative transition-transform duration-200 active:scale-[0.97] hover:scale-105 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${className}`}
      >
        <div className={`pointer-events-none absolute inset-0 rounded-[inherit] ${GLASS_SHADOW}`} />
        <div className="pointer-events-none absolute inset-0 isolate -z-10 overflow-hidden rounded-[inherit]" style={{ backdropFilter: `url("#${filterId}")` }} />
        <span className="relative z-10 flex items-center justify-center">{children}</span>
      </button>
      <GlassFilter id={filterId} scale={70} />
    </>
  );
}

// ─── Volume Bars ────────────────────────────────────────────────────────────

const VolumeBars = memo(({ isPlaying }: { isPlaying: boolean }) => (
  <div className="pointer-events-none flex h-8 w-10 items-end gap-0.5">
    {Array.from({ length: 8 }, (_, i) => (
      <motion.div
        key={i}
        className="w-[3px] rounded-sm"
        style={{ background: 'linear-gradient(to top, #FF2E55, #FF6B88)' }}
        animate={isPlaying ? { height: ['6px', `${12 + Math.random() * 20}px`, '6px'] } : { height: '6px' }}
        transition={isPlaying ? { duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' } : { duration: 0.3 }}
      />
    ))}
  </div>
));
VolumeBars.displayName = 'VolumeBars';

// ─── Music Player ───────────────────────────────────────────────────────────

export interface MusicPlayerProps {
  title?: string;
  artist?: string;
  albumArt?: string;
  duration?: number;
  className?: string;
}

export function MusicPlayer({
  title = 'Midnight Dreams',
  artist = 'NeuraForge',
  albumArt,
  duration = 45,
  className = '',
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying && currentTime < duration) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev + 1 >= duration) { setIsPlaying(false); return duration; }
          return prev + 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, duration, currentTime]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const progress = (currentTime / duration) * 100;

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(pct * duration, duration));
    setCurrentTime(newTime);
    if (newTime < duration) setIsPlaying(true);
  }, [duration]);

  return (
    <div className={`w-full max-w-sm ${className}`}>
      <LiquidGlassCard className="p-5 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black shadow-xl">
        {/* Album + Info */}
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-400 via-pink-300 to-rose-200 shadow-lg ring-1 ring-black/5">
            {albumArt ? (
              <img src={albumArt} alt={`${title} album art`} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-white truncate">{title}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{artist}</p>
          </div>
          <VolumeBars isPlaying={isPlaying} />
        </div>

        {/* Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div
            className="relative h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
            onClick={handleSeek}
            role="slider"
            aria-label="Seek"
            aria-valuenow={currentTime}
            aria-valuemin={0}
            aria-valuemax={duration}
            tabIndex={0}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#FF2E55] to-[#FF6B88]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <LiquidButton ariaLabel="Previous" className="h-10 w-10 rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062a1.125 1.125 0 011.683.977v8.123z" /></svg>
          </LiquidButton>
          <LiquidButton
            ariaLabel={isPlaying ? 'Pause' : 'Play'}
            onClick={() => { if (currentTime >= duration) setCurrentTime(0); setIsPlaying(!isPlaying); }}
            className="h-12 w-12 rounded-full bg-gradient-to-br from-[#FF2E55] to-[#FF6B88] text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </LiquidButton>
          <LiquidButton ariaLabel="Next" className="h-10 w-10 rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.811V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" /></svg>
          </LiquidButton>
        </div>
      </LiquidGlassCard>
    </div>
  );
}

// ─── Video Player ───────────────────────────────────────────────────────────

export interface VideoPlayerProps {
  src?: string;
  poster?: string;
  title?: string;
  className?: string;
}

export function VideoPlayer({
  src,
  poster = 'https://placehold.co/640x360/1e1b4b/c4b5fd?text=Video+Preview',
  title = 'Component Walkthrough',
  className = '',
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className={`w-full max-w-lg ${className}`}>
      <LiquidGlassCard className="p-3 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black shadow-xl">
        {/* Video Area */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
          {src && isPlaying ? (
            <video src={src} poster={poster} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          ) : (
            <img src={poster} alt={title} className="h-full w-full object-cover" />
          )}
          {/* Play overlay */}
          {!isPlaying && (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
              aria-label="Play video"
            >
              <div className="w-14 h-14 rounded-full bg-white/90 dark:bg-white/80 flex items-center justify-center shadow-xl backdrop-blur-sm hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-zinc-900 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </button>
          )}
          {isPlaying && (
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              aria-label="Pause"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
            </button>
          )}
        </div>
        {/* Title */}
        <div className="mt-3 px-2 pb-1">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">{title}</h3>
        </div>
      </LiquidGlassCard>
    </div>
  );
}

export default MusicPlayer;
