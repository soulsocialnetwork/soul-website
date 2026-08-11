/**
 * Loader.tsx — Tela de entrada do soul.
 * client:load
 *
 * Sequência exata do original, orquestrada com GSAP:
 *
 *  1. Botão "entrar." + audio-hint visíveis imediatamente
 *  2. Click → botão/hint saem (opacity 0, scale 0.85, dur=0.4s, ease="power3.out")
 *  3. video-frame faz fade-in (opacity 0→1, scale 0.96→1, dur=0.7s, ease="power3.out")
 *  4. Vídeo começa a tocar + zoom do video interno: scale 1→1.06 em 5s linear
 *  5. Após 5 s (ou ended/error) → video-frame faz close:
 *       opacity 1→0, scale 1→0.94, dur=0.6s, ease="none"
 *       volume do vídeo faz fade-out via intervalo de 30ms (idêntico original)
 *  6. 1.2 s de pausa (tela preta) — respeita o "0.6 fechar + 1.2 respiro = 1.8"
 *  7. playLogoPlin() → logo-wrap entra: opacity 0→1, scale 0.92→1, dur=0.8s ease="power3.out"
 *  8. 1.2 s → logo sai: opacity→0, scale→0.92, dur=0.4s
 *  9. 0.5 s → playBackgroundMusic()
 * 10. Loader sai: opacity→0, scale→1.03, dur=0.9s, ease="power3.out"
 *     Site entra: opacity→1, scale→1, dur=1s, delay=0.2s
 * 11. Após 0.9 s → loader display:none
 *
 * Web Audio (Web API pura, sem library):
 *   - playClickSound  : sine 440Hz, 0.05→0.001, 40ms
 *   - playHoverSound  : sine 920Hz, 0.018→0.001, 30ms
 *   - playLogoPlin    : sine 523.25 + 783.99Hz, lowpass 1100Hz, 0.9s decay
 *   - playBackgroundMusic: bgMusic vol 0→0.06 em passos de 0.005/100ms
 *
 * Noise canvas: grain animado independente (rAF, pausa visibilitychange)
 * Modo noite: body.is-night quando hora >= 19 || < 6
 * prefers-reduced-motion: omite animações pesadas (zoom, grain)
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

/** GSAP carregado sob demanda — prefetch no hover do botão "entrar". */
let gsapModule: Promise<typeof import('gsap')> | null = null;
function loadGsap() {
  if (!gsapModule) gsapModule = import('gsap');
  return gsapModule;
}

/* ─── Tipos ─────────────────────────────────────────────────────── */
declare global {
  interface Window {
    getAudioCtx: () => AudioContext;
    getIsMuted: () => boolean;
    playClickSound: () => void;
    playHoverSound: () => void;
    updateWormholeAudio?: (progress: number, elapsed: number) => void;
  }
}

