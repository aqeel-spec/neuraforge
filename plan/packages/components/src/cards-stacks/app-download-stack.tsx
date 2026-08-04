'use client';

import { motion } from 'framer-motion';

export interface AppDownloadStackProps {
  apps: { name: string; icon: string; description: string; platform: 'ios' | 'android' | 'web' }[];
  className?: string;
}

const platformBadge: Record<string, string> = {
  ios: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
  android: 'bg-green-500 text-white',
  web: 'bg-blue-500 text-white',
};

export function AppDownloadStack({ apps, className = '' }: AppDownloadStackProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {apps.map((app, i) => (
        <motion.div
          key={app.name}
          className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
        >
          <img src={app.icon} alt={app.name} className="w-12 h-12 rounded-xl object-cover" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{app.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{app.description}</p>
          </div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${platformBadge[app.platform]}`}>
            {app.platform.toUpperCase()}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

export default AppDownloadStack;
