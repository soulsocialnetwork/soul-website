/**
 * HeroSection — seção hero completa.
 * Inclui: HeroShader (WebGL), overlay, nav, sound toggle,
 * headline/eyebrow, cosmic markers com soulzinho flutuante.
 *
 * Animação do soulzinho: translateY APENAS (sem scale),
 * conforme especificado na Fase 2.
 * client:only="react" via index.astro.
 */

'use client';

import HeroShader from './HeroShader';
import SoundToggle from './SoundToggle';

export default function HeroSection() {

  return (
    <section className="hero">

      {/* WebGL shader — ilha client:only dentro da ilha hero */}
      <HeroShader />

      {/* Overlay escuro sobre o shader */}
      <div className="hero-shader-overlay" aria-hidden="true" />

      {/* ── Nav: logo ────────────────────────────────────────────── */}
      <nav className="hero-nav" aria-label="Navegação principal">
        <img
          src="/logo.svg"
          className="hero-logo"
          alt="soul."
          width={60}
          height={20}
          decoding="async"
        />
      </nav>

      {/* ── Actions: sound toggle ────────────────────────────────── */}
      <div className="hero-actions">
        <SoundToggle />
      </div>

      {/* ── Conteúdo hero: eyebrow + headline ───────────────────── */}
      <div className="hero-content">
        <p className="hero-eyebrow">
          [ projeto de bem-estar digital · menos algoritmo, mais humano ]
        </p>
        <h1 className="hero-headline">
          uma rede social<br />
          projetada para devolver<br />
          a sua atenção
        </h1>
      </div>

      {/* ── Cosmic markers ───────────────────────────────────────── */}
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
