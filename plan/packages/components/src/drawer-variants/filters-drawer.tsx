'use client';

import { useState } from "react";
import { DrawerShell, DrawerHeader, type DrawerProps } from './drawer-shell';

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
