'use client';

import { motion, useReducedMotion } from 'framer-motion';

export interface AgentAvatarProps {
  name?: string;
  status?: 'idle' | 'thinking' | 'speaking' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'w-10 h-10', md: 'w-16 h-16', lg: 'w-24 h-24' };
const ringSize = { sm: 'w-12 h-12', md: 'w-20 h-20', lg: 'w-28 h-28' };
const textSize = { sm: 'text-xs', md: 'text-base', lg: 'text-xl' };

const statusColors: Record<string, string> = {
  idle: 'border-gray-400 dark:border-gray-500',
  thinking: 'border-blue-500 dark:border-blue-400',
  speaking: 'border-green-500 dark:border-green-400',
  error: 'border-red-500 dark:border-red-400',
};

const statusAnimation: Record<string, object> = {
  idle: {},
  thinking: { rotate: 360, transition: { duration: 2, repeat: Infinity, ease: 'linear' } },
  speaking: { scale: [1, 1.08, 1], transition: { duration: 1, repeat: Infinity } },
  error: { borderColor: ['#ef4444', '#fbbf24', '#ef4444'], transition: { duration: 0.8, repeat: Infinity } },
};

export function AgentAvatar({ name, status = 'idle', size = 'md', className = '' }: AgentAvatarProps) {
  const shouldReduceMotion = useReducedMotion();
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AI';

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <motion.div
        className={`absolute rounded-full border-2 ${statusColors[status]} ${ringSize[size]}`}
        animate={shouldReduceMotion ? {} : (statusAnimation[status] as any)}
      />
      <div
        className={`relative rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 dark:from-purple-600 dark:via-blue-600 dark:to-cyan-500 flex items-center justify-center ${sizeMap[size]}`}
      >
        <span className={`font-bold text-white select-none ${textSize[size]}`}>
          {initials}
        </span>
      </div>
    </div>
  );
}

export default AgentAvatar;
