'use client';

import { motion } from 'framer-motion';

export interface AnimatedAvatarGroupProps {
  avatars: { src: string; name: string }[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' };
const overlapMap = { sm: '-ml-2', md: '-ml-3', lg: '-ml-4' };

export function AnimatedAvatarGroup({
  avatars,
  max = 5,
  size = 'md',
  className = '',
}: AnimatedAvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const extra = avatars.length - max;

  return (
    <motion.div
      className={`flex items-center group ${className}`}
      whileHover="spread"
    >
      {visible.map((avatar, i) => (
        <motion.div
          key={avatar.name + i}
          className={`relative rounded-full border-2 border-white dark:border-gray-900 overflow-hidden ${sizeMap[size]} ${i > 0 ? overlapMap[size] : ''}`}
          variants={{
            spread: { marginLeft: i > 0 ? 4 : 0, scale: 1.1 },
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover" />
        </motion.div>
      ))}
      {extra > 0 && (
        <motion.div
          className={`relative flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-700 ${sizeMap[size]} ${overlapMap[size]}`}
          variants={{
            spread: { marginLeft: 4, scale: 1.1 },
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">+{extra}</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export default AnimatedAvatarGroup;
