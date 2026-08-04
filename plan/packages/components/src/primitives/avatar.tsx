'use client';

import React, { type ReactNode, useState } from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  fallbackIcon?: ReactNode;
  className?: string;
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[0.5rem]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-xl',
};

const statusDotSizes: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4 w-4',
};

const statusColors: Record<NonNullable<AvatarProps['status']>, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-400 dark:bg-gray-500',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
};

const statusLabels: Record<NonNullable<AvatarProps['status']>, string> = {
  online: 'Online',
  offline: 'Offline',
  busy: 'Busy',
  away: 'Away',
};

// Generate a consistent color from a name string
function hashToGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const gradients = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-fuchsia-500 to-pink-600',
    'from-sky-500 to-blue-500',
  ];

  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function DefaultUserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? 'h-1/2 w-1/2'}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  );
}

function Avatar({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  status,
  fallbackIcon,
  className = '',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = src && !imgError;
  const showInitials = !showImage && name;
  const showFallback = !showImage && !showInitials;

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';
  const gradient = name ? hashToGradient(name) : '';

  const accessibleLabel =
    alt ?? (name ? `Avatar for ${name}` : 'User avatar');

  return (
    <span
      className={[
        'relative inline-flex shrink-0',
        sizeClasses[size],
        className,
      ].join(' ')}
      role="img"
      aria-label={accessibleLabel}
    >
      {/* Avatar container */}
      <span
        className={[
          'inline-flex h-full w-full items-center justify-center overflow-hidden',
          'ring-2 ring-white dark:ring-slate-900',
          shapeClass,
          showInitials ? `bg-gradient-to-br ${gradient} text-white` : '',
          showFallback ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : '',
        ].join(' ')}
      >
        {showImage && (
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
        {showInitials && (
          <span className="font-medium leading-none select-none">
            {getInitials(name!)}
          </span>
        )}
        {showFallback && (fallbackIcon ?? <DefaultUserIcon />)}
      </span>

      {/* Status indicator */}
      {status && (
        <span
          className={[
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-slate-900',
            statusDotSizes[size],
            statusColors[status],
          ].join(' ')}
          aria-label={statusLabels[status]}
          role="status"
        />
      )}
    </span>
  );
}

Avatar.displayName = 'Avatar';

export { Avatar };
export default Avatar;
