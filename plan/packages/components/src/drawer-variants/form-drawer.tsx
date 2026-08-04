'use client';

import { DrawerShell, DrawerHeader, type DrawerProps } from './drawer-shell';

export function FormDrawer({ open, onClose, className }: DrawerProps) {
  return (
    <DrawerShell open={open} onClose={onClose} className={className}>
      <DrawerHeader title="Contact Form" onClose={onClose} />
      <form className="flex-1 p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            type="email"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            rows={4}
            placeholder="Your message…"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-colors"
        >
          Submit
        </button>
      </form>
    </DrawerShell>
  );
}
