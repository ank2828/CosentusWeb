'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabButtonProps {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export default function TabButton({ active, icon: Icon, label, onClick }: TabButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all',
        active
          ? 'bg-cyan-50 border border-cyan-500 text-cyan-700'
          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </motion.button>
  );
}
