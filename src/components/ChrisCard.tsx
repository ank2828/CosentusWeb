'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import Image from 'next/image';
import {
  Headphones,
  Info,
  Shield,
  Calendar,
  CreditCard,
  Play,
  Pause,
  User,
  MessageSquare,
  Globe,
  Phone,
  Clock,
  Target,
  Zap,
  DollarSign
} from 'lucide-react';

// Scenario data
const scenarios = [
  {
    id: 'insurance',
    title: 'Insurance',
    icon: Shield,
    question: 'Can you verify my insurance coverage?',
    response: "Of course! I'll need your insurance provider and member ID to verify your coverage. This will just take a moment while I check with your insurance company.",
    audioFile: '/audio/chris-insurance.mp3',
    duration: 30
  },
  {
    id: 'appointment',
    title: 'Appointment',
    icon: Calendar,
    question: 'I need to schedule an appointment',
    response: "I'd be happy to help schedule your appointment. What type of visit do you need? We have availability this week for general check-ups, and I can find the earliest slot that works for you.",
    audioFile: '/audio/chris-appointment.mp3',
    duration: 36
  },
  {
    id: 'billing',
    title: 'Billing',
    icon: CreditCard,
    question: 'I have a question about my bill',
    response: "I can help with that. Let me pull up your account information. Can you provide your date of birth and the service date for the bill you're asking about?",
    audioFile: '/audio/chris-billing.mp3',
    duration: 28
  }
];

const capabilities = [
  {
    icon: Globe,
    title: 'Languages Supported',
    stat: '10+',
    description: 'English, Spanish, Mandarin, Hindi, Arabic, and more',
  },
  {
    icon: Phone,
    title: 'Concurrent Calls',
    stat: '20',
    description: 'Never experience busy signals or hold times'
  },
  {
    icon: Clock,
    title: 'Availability',
    stat: '24/7',
    description: 'No holidays, sick days, or breaks needed'
  },
  {
    icon: Target,
    title: 'Resolution Rate',
    stat: '99.2%',
    description: 'First-call resolution for most patient inquiries'
  },
  {
    icon: Zap,
    title: 'Response Time',
    stat: '<2s',
    description: 'Instant answers with natural conversation flow'
  },
  {
    icon: DollarSign,
    title: 'Monthly Savings',
    stat: '$8K+',
    description: 'vs. hiring 3 full-time receptionists'
  }
];

