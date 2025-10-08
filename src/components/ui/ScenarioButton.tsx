'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScenarioButtonProps {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export default function ScenarioButton({ active, icon: Icon, label, onClick }: ScenarioButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl font-medium text-sm transition-all',
        active
          ? 'bg-white border-2 border-cyan-500 text-cyan-700 shadow-md'
          : 'bg-white border border-gray-200 text-gray-700 hover:shadow-md'
      )}
    >
      <Icon className="w-6 h-6" />
      <span>{label}</span>
    </motion.button>
  );
}
