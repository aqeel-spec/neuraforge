'use client';

import { DrawerShell, DrawerHeader, type DrawerProps } from './drawer-shell';

export function ScrollableDrawer({ open, onClose, className }: DrawerProps) {
  return (
    <DrawerShell open={open} onClose={onClose} className={className}>
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900">
        <DrawerHeader title="Scrollable Content" onClose={onClose} />
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">Section {i + 1}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque eget accumsan purus.
            </p>
          </div>
        ))}
      </div>
    </DrawerShell>
  );
}
