'use client';

import { useState } from 'react';
import { type ReactNode } from 'react';

export interface FlipProps {
  title?: string;
  subtitle?: string;
  description?: string;
  features?: string[];
  ctaText?: string;
  onCtaClick?: () => void;
  accentColor?: string;
  className?: string;
  front?: ReactNode;
  back?: ReactNode;
}

export function Flip({
  title = "Design Systems",
  subtitle = "Explore the fundamentals",
  description = "Dive deep into the world of modern UI/UX design.",
  features = ["UI/UX", "Modern Design", "Tailwind CSS", "Components"],
  ctaText = "Start today",
  onCtaClick,
  accentColor = "violet",
  className = "",
  front,
  back,
}: FlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const colorMap: Record<string, { gradient: string; text: string; glow: string; bg: string }> = {
    violet: { gradient: "from-violet-500/20 via-violet-500/10 to-transparent", text: "text-violet-500", glow: "rgba(139, 92, 246, 0.5)", bg: "group-hover/start:text-violet-600 dark:group-hover/start:text-violet-400" },
    indigo: { gradient: "from-indigo-500/20 via-indigo-500/10 to-transparent", text: "text-indigo-500", glow: "rgba(99, 102, 241, 0.5)", bg: "group-hover/start:text-indigo-600 dark:group-hover/start:text-indigo-400" },
    cyan: { gradient: "from-cyan-500/20 via-cyan-500/10 to-transparent", text: "text-cyan-500", glow: "rgba(6, 182, 212, 0.5)", bg: "group-hover/start:text-cyan-600 dark:group-hover/start:text-cyan-400" },
    orange: { gradient: "from-orange-500/20 via-orange-500/10 to-transparent", text: "text-orange-500", glow: "rgba(255, 165, 0, 0.5)", bg: "group-hover/start:text-orange-600 dark:group-hover/start:text-orange-400" },
    emerald: { gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent", text: "text-emerald-500", glow: "rgba(16, 185, 129, 0.5)", bg: "group-hover/start:text-emerald-600 dark:group-hover/start:text-emerald-400" },
  };

  const colors = colorMap[accentColor] ?? colorMap.violet!;

  return (
    <div
      className={`group relative h-[340px] sm:h-[340px] w-full max-w-[300px] [perspective:2000px] ${className}`}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={`relative h-full w-full [transform-style:preserve-3d] transition-[transform] duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] motion-reduce:transition-none ${
          isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
        }`}
      >
        {/* Front Face */}
        <div className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateY(0deg)] overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/50 shadow-sm transition-shadow duration-500 group-hover:shadow-xl dark:group-hover:shadow-2xl dark:group-hover:shadow-violet-500/5">
          {front ? (
            <div className="h-full w-full">{front}</div>
          ) : (
            <div className="relative h-full overflow-hidden bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:to-black">
              {/* Animated background orbs */}
              <div aria-hidden="true" className="absolute inset-0 flex items-start justify-center pt-16">
                <div className="relative flex h-[120px] w-full max-w-[200px] items-center justify-center">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute h-[50px] w-[50px] rounded-full opacity-0 motion-reduce:hidden"
                      style={{
                        animation: `flip-scale 3s linear infinite ${i * 0.35}s`,
                        boxShadow: `0 0 40px ${colors.glow}`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Front content */}
              <div className="absolute right-0 bottom-0 left-0 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-lg text-zinc-900 leading-snug tracking-tight transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-[-4px] dark:text-white">
                      {title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-zinc-500 tracking-tight transition-transform delay-[50ms] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-[-4px] dark:text-zinc-400">
                      {subtitle}
                    </p>
                  </div>
                  <div className="relative">
                    <div className={`absolute inset-[-8px] rounded-lg bg-gradient-to-br ${colors.gradient} transition-opacity duration-300`} />
                    <svg className={`relative z-10 h-5 w-5 ${colors.text} transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-6 bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:to-black border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col transition-shadow duration-500 group-hover:shadow-xl dark:group-hover:shadow-2xl dark:group-hover:shadow-violet-500/5">
          {back ? (
            <div className="h-full w-full">{back}</div>
          ) : (
            <>
              <div className="flex-1 space-y-5">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-zinc-900 leading-snug tracking-tight transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-[-2px] dark:text-white">
                    {title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-zinc-500 tracking-tight transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-[-2px] dark:text-zinc-400">
                    {description}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {features.map((feature, index) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                      style={{
                        transform: isFlipped ? 'translateX(0)' : 'translateX(-10px)',
                        opacity: isFlipped ? 1 : 0,
                        transitionDelay: `${index * 60 + 150}ms`,
                      }}
                    >
                      <svg className={`h-3.5 w-3.5 ${colors.text} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-zinc-200 border-t pt-5 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onCtaClick}
                  className={`group/start relative w-full flex items-center justify-between -m-3 rounded-xl p-3 transition-[transform,background] duration-300 bg-gradient-to-r from-zinc-100 via-zinc-100 to-zinc-100 dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-800 hover:from-0% hover:${colors.gradient.split(' ')[0]} hover:via-100% hover:to-100% hover:to-transparent hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900`}
                >
                  <span className={`font-medium text-sm text-zinc-900 transition-colors duration-300 ${colors.bg} dark:text-white`}>
                    {ctaText}
                  </span>
                  <div className="relative">
                    <div className={`absolute inset-[-6px] rounded-lg bg-gradient-to-br ${colors.gradient} scale-90 opacity-0 transition-[transform,opacity] duration-300 group-hover/start:scale-100 group-hover/start:opacity-100`} />
                    <svg className={`relative z-10 h-4 w-4 ${colors.text} transition-transform duration-300 group-hover/start:translate-x-0.5 group-hover/start:scale-110`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flip-scale {
          0% { transform: scale(2); opacity: 0; }
          50% { transform: translate(0px, -5px) scale(1); opacity: 1; }
          100% { transform: translate(0px, 5px) scale(0.1); opacity: 0; }
        }
      `}} />
    </div>
  );
}

export default Flip;
