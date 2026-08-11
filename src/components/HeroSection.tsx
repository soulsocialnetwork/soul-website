'use client';

import HeroShader from './HeroShader';
import SoundToggle from './SoundToggle';

export default function HeroSection() {

  return (
    <section className="hero">

      <HeroShader />

      <div className="hero-shader-overlay" aria-hidden="true" />

      <nav className="hero-nav" aria-label="Navegação principal">
        <img
          src="/logo.svg"
          className="hero-logo"
          alt="soul."
          width={60}
          height={20}
          decoding="async"
          fetchPriority="high"
        />
      </nav>

      <div className="hero-actions">
        <SoundToggle />
      </div>

      <div className="hero-content">
        <p className="hero-eyebrow">
          "menos algoritmo, mais humano"
        </p>
        <h1 className="hero-headline">
A primeira rede social<br />
feita para ser saudável<br />
de verdade.
        </h1>
      </div>

      <div className="cosmic-markers" aria-hidden="true">
        <div className="marker milky-way-marker">
          <div
            className="marker-soulzinho"
            style={{ animation: 'soulzinho-float 4s ease-in-out infinite alternate' }}
          >
            <video
              src="/soulzinho-animacao-ofical-tela-inicial.webm"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              width={38}
              height={38}
              onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none'; }}
            >
              <track kind="captions" src="/tracks/silent.vtt" srclang="pt" label="Português" />
            </video>
          </div>
          <div className="marker-line" />
          <p className="marker-label">[ VOCÊ ESTÁ AQUI : VIA LÁCTEA ]</p>
        </div>
      </div>

    </section>
  );
}
