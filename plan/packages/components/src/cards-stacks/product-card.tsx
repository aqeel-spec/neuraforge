'use client';

import { motion } from 'framer-motion';

export interface ProductCardProps {
  title: string;
  price: string;
  image: string;
  badge?: string;
  rating?: number;
  onAddToCart?: () => void;
  className?: string;
}

export function ProductCard({
  title,
  price,
  image,
  badge,
  rating,
  onAddToCart,
  className = '',
}: ProductCardProps) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md group ${className}`}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-square">
        <motion.img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.4 }}
        />
        {badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold text-gray-900 dark:text-white">{price}</span>
          {rating !== undefined && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {onAddToCart && (
          <motion.button
            className="mt-3 w-full py-2 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium text-sm hover:from-blue-600 hover:to-cyan-600 transition-colors"
            whileTap={{ scale: 0.97 }}
            onClick={onAddToCart}
          >
            Add to Cart
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default ProductCard;
