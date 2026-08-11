'use client';

import { useState } from 'react';

export default function SoundToggle() {
  const [isMuted, setIsMuted] = useState(false);

  const toggleSound = () => {
    if (typeof (window as any).__toggleMute === 'function') {
      setIsMuted((window as any).__toggleMute());
    }
  };

  return (
    <button 
      className={`sound-toggle ${isMuted ? 'is-muted' : ''}`}
      id="soundToggle"
      aria-label={isMuted ? 'Ativar áudio' : 'Desativar áudio'}
      aria-pressed={isMuted}
      onClick={toggleSound}
    >
      <svg className="icon-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
      <svg className="icon-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    </button>
  );
}
