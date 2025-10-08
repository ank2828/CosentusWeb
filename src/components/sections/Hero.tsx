'use client';

import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import Image from 'next/image';
import CosentusChatbot from '@/components/CosentusChatbot';
import ChatbotGreeting from '@/components/ChatbotGreeting';

export default function Home() {
  const isMobile = useIsMobile();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGreetingVisible, setIsGreetingVisible] = useState(false);

  // Show greeting after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsGreetingVisible(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

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
      <section className="relative h-[calc(95vh-1px)] w-full" style={{ backgroundColor: '#01B2D6' }}>
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

        {/* Avatar Container - Smooth shrink on scroll */}
        <div
          className="fixed cursor-pointer"
          style={{
            transform: isMobile ? 'scale(0.5)' : `scale(${1 - scrollProgress * 0.5})`,
            transformOrigin: isMobile ? 'bottom right' : 'bottom left',
            left: isMobile ? 'auto' : '0',
            right: isMobile ? '0' : 'auto',
            bottom: 0,
            transition: `transform 0.1s ease-out, opacity ${isChatOpen ? '0.3s' : '0.4s'} ease-in-out`,
            opacity: isChatOpen ? 0 : 1,
            pointerEvents: isChatOpen ? 'none' : 'auto',
            zIndex: 50,
            width: isMobile ? '150px' : '200px',
            height: isMobile ? '150px' : '200px'
          }}
          onClick={() => setIsChatOpen(true)}
        >
          <Image
            src="/images/ChatGPT Image Oct 8, 2025 at 12_46_51 PM.png"
            alt="Cindy Avatar"
            width={isMobile ? 150 : 200}
            height={isMobile ? 150 : 200}
            unoptimized
            priority
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Content that goes over the Spline */}
        <div className={`relative z-10 flex flex-col h-full pointer-events-none px-4 md:px-16 lg:px-24 ${isMobile ? 'pt-20 justify-start' : 'pt-24'}`}>
          {/* Spacer - desktop only */}
          {!isMobile && <div className="mt-16"></div>}

          {/* Hero Content */}
          <div className={`flex items-start ${isMobile ? 'justify-center' : 'justify-end'}`}>
            <div className={isMobile ? 'text-center' : 'text-right'} style={{ width: '100%', maxWidth: '1280px' }}>
              <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl md:text-6xl lg:text-7xl'} font-bold text-white mb-4 leading-tight pointer-events-none`} style={{ marginLeft: 'auto', maxWidth: '1400px' }}>
                Your Practice Deserves a Billing Partner That Works Smarter, Not Just Harder
              </h1>
              <div style={{ marginLeft: 'auto', maxWidth: '896px' }}>
                <h2 className={`${isMobile ? 'text-lg' : 'text-3xl md:text-4xl'} font-semibold text-white mb-8 pointer-events-none`}>
                  At Cosentus, our AI works behind the scenes at every step—verifying eligibility, optimizing claims, preventing denials, and accelerating payments—to maximize your collections and minimize your headaches.
                </h2>

                {/* CTA Buttons */}
                <div className={`flex gap-4 ${isMobile ? 'flex-col justify-center' : 'justify-end'}`}>
                  <button className={`bg-gray-900 text-white ${isMobile ? 'px-6 py-3' : 'px-8 py-4'} rounded-lg ${isMobile ? 'text-base' : 'text-lg'} font-semibold hover:bg-gray-800 transition-colors pointer-events-auto`}>
                    See the Difference
                  </button>
                  <button className={`border-2 border-gray-900 text-gray-900 bg-gray-200 ${isMobile ? 'px-6 py-3' : 'px-8 py-4'} rounded-lg ${isMobile ? 'text-base' : 'text-lg'} font-semibold hover:bg-gray-300 transition-colors pointer-events-auto`}>
                    Get Started Today
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* White line separator - Always visible at bottom of viewport */}
      <section style={{ backgroundColor: '#01B2D6' }}>
        <div className="h-px bg-white/20"></div>

        {/* AI Agent Lineup Section */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-8 md:pb-12">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
              AI Agents Built on 25 Years of Real Billing Results
            </h2>
            <p className="text-lg text-white leading-relaxed mb-12 md:mb-16">
              Not just smart technology—proven expertise. Our AI agents catch eligibility issues, answer patient questions instantly, and prevent denials before they happen. Same partnership you trust, now turbocharged.
            </p>
          </div>
        </div>
      </section>

      {/* Chatbot Greeting Card */}
      <ChatbotGreeting
        isVisible={isGreetingVisible && !isChatOpen}
        onStartChat={() => {
          setIsChatOpen(true);
          setIsGreetingVisible(false);
        }}
        onClose={() => setIsGreetingVisible(false)}
        scrollProgress={scrollProgress}
        isMobile={isMobile}
      />

      {/* Cosentus Chatbot - triggered by Spline avatar */}
      <CosentusChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        showButton={false}
        position="bottom-left"
      />
    </main>
  );
}