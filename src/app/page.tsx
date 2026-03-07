'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'waiting' | 'ready'>('waiting');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [glitchText, setGlitchText] = useState('');

  // Cryptic rotating messages
  const messages = [
    'Are you here by choice?',
    'The dream is not yet shared.',
    'Waiting for a dreamer to set the stage...',
    'Reality is negotiable.',
    'What is the most resilient parasite?',
    'An idea.',
    'You mustn\u2019t be afraid to dream a little bigger.',
    'The seed has been planted.',
    'Do you want to take a leap of faith?',
    'They say we only use a fraction of our brain\u2019s true potential.',
    'Dreams feel real while we\u2019re in them.',
    'Something is about to begin.',
  ];

  useEffect(() => {
    let msgIndex = 0;
    const cycleMessage = () => {
      setGlitchText(messages[msgIndex % messages.length]);
      msgIndex++;
    };
    cycleMessage();
    const msgInterval = setInterval(cycleMessage, 4500);
    return () => clearInterval(msgInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for active session
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/session?latest=1');
        const data = await res.json();
        if (data.session) {
          const { id, state } = data.session;
          if (state === 'polling') {
            setPhase('ready');
            // Small delay for dramatic effect then redirect
            setTimeout(() => router.push(`/join/${id}`), 800);
          } else if (state === 'orchestrating' || state === 'complete') {
            router.push(`/join/${id}`);
          }
        }
      } catch { /* ignore */ }
    };
    check();
    pollRef.current = setInterval(check, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Slow spinning concentric rings */}
        {[300, 500, 700].map((size, i) => (
          <div
            key={size}
            className="absolute border border-blue-500/[0.04] rounded-full"
            style={{
              width: size,
              height: size,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              animation: `spin ${40 + i * 20}s linear infinite ${i % 2 ? 'reverse' : ''}`,
            }}
          />
        ))}
        {/* Floating particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-400/20"
            style={{
              left: `${10 + (i * 7.3) % 80}%`,
              top: `${15 + (i * 11.7) % 70}%`,
              animation: `float ${6 + (i % 4) * 2}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Totem icon — spinning top */}
        <div className="mb-10 relative">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="animate-pulse" style={{ animationDuration: '3s' }}>
            <rect x="29" y="8" width="6" height="12" rx="2" fill="#60a5fa" />
            <path d="M16 28 L48 28 L34 54 Q32 58 30 54 Z" fill="#60a5fa" opacity={0.85} />
            <ellipse cx="32" cy="28" rx="18" ry="5" fill="#60a5fa" opacity={0.6} />
            <circle cx="32" cy="55" r="2" fill="#60a5fa" />
          </svg>
          <div
            className="absolute -inset-6 rounded-full border border-blue-500/10"
            style={{ animation: 'spin 12s linear infinite' }}
          />
        </div>

        {/* Cryptic rotating text */}
        <p
          className="text-lg text-gray-400 transition-all duration-1000 min-h-[3rem] flex items-center"
          style={{ opacity: glitchText ? 1 : 0 }}
        >
          {glitchText}
        </p>

        {/* Subtle prompt */}
        <div className="mt-16 flex flex-col items-center gap-3">
          {phase === 'waiting' && (
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <div className="w-2 h-2 rounded-full bg-gray-700 animate-pulse" />
              <span>Awaiting inception</span>
            </div>
          )}
          {phase === 'ready' && (
            <div className="flex items-center gap-2 text-blue-400 text-sm animate-pulse">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>The dream is shared. Entering...</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) scale(1); opacity: 0.2; }
          100% { transform: translateY(-20px) scale(1.5); opacity: 0.05; }
        }
      `}</style>
    </div>
  );
}
