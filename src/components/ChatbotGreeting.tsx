'use client';

import { X } from 'lucide-react';

interface ChatbotGreetingProps {
  onStartChat: () => void;
  onClose: () => void;
  isVisible: boolean;
  scrollProgress: number;
  isMobile: boolean;
}

export default function ChatbotGreeting({ onStartChat, onClose, isVisible, scrollProgress, isMobile }: ChatbotGreetingProps) {
  if (!isVisible) return null;

  // Calculate avatar height based on scale
  const avatarScale = isMobile ? 0.5 : 1 - scrollProgress * 0.5;
  const avatarBaseHeight = isMobile ? 150 : 200;
  const avatarCurrentHeight = avatarBaseHeight * avatarScale;

  // Keep greeting card constant distance (16px) above avatar
  const greetingBottom = avatarCurrentHeight + 16;

  return (
    <div
      className="fixed z-40"
      style={{
        left: isMobile ? 'auto' : '16px',
        right: isMobile ? '16px' : 'auto',
        bottom: `${greetingBottom}px`,
        transition: 'bottom 0.1s ease-out',
        opacity: 1
      }}
    >
      <div className="bg-white rounded-xl shadow-xl p-4 w-64 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Hey! I&apos;m COSE AI 👋
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Need help? Let&apos;s chat!
          </p>

          {/* Start Chatting button */}
          <button
            onClick={onStartChat}
            className="w-full bg-[#01B2D6] text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-[#019BB8] transition-colors"
          >
            Start Chatting
          </button>
        </div>
      </div>
    </div>
  );
}
