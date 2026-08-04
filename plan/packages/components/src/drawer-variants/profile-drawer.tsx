'use client';

import { DrawerShell, DrawerHeader, type DrawerProps } from './drawer-shell';

export function ProfileDrawer({ open, onClose, className }: DrawerProps) {
  return (
    <DrawerShell open={open} onClose={onClose} className={className}>
      <DrawerHeader title="Profile" onClose={onClose} />
      <div className="p-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
          <span className="text-2xl font-bold text-white">JD</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Jane Doe</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Senior Developer</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Projects', value: '24' },
            { label: 'Followers', value: '1.2k' },
            { label: 'Stars', value: '89' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </DrawerShell>
  );
}