/* ─── Componente ────────────────────────────────────────────────── */
export default function Loader({ onEntered }: { onEntered?: () => void }) {
  /* Refs para os elementos DOM */
  const loaderRef      = useRef<HTMLDivElement>(null);
  const enterGateRef   = useRef<HTMLButtonElement>(null);
  const audioHintRef   = useRef<HTMLParagraphElement>(null);
  const videoFrameRef  = useRef<HTMLDivElement>(null);
  const clipVideoRef   = useRef<HTMLVideoElement>(null);
  const videoInnerRef  = useRef<HTMLVideoElement>(null); // mesmo elemento, ref para scale
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

  /* ── Modo noite ─────────────────────────────────────────── */
  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 19 || h < 6) document.body.classList.add('is-night');
  }, []);

  /* Prefetch GSAP no hover — carrega antes do clique sem bloquear o parse inicial */
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

  /* ── Sequência principal (GSAP) ───────────────────────────────── */
  const runSequence = useCallback(async () => {
    const { default: gsap } = await loadGsap();
    const loader     = loaderRef.current!;
    const videoFrame = videoFrameRef.current!;
    const clipVideo  = clipVideoRef.current!;
    const logoWrap   = logoWrapRef.current!;
    const site       = document.getElementById('site');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── RESET ─────────────────────────────────────────────────── */
    gsap.set(videoFrame, { opacity: 0, scale: 0.96, display: 'block' });
    gsap.set(logoWrap,   { opacity: 0, scale: 0.92 });
    gsap.set(clipVideo,  { scale: 1 });
    if (site) gsap.set(site, { opacity: 0, scale: 0.98 });

    /* ── STEP 1: video-frame aparece ───────────────────────────── */
    // opacity 0→1, scale 0.96→1 em 0.7s, ease power3.out
    gsap.to(videoFrame, {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      ease: 'power3.out',
      onStart: startGrain,
    });

    /* ── STEP 2: iniciar vídeo ─────────────────────────────────── */
    clipVideo.preload = 'auto';
    clipVideo.load();
    clipVideo.currentTime = 0;
    clipVideo.muted       = false;
    clipVideo.volume      = 1;

    // Autoplay policy: try unmuted first, fall back to muted
    const playVideo = async () => {
      try {
        await clipVideo.play();
      } catch {
        clipVideo.muted = true;
        try { await clipVideo.play(); } catch { /* video failed — poster stays visible */ }
      }
    };
    playVideo();

    /* Zoom do vídeo interno: scale 1→1.06 em 5s linear (idêntico ao original) */
    if (!prefersReduced) {
      gsap.to(clipVideo, { scale: 1.06, duration: 5, ease: 'none' });
    }

    /* prefers-reduced-motion: skip video, go straight to logo */
    if (prefersReduced) {
      gsap.set(videoFrame, { opacity: 0 });
      clipVideo.pause();
    }

    /* ── STEP 3: aguarda 5 s (ou ended/error, o que vier primeiro) */
    const DUR_MS = prefersReduced ? 0 : 5000;
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      clipVideo.addEventListener('ended', finish, { once: true });
      clipVideo.addEventListener('error', finish, { once: true });
      setTimeout(finish, DUR_MS);
    });

    /* ── STEP 4: fechar video-frame ────────────────────────────── */
    // opacity→0, scale→0.94, dur=0.6s (is-closing no original)
    gsap.to(videoFrame, {
      opacity: 0,
      scale: 0.94,
      duration: 0.6,
      ease: 'none',
    });

    // Fade-out de volume: intervalo 30ms idêntico ao original
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

    /* 0.6 (fechar) + 1.2 (respiro) = 1.8 s de espera */
    await new Promise<void>((r) => setTimeout(r, 1800));

    /* ── STEP 5: logo entra ────────────────────────────────────── */
    playLogoPlin();
    // opacity 0→1, scale 0.92→1, dur=0.8s (logo-wrap.is-in no original)
    gsap.to(logoWrap, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: 'power3.out',
    });

    /* ── STEP 6: 1.2 s → logo sai ─────────────────────────────── */
    await new Promise<void>((r) => setTimeout(r, 1200));
    gsap.to(logoWrap, {
      opacity: 0,
      scale: 0.92,
      duration: 0.4,
      ease: 'power3.in',
    });

    /* ── STEP 7: 0.5 s → música + reveal ──────────────────────── */
    await new Promise<void>((r) => setTimeout(r, 500));
    playBackgroundMusic();

    // Loader sai: opacity→0, scale→1.03, dur=0.9s (cubic-bezier(0.16,1,0.3,1) ≈ power3.out)
    gsap.to(loader, {
      opacity: 0,
      scale: 1.03,
      duration: 0.9,
      ease: 'power3.out',
      pointerEvents: 'none',
    });

    // Site entra: opacity→1, scale→1, dur=1s, delay=0.2s
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

    // Após 0.9 s → remove loader do fluxo
    setTimeout(() => {
      loader.style.display = 'none';
    }, 900);
  }, [playLogoPlin, playBackgroundMusic, onEntered, startGrain]);

  /* ── Click no botão "entrar." ────────────────────────────────── */
  const handleEnter = useCallback(async () => {
    const { default: gsap } = await loadGsap();
    const enterGate = enterGateRef.current!;
    const audioHint = audioHintRef.current;

    // botão e hint saem: opacity→0, scale→0.85, 0.4s, power3.out
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

  /* ── Hover do botão enter-gate ───────────────────────────────── */
  // O CSS cuida do hover (transform scale(1.04)) — apenas som via global handler

  return (
    <>


      {/* Loader overlay */}
      <div id="loader" ref={loaderRef}>

        {/* Botão "entrar." */}
        <button
          className="enter-gate stage-center"
          id="enterGate"
          ref={enterGateRef}
          onClick={handleEnter}
        >
          entrar
        </button>

        {/* Dica de áudio + fullscreen */}
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

        {/* Video frame com máscara radial, overlay TV e grain */}
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

        {/* Logo soul. — aparece após o vídeo */}
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
