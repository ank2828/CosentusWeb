'use client';

import { useState } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Menu, X } from 'lucide-react';

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
        {isMobile && isMenuOpen && (
          <div className="pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3 pt-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-black hover:text-gray-600 transition-colors text-base font-light py-2"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
