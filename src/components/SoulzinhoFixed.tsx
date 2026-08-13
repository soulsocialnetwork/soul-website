'use client';

import { useEffect, useRef, useState } from 'react';

export default function SoulzinhoFixed() {
  const [isVisible, setIsVisible] = useState(false);
  const [isNegative, setIsNegative] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const onLoadedData = () => setVideoReady(true);
    video?.addEventListener('loadeddata', onLoadedData);
    if (video && video.readyState >= 2) setVideoReady(true);
    return () => video?.removeEventListener('loadeddata', onLoadedData);
  }, []);

  useEffect(() => {
    (window as any).__updateSoulVisibility = (visible: boolean, neg: boolean) => {
      setIsVisible(visible);
      setIsNegative(neg);
    };

    return () => {
      delete (window as any).__updateSoulVisibility;
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
        <track kind="captions" src="/tracks/silent.vtt" srcLang="pt" label="Português" />
      </video>
    </div>
  );
}
