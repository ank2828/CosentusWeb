'use client';

import { useState, useEffect } from 'react';
import ChatBubble from '@/components/ChatBubble';
import SplineWrapper from '@/components/SplineWrapper';

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = 500; // Distance to fully shrink
      const progress = Math.min(scrollY / maxScroll, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main>
      <section className="relative min-h-screen w-full" style={{ backgroundColor: '#01B2D6' }}>
        {/* Grid Pattern Background */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none z-[1]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.3) 1.5px, transparent 1.5px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 1.5px, transparent 1.5px)
            `,
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse at top right, black 0%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at top right, black 0%, transparent 70%)'
          }}
        />

        {/* Spline Container - Smooth shrink on scroll */}
        <div
          className="fixed inset-0 w-full h-screen z-0"
          style={{
            opacity: isChatOpen ? 0 : 1,
            pointerEvents: isChatOpen ? 'none' : 'auto',
            transform: `scale(${1 - scrollProgress * 0.5})`,
            transformOrigin: 'bottom left',
            transition: 'transform 0.1s ease-out, opacity 0.2s ease-in-out'
          }}
        >
          <div
            className="w-full h-full cursor-pointer"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <SplineWrapper scene="https://prod.spline.design/es79cdoxZI9dSURm/scene.splinecode" />
          </div>
        </div>

        {/* Content that goes over the Spline */}
        <div className="relative z-10 flex items-start justify-end h-full pointer-events-none px-8 md:px-16 lg:px-24 pt-32">
          <div className="text-right" style={{ width: '100%', maxWidth: '1280px' }}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight pointer-events-none" style={{ marginLeft: 'auto', maxWidth: '1400px' }}>
              Your Practice Deserves a Billing Partner That Works Smarter, Not Just Harder
            </h1>
            <div style={{ marginLeft: 'auto', maxWidth: '896px' }}>
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 pointer-events-none">
                At Cosentus, our AI works behind the scenes at every step—verifying eligibility, optimizing claims, preventing denials, and accelerating payments—to maximize your collections and minimize your headaches.
              </h2>

              {/* Sub-copy */}
              <p className="text-xl text-white mb-8 leading-relaxed pointer-events-none">
                25 years of proven results, now powered by intelligent automation that catches issues before they become denials. Same trusted partnership. Better, faster results.
              </p>

              {/* CTA Buttons */}
              <div className="flex gap-4 justify-end">
                <button className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors pointer-events-auto">
                  See the Difference
                </button>
                <button className="border-2 border-gray-900 text-gray-900 bg-gray-200 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-300 transition-colors pointer-events-auto">
                  Get Started Today
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Bubble */}
      <ChatBubble isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </main>
  );
}