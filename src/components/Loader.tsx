'use client';

import { useEffect, useRef, useCallback } from 'react';

// gsap sob demanda, pré-carrega no hover do entrar
let gsapModule: Promise<typeof import('gsap')> | null = null;
function loadGsap() {
  if (!gsapModule) gsapModule = import('gsap');
  return gsapModule;
}

declare global {
  interface Window {
    getAudioCtx: () => AudioContext;
    getIsMuted: () => boolean;
    playClickSound: () => void;
    playHoverSound: () => void;
    updateWormholeAudio?: (progress: number, elapsed: number) => void;
  }
}

export default function Loader({ onEntered }: { onEntered?: () => void }) {
  const loaderRef      = useRef<HTMLDivElement>(null);
  const enterGateRef   = useRef<HTMLButtonElement>(null);
  const audioHintRef   = useRef<HTMLParagraphElement>(null);
  const videoFrameRef  = useRef<HTMLDivElement>(null);
  const clipVideoRef   = useRef<HTMLVideoElement>(null);
  const videoInnerRef  = useRef<HTMLVideoElement>(null);
  const logoWrapRef    = useRef<HTMLDivElement>(null);
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);
  const grainStartedRef  = useRef(false);

  const startGrain = useCallback(() => {
    if (grainStartedRef.current) return;
    grainStartedRef.current = true;
    const canvas = noiseCanvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let running = true;
    const drawNoise = () => {
      if (!running) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w <= 0 || h <= 0) {
        rafId = requestAnimationFrame(drawNoise);
        return;
      }
      canvas.width  = w;
      canvas.height = h;
      const imgData = ctx.createImageData(w, h);
      const data    = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = data[i+1] = data[i+2] = v;
        data[i+3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
      rafId = requestAnimationFrame(drawNoise);
    };
    rafId = requestAnimationFrame(drawNoise);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafId);
      } else {
        running = true;
        rafId = requestAnimationFrame(drawNoise);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
  }, []);

  const playLogoPlin = useCallback(() => {
    if (typeof (window as any).__playLogoPlin === 'function') {
      (window as any).__playLogoPlin();
    }
  }, []);

  const playBackgroundMusic = useCallback(() => {
    if (typeof (window as any).__playBackgroundMusic === 'function') {
      (window as any).__playBackgroundMusic();
    }
  }, []);

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 19 || h < 6) document.body.classList.add('is-night');
  }, []);

  useEffect(() => {
    const gate = enterGateRef.current;
    if (!gate) return;
    const prefetch = () => loadGsap();
    gate.addEventListener('mouseenter', prefetch, { once: true });
    gate.addEventListener('focus', prefetch, { once: true });
    return () => {
      gate.removeEventListener('mouseenter', prefetch);
      gate.removeEventListener('focus', prefetch);
    };
  }, []);

  const runSequence = useCallback(async () => {
    const { default: gsap } = await loadGsap();
    const loader     = loaderRef.current!;
    const videoFrame = videoFrameRef.current!;
    const clipVideo  = clipVideoRef.current!;
    const logoWrap   = logoWrapRef.current!;
    const site       = document.getElementById('site');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.set(videoFrame, { opacity: 0, scale: 0.96, display: 'block' });
    gsap.set(logoWrap,   { opacity: 0, scale: 0.92 });
    gsap.set(clipVideo,  { scale: 1 });
    if (site) gsap.set(site, { opacity: 0, scale: 0.98 });

    gsap.to(videoFrame, {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      ease: 'power3.out',
      onStart: startGrain,
    });

    clipVideo.preload = 'auto';
    clipVideo.load();
    clipVideo.currentTime = 0;
    clipVideo.muted       = false;
    clipVideo.volume      = 1;

    // autoplay: tenta com som, senão mudo
    const playVideo = async () => {
      try {
        await clipVideo.play();
      } catch {
        clipVideo.muted = true;
        try { await clipVideo.play(); } catch { /* ignora */ }
      }
    };
    playVideo();

    if (!prefersReduced) {
      gsap.to(clipVideo, { scale: 1.06, duration: 5, ease: 'none' });
    }

    if (prefersReduced) {
      gsap.set(videoFrame, { opacity: 0 });
      clipVideo.pause();
    }

    const DUR_MS = prefersReduced ? 0 : 5000;
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      clipVideo.addEventListener('ended', finish, { once: true });
      clipVideo.addEventListener('error', finish, { once: true });
      setTimeout(finish, DUR_MS);
    });

    gsap.to(videoFrame, {
      opacity: 0,
      scale: 0.94,
      duration: 0.6,
      ease: 'none',
    });

    let vVol = clipVideo.volume;
    const vFade = setInterval(() => {
      vVol -= 0.05;
      if (vVol <= 0) {
        clearInterval(vFade);
        clipVideo.pause();
        clipVideo.volume = 0;
      } else {
        clipVideo.volume = vVol;
      }
    }, 30);

    await new Promise<void>((r) => setTimeout(r, 1800));

    playLogoPlin();
    gsap.to(logoWrap, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: 'power3.out',
    });

    await new Promise<void>((r) => setTimeout(r, 1200));
    gsap.to(logoWrap, {
      opacity: 0,
      scale: 0.92,
      duration: 0.4,
      ease: 'power3.in',
    });

    await new Promise<void>((r) => setTimeout(r, 500));
    playBackgroundMusic();

    gsap.to(loader, {
      opacity: 0,
      scale: 1.03,
      duration: 0.9,
      ease: 'power3.out',
      pointerEvents: 'none',
    });

    if (site) {
      gsap.to(site, {
        opacity: 1,
        scale: 1,
        duration: 1,
        delay: 0.2,
        ease: 'power3.out',
        onComplete: () => {
          site.classList.add('is-visible');
          onEntered?.();
        },
      });
    }

    setTimeout(() => {
      loader.style.display = 'none';
    }, 900);
  }, [playLogoPlin, playBackgroundMusic, onEntered, startGrain]);

  const handleEnter = useCallback(async () => {
    const { default: gsap } = await loadGsap();
    const enterGate = enterGateRef.current!;
    const audioHint = audioHintRef.current;

    gsap.to(enterGate, {
      opacity: 0,
      scale: 0.85,
      duration: 0.4,
      ease: 'power3.out',
      pointerEvents: 'none',
    });
    if (audioHint) {
      gsap.to(audioHint, {
        opacity: 0,
        duration: 0.4,
        ease: 'power3.out',
      });
    }

    runSequence();
  }, [runSequence]);

  return (
    <>
      <div id="loader" ref={loaderRef}>

        <button
          className="enter-gate stage-center"
          id="enterGate"
          ref={enterGateRef}
          onClick={handleEnter}
        >
          entrar
        </button>

        <p
          className="audio-hint stage-center"
          id="audioHint"
          ref={audioHintRef}
        >
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            aria-hidden="true"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <span>ative o som · f11 no pc</span>
        </p>

        <div
          className="video-frame stage-center"
          id="videoFrame"
          ref={videoFrameRef}
        >
          <div className="tv-overlay" aria-hidden="true" />
          <canvas
            id="noiseCanvas"
            ref={noiseCanvasRef}
            aria-hidden="true"
          />
          <video
            id="clipVideo"
            ref={(el) => {
              (clipVideoRef as any).current = el;
              (videoInnerRef as any).current = el;
            }}
            playsInline
            preload="metadata"
            poster="/video-intro-poster.jpg"
            width={480}
            height={480}
          >
            <source src="/video-intro.webm" type="video/webm" />
            <source src="/video-intro-opt.mp4" type="video/mp4" />
            <track kind="captions" src="/tracks/silent.vtt" srclang="pt" label="Português" />
          </video>
        </div>

        <div className="brand-stage" aria-hidden="true">
          <div className="logo-wrap" id="logoWrap" ref={logoWrapRef}>
            <img
              src="/logo.svg"
              className="logo-img"
              alt="soul."
              decoding="async"
              width={120}
              height={40}
            />
          </div>
        </div>

      </div>
    </>
  );
}
