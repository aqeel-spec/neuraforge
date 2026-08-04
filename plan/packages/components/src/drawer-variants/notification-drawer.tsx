'use client';

import { DrawerShell, DrawerHeader, type DrawerProps } from './drawer-shell';

const sampleNotifications = [
  { id: '1', title: 'New message', desc: 'You have a new message from Sarah', time: '2m ago' },
  { id: '2', title: 'Build complete', desc: 'Your deployment was successful', time: '15m ago' },
  { id: '3', title: 'Update available', desc: 'Version 2.1.0 is ready to install', time: '1h ago' },
  { id: '4', title: 'Team invite', desc: 'Alex invited you to the project', time: '3h ago' },
];

export function NotificationDrawer({ open, onClose, className }: DrawerProps) {
  return (
    <DrawerShell open={open} onClose={onClose} className={className}>
      <DrawerHeader title="Notifications" onClose={onClose} />
      <div className="flex-1 overflow-y-auto">
        {sampleNotifications.map((n) => (
          <div key={n.id} className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</h4>
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-2">{n.time}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.desc}</p>
          </div>
        ))}
      </div>
    </DrawerShell>
  );
}
