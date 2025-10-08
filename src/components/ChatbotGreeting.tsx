'use client';

import { X } from 'lucide-react';

interface ChatbotGreetingProps {
  onStartChat: () => void;
  onClose: () => void;
  isVisible: boolean;
}

export default function ChatbotGreeting({ onStartChat, onClose, isVisible }: ChatbotGreetingProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-24 left-48 md:left-56 z-40 animate-slideUp"
      style={{
        animation: 'slideUp 0.5s ease-out forwards'
      }}
    >
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="bg-white rounded-xl shadow-xl p-4 max-w-xs relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="pr-4">
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
