'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import ChatBubble from '@/components/ChatBubble';

const SplineWrapper = dynamic(() => import('@/components/SplineWrapper'), {
  ssr: false,
});

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

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

        {/* Spline Container - LOCKED IN PLACE */}
        <div className="fixed inset-0 w-full h-screen z-0">
          <div
            className="w-full h-full cursor-pointer"
            onClick={() => setIsChatOpen(true)}
          >
            <SplineWrapper scene="https://prod.spline.design/5ZgkWUcsZYt4PlRw/scene.splinecode" />
          </div>
        </div>

        {/* Content that goes over the Spline */}
        <div className="relative z-10 flex items-start justify-end h-full pointer-events-none px-8 md:px-16 lg:px-24 pt-32">
          <div className="max-w-4xl text-right">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight pointer-events-none">
              Meet the Future of Revenue Cycle Management
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 pointer-events-none">
              AI Agents That Work 24/7 While You Focus on Patient Care
            </h2>

            {/* Sub-copy */}
            <p className="text-xl text-white mb-8 leading-relaxed pointer-events-none">
              3 AI agents processing claims, answering calls, and optimizing revenue—backed by 1,000+ human experts and 25 years of proven results.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setIsChatOpen(true)}
                className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors pointer-events-auto"
              >
                Talk to COSE AI Now
              </button>
              <button className="border-2 border-gray-900 text-gray-900 bg-gray-200 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-300 transition-colors pointer-events-auto">
                See Our AI in Action
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Bubble */}
      <ChatBubble isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </main>
  );
}