export default function ChrisCard() {
  const [activeTab, setActiveTab] = useState<'demo' | 'capabilities'>('demo');
  const [activeScenario, setActiveScenario] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveSurfer, setWaveSurfer] = useState<WaveSurfer | null>(null);

  const waveformRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (waveformRef.current && activeTab === 'demo' && typeof window !== 'undefined') {
      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#E5E7EB',
        progressColor: '#01B2D6',
        cursorColor: '#01B2D6',
        barWidth: 2,
        barRadius: 2,
        barGap: 1,
        height: 64,
        normalize: true,
        responsive: true,
      });

      ws.on('play', () => setIsPlaying(true));
      ws.on('pause', () => setIsPlaying(false));
      ws.on('audioprocess', (time) => setCurrentTime(Math.floor(time)));
      ws.on('finish', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      setWaveSurfer(ws);

      return () => ws.destroy();
    }
  }, [activeScenario, activeTab]);

  const togglePlayPause = () => {
    if (isPlaying) {
      // Pause playback
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Start/resume playback
      setIsPlaying(true);

      // Simulate playback progress
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 1;
          if (next >= scenarios[activeScenario].duration) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 1000);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      animate={{
        height: isPlaying ? 'auto' : 'auto',
      }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
        layout: {
          duration: 0.6,
          ease: [0.25, 0.1, 0.25, 1]
        }
      }}
      layout
      style={{
        position: 'relative',
        padding: '3rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        borderRadius: '3rem',
        maxWidth: '1200px',
        marginLeft: 'auto',
        marginRight: '3rem',
        zIndex: 1
      }}
    >
      {/* Top Right Corner Label */}
      <div
        style={{
          position: 'absolute',
          padding: '0.5rem 1.5rem',
          borderRadius: '9999px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          top: '-1rem',
          right: '2rem',
          zIndex: 10
        }}
      >
        <span style={{ color: '#111827', fontWeight: 600, fontSize: '1.125rem', fontStyle: 'italic' }}>How About Chris?</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
        {/* Left: Interactive Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Toggle Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('demo')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              fontWeight: 500,
              fontSize: '0.75rem',
              transition: 'all 0.2s',
              backgroundColor: activeTab === 'demo' ? '#ecfeff' : '#ffffff',
              border: activeTab === 'demo' ? '1px solid #01B2D6' : '1px solid #e5e7eb',
              color: activeTab === 'demo' ? '#0e7490' : '#374151',
              cursor: 'pointer'
            }}
          >
            <Headphones style={{ width: '1rem', height: '1rem' }} />
            <span>Hear Him In Action</span>
          </motion.button>

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('capabilities')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              fontWeight: 500,
              fontSize: '0.75rem',
              transition: 'all 0.2s',
              backgroundColor: activeTab === 'capabilities' ? '#ecfeff' : '#ffffff',
              border: activeTab === 'capabilities' ? '1px solid #01B2D6' : '1px solid #e5e7eb',
              color: activeTab === 'capabilities' ? '#0e7490' : '#374151',
              cursor: 'pointer'
            }}
          >
            <Info style={{ width: '1rem', height: '1rem' }} />
            <span>Capabilities</span>
          </motion.button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'demo' ? (
            <motion.div
              key="demo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ flex: 1 }}
            >
              {/* Scenario Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {scenarios.map((scenario, idx) => {
                  const ScenarioIcon = scenario.icon;
                  return (
                    <motion.button
                      key={scenario.id}
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveScenario(idx);
                        setIsPlaying(false);
                        setCurrentTime(0);
                      }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.6rem',
                        borderRadius: '0.5rem',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        transition: 'all 0.2s',
                        backgroundColor: '#ffffff',
                        border: activeScenario === idx ? '2px solid #01B2D6' : '1px solid #e5e7eb',
                        color: activeScenario === idx ? '#0e7490' : '#374151',
                        cursor: 'pointer',
                        boxShadow: activeScenario === idx ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                      }}
                    >
                      <ScenarioIcon style={{ width: '1.2rem', height: '1.2rem' }} />
                      <span>{scenario.title}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Patient Question with Animated Waveform - FULL WIDTH */}
              <motion.div
                key={`question-${activeScenario}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ marginBottom: '1.5rem' }}
              >
                <p style={{ fontSize: '1.125rem', color: '#ffffff', marginBottom: '1rem', fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  Patient asks: &ldquo;{scenarios[activeScenario].question}&rdquo;
                </p>

                {/* Animated Frequency Bars - FULL WIDTH */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.25rem', height: '120px', padding: '0.5rem 0', width: '100%' }}>
                  {[...Array(30)].map((_, i) => {
                    const baseHeight = 40 + Math.sin(i * 0.5) * 30;
                    const animatedHeight = isPlaying ? baseHeight + Math.sin((currentTime + i) * 1.6) * 40 : baseHeight * 0.3;
                    return (
                      <motion.div
                        key={i}
                        animate={{
                          height: `${animatedHeight}px`,
                        }}
                        transition={{
                          duration: 0.15,
                          ease: 'easeInOut',
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: isPlaying ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                          borderRadius: '3px',
                          boxShadow: isPlaying ? '0 0 15px rgba(255, 255, 255, 0.8)' : '0 0 5px rgba(255, 255, 255, 0.3)',
                        }}
                      />
                    );
                  })}
                </div>

                {/* Time display */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                    {formatTime(currentTime)}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                    {formatTime(scenarios[activeScenario].duration)}
                  </span>
                </div>
              </motion.div>

              {/* Play Button - NO WHITE CARD */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={togglePlayPause}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#01B2D6',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontWeight: 500,
                    fontSize: '0.8rem'
                  }}
                >
                  {isPlaying ? (
                    <>
                      <Pause style={{ width: '1rem', height: '1rem' }} />
                      <span>Pause Response</span>
                    </>
                  ) : (
                    <>
                      <Play style={{ width: '1rem', height: '1rem' }} />
                      <span>Play Response</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Transcript - Keep White Card Only for Transcript */}
              <AnimatePresence>
                {isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{
                      opacity: 1,
                      scaleY: 1,
                      transition: {
                        duration: 0.6,
                        ease: [0.25, 0.1, 0.25, 1]
                      }
                    }}
                    exit={{
                      opacity: 0,
                      scaleY: 0,
                      transition: {
                        duration: 0.6,
                        ease: [0.25, 0.1, 0.25, 1]
                      }
                    }}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      transformOrigin: 'top',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#01B2D6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MessageSquare style={{ width: '1.25rem', height: '1.25rem', color: '#ffffff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem', fontWeight: 500 }}>Chris responds:</p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                          style={{ fontSize: '1rem', color: '#111827', lineHeight: '1.75rem' }}
                        >
                          {scenarios[activeScenario].response}
                        </motion.p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="capabilities"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ flex: 1 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {capabilities.map((capability, idx) => {
                  const CapIcon = capability.icon;
                  return (
                    <motion.div
                      key={capability.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      whileHover={{ y: -2, scale: 1.01 }}
                      style={{
                        padding: '1.5rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        cursor: 'default'
                      }}
                    >
                      <CapIcon style={{ width: '2rem', height: '2rem', color: '#01B2D6', marginBottom: '0.75rem' }} />
                      <div style={{ fontSize: '1.875rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>{capability.stat}</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: '0.5rem' }}>{capability.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.5rem' }}>{capability.description}</div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Chris Image */}
      <div
        style={{
          flexShrink: 0,
          width: '300px',
          height: '300px',
          position: 'relative'
        }}
      >
        <Image
          src="/images/ChatGPT Image Oct 8, 2025 at 08_42_51 AM.png"
          alt="Chris AI Avatar"
          width={300}
          height={300}
          style={{ objectFit: 'contain', display: 'block', width: '100%', height: '100%' }}
          priority
        />
      </div>
      </div>
    </motion.div>
  );
}
