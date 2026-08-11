'use client';

import { useEffect, useRef, useState } from 'react';

const SOUL_EXPRESSIONS = [
  { thought: null },
  { thought: 'dá pra perceber quando estão te puxando.' },
  { thought: 'até eu canso de tanto estímulo.' },
  { thought: 'sem pressa. o play é seu.' },
  { thought: null },
  { thought: 'isso devia ser óbvio.' },
  { thought: 'menos números, mais gente.' },
];

export default function SoulzinhoFixed() {
  const [isVisible, setIsVisible] = useState(false);
  const [isNegative, setIsNegative] = useState(false);
  const [thought, setThought] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  
  const currentIndex = useRef(-1);
  const visited = useRef(new Array(SOUL_EXPRESSIONS.length).fill(false));
  const thoughtTimer = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const onLoadedData = () => setVideoReady(true);
    video?.addEventListener('loadeddata', onLoadedData);
    // Caso o vídeo já esteja com frame decodificado (cache/fast path),
    // readyState >= 2 (HAVE_CURRENT_DATA) significa que 'loadeddata' já passou.
    if (video && video.readyState >= 2) setVideoReady(true);
    return () => video?.removeEventListener('loadeddata', onLoadedData);
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    (window as any).__updateSoulVisibility = (visible: boolean, neg: boolean) => {
      setIsVisible(visible);
      setIsNegative(neg);
    };

    (window as any).__updateSoulState = (shift: number) => {
      const index = Math.max(0, Math.min(SOUL_EXPRESSIONS.length - 1, Math.round(shift)));
      if (index === currentIndex.current) return;
      currentIndex.current = index;

      // Update Thought
      if (!visited.current[index]) {
        visited.current[index] = true;
        const expr = SOUL_EXPRESSIONS[index];
        if (expr.thought) {
          clearTimeout(thoughtTimer.current);
          setThought(null);
          
          const reveal = () => {
            setThought(expr.thought);
            thoughtTimer.current = window.setTimeout(() => {
              setThought(null);
            }, 2800);
          };
          
          if (prefersReduced) reveal();
          else thoughtTimer.current = window.setTimeout(reveal, 400);
        }
      }
    };

    return () => {
      delete (window as any).__updateSoulVisibility;
      delete (window as any).__updateSoulState;
      clearTimeout(thoughtTimer.current);
    };
  }, []);

  return (
    <div 
      className={`soulzinho-fixed ${isVisible ? 'is-visible' : ''} ${isNegative ? 'is-negative-active' : ''}`} 
      id="soulzinhoFixed"
    >
      <video
        ref={videoRef}
        className={`soul-video-layer is-active ${videoReady ? 'is-ready' : ''}`}
        src="/soulzinho-animacao-ofical-tela-inicial.webm"
        autoPlay loop muted playsInline
        preload="metadata"
        width={200}
        height={200}
      >
        <track kind="captions" src="/tracks/silent.vtt" srclang="pt" label="Português" />
      </video>
      <p
        className={`soul-thought ${thought ? 'is-visible' : ''}`}
        id="soulThought"
        aria-hidden="true"
      >
        {thought}
      </p>
    </div>
  );
}