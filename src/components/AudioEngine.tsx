'use client';

import { useEffect, useRef } from 'react';

export default function AudioEngine() {
  const bgMusicRef  = useRef<HTMLAudioElement>(null);
  const shuaAudioRef = useRef<HTMLAudioElement>(null);

  const ctxRef       = useRef<AudioContext | null>(null);
  const bgFilterRef  = useRef<BiquadFilterNode | null>(null);
  const shuaGainRef  = useRef<GainNode | null>(null);
  const shuaPannerRef = useRef<StereoPannerNode | null>(null);

  useEffect(() => {
    let isMuted = false;
    let wasInTunnel = false;
    /** Só true após clique/toque/tecla — bloqueia AudioContext antes disso. */
    let gestureUnlocked = false;

    function ensureUnlocked(): AudioContext | null {
      if (!gestureUnlocked) return null;
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        bgMusicRef.current?.load();
        shuaAudioRef.current?.load();
      }
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume().catch(() => {});
      }
      return ctxRef.current;
    }

    function getAudioCtxIfReady(): AudioContext | null {
      if (!gestureUnlocked || !ctxRef.current) return null;
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume().catch(() => {});
      }
      return ctxRef.current;
    }

    const onFirstInteraction = () => {
      gestureUnlocked = true;
      ensureUnlocked();
      document.removeEventListener('click', onFirstInteraction, true);
      document.removeEventListener('touchstart', onFirstInteraction, true);
      document.removeEventListener('keydown', onFirstInteraction, true);
    };

    document.addEventListener('click', onFirstInteraction, true);
    document.addEventListener('touchstart', onFirstInteraction, true);
    document.addEventListener('keydown', onFirstInteraction, true);

    (window as any).__toggleMute = () => {
      isMuted = !isMuted;
      if (bgMusicRef.current)  bgMusicRef.current.muted  = isMuted;
      if (shuaAudioRef.current) shuaAudioRef.current.muted = isMuted;
      return isMuted;
    };
    (window as any).__getIsMuted = () => isMuted;

    function initAudioNodes(ctx: AudioContext) {
      if (!bgFilterRef.current && bgMusicRef.current) {
        try {
          const src = ctx.createMediaElementSource(bgMusicRef.current);
          bgFilterRef.current = ctx.createBiquadFilter();
          bgFilterRef.current.type = 'lowpass';
          bgFilterRef.current.frequency.value = 22000;
          src.connect(bgFilterRef.current).connect(ctx.destination);
        } catch(_) {}
      }
      if (!shuaGainRef.current && shuaAudioRef.current) {
        try {
          const src = ctx.createMediaElementSource(shuaAudioRef.current);
          shuaPannerRef.current = ctx.createStereoPanner();
          shuaGainRef.current   = ctx.createGain();
          shuaGainRef.current.gain.value = 0;
          src.connect(shuaPannerRef.current).connect(shuaGainRef.current).connect(ctx.destination);
        } catch(_) {}
      }
    }

    function playWindBurst() {
      if (isMuted) return;
      const ctx = ensureUnlocked();
      if (!ctx) return;
      try {
        const duration = 2.0;
        const frames   = Math.ceil(ctx.sampleRate * duration);
        const buffer   = ctx.createBuffer(1, frames, ctx.sampleRate);
        const data     = buffer.getChannelData(0);
        for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

        const src = ctx.createBufferSource();
        src.buffer = buffer;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 800;
        bp.Q.value = 0.7;

        const shelf = ctx.createBiquadFilter();
        shelf.type = 'highshelf';
        shelf.frequency.value = 4000;
        shelf.gain.value = -12;

        const gain = ctx.createGain();
        const now  = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        src.connect(bp).connect(shelf).connect(gain).connect(ctx.destination);
        src.start(now);
        src.stop(now + duration);
      } catch(_) {}
    }

    (window as any).__playBackgroundMusic = () => {
      if (!bgMusicRef.current) return;
      ensureUnlocked();
      bgMusicRef.current.volume = 0;
      bgMusicRef.current.play()
        .then(() => {
          let vol = 0;
          const fade = setInterval(() => {
            if (isMuted) return;
            vol += 0.005;
            if (vol >= 0.06) { vol = 0.06; clearInterval(fade); }
            if (bgMusicRef.current) bgMusicRef.current.volume = vol;
          }, 100);
        })
        .catch(() => {});
    };

    (window as any).updateWormholeAudio = (progress: number, elapsed: number) => {
      // ScrollEngine chama isso a ~60fps desde o mount — sair cedo se ainda não houve gesto.
      if (!gestureUnlocked) return;
      if (!bgMusicRef.current || !shuaAudioRef.current) return;
      const ctx = ensureUnlocked();
      if (!ctx) return;
      initAudioNodes(ctx);

      const inTunnel = progress > 0.02 && progress < 0.98;

      if (wasInTunnel && !inTunnel && progress <= 0.02) {
        playWindBurst();
      }
      wasInTunnel = inTunnel;

      if (bgFilterRef.current) {
        const minFreq = 300, maxFreq = 22000;
        const targetFreq = minFreq * Math.pow(maxFreq / minFreq, 1 - progress);
        bgFilterRef.current.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
      }

      if (inTunnel) {
        if (!isMuted && !bgMusicRef.current.paused) {
          const duck = Math.sin(Math.min(progress, 1) * Math.PI) * 0.85;
          bgMusicRef.current.volume = 0.06 * (1 - duck);
        }
        if (shuaAudioRef.current.paused) shuaAudioRef.current.play().catch(() => {});

        const targetGain = Math.min(Math.sin(progress * Math.PI) * 2.5, 0.95);
        if (shuaGainRef.current) {
          shuaGainRef.current.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.05);
          shuaAudioRef.current.playbackRate =
            0.96 + Math.sin(elapsed * 3.2) * 0.08 + Math.cos(elapsed * 1.7) * 0.04;
          if (shuaPannerRef.current) {
            shuaPannerRef.current.pan.setTargetAtTime(
              Math.sin(elapsed * 2.1) * 0.55, ctx.currentTime, 0.12
            );
          }
        }
      } else {
        if (!isMuted && !bgMusicRef.current.paused) {
          bgMusicRef.current.volume = 0.06;
        }
        if (shuaGainRef.current) {
          shuaGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
          setTimeout(() => {
            if (shuaGainRef.current && shuaGainRef.current.gain.value < 0.01 && shuaAudioRef.current) {
              shuaAudioRef.current.pause();
            }
          }, 300);
        }
      }
    };

    const playClickSound = () => {
      if (isMuted) return;
      const ctx = ensureUnlocked();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.05);
      } catch(_) {}
    };

    const playHoverSound = () => {
      if (isMuted) return;
      const ctx = getAudioCtxIfReady();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, now);
        gain.gain.setValueAtTime(0.018, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.035);
      } catch(_) {}
    };

    (window as any).__playLogoPlin = () => {
      if (isMuted) return;
      const ctx = ensureUnlocked();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        [523.25, 783.99].forEach((freq, i) => {
          const osc    = ctx.createOscillator();
          const gain   = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(3000, now);
          filter.Q.value = 1;
          const delay = i * 0.15;
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.2);
          osc.connect(filter).connect(gain).connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 1.5);
        });
      } catch(_) {}
    };

    const SELECTOR = 'button, a[href], .story-panel, .marker, .enter-gate';

    const onMouseOver = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest(SELECTOR);
      if (!t || t.contains(e.relatedTarget as Node)) return;
      playHoverSound();
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(SELECTOR)) playClickSound();
    };

    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('click',     onClick,     true);

    return () => {
      document.removeEventListener('click', onFirstInteraction, true);
      document.removeEventListener('touchstart', onFirstInteraction, true);
      document.removeEventListener('keydown', onFirstInteraction, true);
      document.removeEventListener('mouseover', onMouseOver, true);
      document.removeEventListener('click',     onClick,     true);
      delete (window as any).__playBackgroundMusic;
      delete (window as any).updateWormholeAudio;
      delete (window as any).__toggleMute;
      delete (window as any).__getIsMuted;
      delete (window as any).__playLogoPlin;
    };
  }, []);

  return (
    <>
      <audio ref={bgMusicRef}   id="bgMusic"   src="/music-att.mp3"        loop preload="none" />
      <audio ref={shuaAudioRef} id="shuaAudio" src="/tunnel-sound-att.mp3" loop preload="none" />
    </>
  );
}
