'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface CapabilityCardProps {
  icon: LucideIcon;
  stat: string;
  title: string;
  description: string;
  delay?: number;
}

export default function CapabilityCard({ icon: Icon, stat, title, description, delay = 0 }: CapabilityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.3, delay }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
    >
      <Icon className="w-8 h-8 text-cyan-500 mb-3" />
      <div className="text-3xl font-semibold text-gray-900 mb-1">{stat}</div>
      <div className="text-sm font-medium text-gray-900 mb-2">{title}</div>
      <div className="text-xs text-gray-500 leading-relaxed">{description}</div>
    </motion.div>
  );
}
