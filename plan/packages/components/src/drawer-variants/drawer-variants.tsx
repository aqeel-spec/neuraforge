'use client';
import { useState, useEffect, useCallback } from "react";

import { motion, AnimatePresence } from 'framer-motion';

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

// ─── Base Drawer Shell ────────────────────────────────────────────────────────

function DrawerShell({
  open,
  onClose,
  className = '',
  children,
}: DrawerProps & { children: React.ReactNode }) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, handleEscape]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/40 dark:bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Drawer panel */}
          <motion.div
            className={`fixed top-0 right-0 z-[101] h-full w-full sm:w-[400px] bg-white dark:bg-gray-900 shadow-2xl flex flex-col ${className}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
        aria-label="Close"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── 1. DefaultDrawer ─────────────────────────────────────────────────────────

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

// ─── 2. NestedDrawer ──────────────────────────────────────────────────────────

export function NestedDrawer({ open, onClose, className }: DrawerProps) {
  const [innerOpen, setInnerOpen] = useState(false);

  return (
    <DrawerShell open={open} onClose={onClose} className={className}>
      <DrawerHeader title="Nested Drawer" onClose={onClose} />
      <div className="p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Click below to open an inner drawer.
        </p>
        <button
          onClick={() => setInnerOpen(true)}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Open Inner Drawer
        </button>
      </div>
      {/* Inner Drawer */}
      <AnimatePresence>
        {innerOpen && (
          <motion.div
            className="absolute inset-0 z-10 bg-white dark:bg-gray-900 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <DrawerHeader title="Inner Drawer" onClose={() => setInnerOpen(false)} />
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This is the nested inner drawer. Press close or Escape to go back.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DrawerShell>
  );
}

// ─── 3. ScrollableDrawer ──────────────────────────────────────────────────────

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

// ─── 4. FormDrawer ────────────────────────────────────────────────────────────

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

// ─── 5. NotificationDrawer ────────────────────────────────────────────────────

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

// ─── 6. SettingsDrawer ────────────────────────────────────────────────────────

export function SettingsDrawer({ open, onClose, className }: DrawerProps) {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    analytics: false,
    autoSave: true,
  });

  const toggle = (key: keyof typeof settings) => setSettings((s) => ({ ...s, [key]: !s[key] }));

  return (
    <DrawerShell open={open} onClose={onClose} className={className}>
      <DrawerHeader title="Settings" onClose={onClose} />
      <div className="flex-1 p-6 space-y-1">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </span>
            <button
              role="switch"
              aria-checked={value}
              onClick={() => toggle(key as keyof typeof settings)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                value ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <motion.span
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                animate={{ x: value ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        ))}
      </div>
    </DrawerShell>
  );
}

// ─── 7. ProfileDrawer ─────────────────────────────────────────────────────────

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
        <div className="grid grid-cols-3 gap-4 mt-6">
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

// ─── 8. CartDrawer ────────────────────────────────────────────────────────────

const sampleCart = [
  { id: '1', name: 'Wireless Headphones', price: 99.99, qty: 1 },
  { id: '2', name: 'USB-C Cable', price: 12.99, qty: 2 },
  { id: '3', name: 'Laptop Stand', price: 49.99, qty: 1 },
];

export function CartDrawer({ open, onClose, className }: DrawerProps) {
  const total = sampleCart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <DrawerShell open={open} onClose={onClose} className={className}>
      <DrawerHeader title="Cart" onClose={onClose} />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {sampleCart.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.qty}</p>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ${(item.price * item.qty).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">${total.toFixed(2)}</span>
        </div>
        <button className="w-full py-2.5 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-colors">
          Checkout
        </button>
      </div>
    </DrawerShell>
  );
}

// ─── 9. FiltersDrawer ─────────────────────────────────────────────────────────

export function FiltersDrawer({ open, onClose, className }: DrawerProps) {
  const [priceRange, setPriceRange] = useState(50);

  return (
    <DrawerShell open={open} onClose={onClose} className={className}>
      <DrawerHeader title="Filters" onClose={onClose} />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Categories */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Category</h4>
          <div className="space-y-2">
            {['Electronics', 'Clothing', 'Books', 'Home'].map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{cat}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Price Range */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Price Range: ${priceRange}
          </h4>
          <input
            type="range"
            min={0}
            max={200}
            value={priceRange}
            onChange={(e) => setPriceRange(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 p-6">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </DrawerShell>
  );
}

// ─── 10. CommandDrawer ────────────────────────────────────────────────────────

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
