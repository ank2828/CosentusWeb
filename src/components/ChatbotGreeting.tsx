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
    <div className="fixed bottom-24 left-48 md:left-56 z-40 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="pr-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Hey! I&apos;m COSE AI 👋
          </h3>
          <p className="text-gray-600 mb-6">
            Need help? Let&apos;s chat!
          </p>

          {/* Start Chatting button */}
          <button
            onClick={onStartChat}
            className="w-full bg-[#01B2D6] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#019BB8] transition-colors"
          >
            Start Chatting
          </button>
        </div>
      </div>
    </div>
  );
}
