'use client';

import { useState } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: '#about', label: 'About Us' },
    { href: '#services', label: 'Services' },
    { href: '#partnership', label: 'Partnership' },
    { href: '#resources', label: 'Resources' },
    { href: '#blogs', label: 'Blogs' },
    { href: '#news', label: 'News' },
    { href: '#events', label: 'Events' },
    { href: '#we-care', label: 'We Care' },
    { href: '#contact', label: 'Contact Us' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between py-4 md:py-6">
          {/* Logo - Left on mobile, Right on desktop */}
          <img
            src="https://cosentus.com/wp-content/uploads/2021/08/New-Cosentus-Logo-1.png"
            alt="Cosentus Logo"
            className={`h-8 md:h-10 ${isMobile ? 'order-1' : 'order-2'}`}
          />

          {/* Desktop Nav Links */}
          {!isMobile && (
            <div className="flex items-center space-x-8 order-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-black hover:text-gray-600 transition-colors text-base font-light"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="order-2 p-2 text-black hover:text-gray-600 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobile && (
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.25, ease: 'easeInOut' }
                }}
                className="overflow-hidden border-t border-gray-200"
              >
                <div className="flex flex-col space-y-1 pt-4 pb-4">
                  {navLinks.map((link, index) => (
                    <motion.a
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      className="text-black hover:text-gray-600 hover:bg-gray-50 transition-all text-base font-light py-3 px-2 rounded-md"
                    >
                      {link.label}
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </nav>
  );
}
