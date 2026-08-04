'use client';

import { DrawerShell, DrawerHeader, type DrawerProps } from './drawer-shell';

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
