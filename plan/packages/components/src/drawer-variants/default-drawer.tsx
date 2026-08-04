'use client';

import { DrawerShell, DrawerHeader, type DrawerProps } from './drawer-shell';

export type { DrawerProps };

export function DefaultDrawer({ open, onClose, className }: DrawerProps) {
  return (
    <DrawerShell open={open} onClose={onClose} className={className}>
      <DrawerHeader title="Drawer" onClose={onClose} />
      <div className="p-6">
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">Welcome</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          This is a default drawer component. It slides in from the right with a smooth animation,
          includes a backdrop overlay, and can be closed with Escape or clicking outside.
        </p>
      </div>
    </DrawerShell>
  );
}
