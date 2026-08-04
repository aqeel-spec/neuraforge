'use client';

import { useState } from "react";
import { DrawerShell, DrawerHeader, type DrawerProps } from './drawer-shell';

const sampleCommands = [
  { id: '1', label: 'New file', shortcut: '⌘N' },
  { id: '2', label: 'Open project', shortcut: '⌘O' },
  { id: '3', label: 'Search files', shortcut: '⌘P' },
  { id: '4', label: 'Toggle terminal', shortcut: '⌘`' },
  { id: '5', label: 'Git commit', shortcut: '⌘⇧G' },
  { id: '6', label: 'Run task', shortcut: '⌘⇧B' },
];

export function CommandDrawer({ open, onClose, className }: DrawerProps) {
  const [search, setSearch] = useState('');
  const filtered = sampleCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DrawerShell open={open} onClose={onClose} className={className}>
      <DrawerHeader title="Commands" onClose={onClose} />
      <div className="px-6 py-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search commands…"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          autoFocus
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((cmd) => (
          <button
            key={cmd.id}
            className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            onClick={onClose}
          >
            <span className="text-sm text-gray-900 dark:text-white">{cmd.label}</span>
            <kbd className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {cmd.shortcut}
            </kbd>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">No commands found.</p>
        )}
      </div>
    </DrawerShell>
  );
}
