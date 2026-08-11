'use client';

import { useEffect } from 'react';

const HERO_SPAN      = 2.2;
const RETURN_SPAN    = 2.2;
const MAX_SHIFT      = 6;
const SECTIONS_END   = HERO_SPAN + MAX_SHIFT;
const TOTAL_PROGRESS = SECTIONS_END + RETURN_SPAN;
const LERP           = 0.06;
const WHEEL_K        = 0.00022;
const TOUCH_K        = 0.0009;
const SHIFT_EPS      = 0.001;

const STORY_ORDER = ['intro','s2','s3','s4','s5','s6','s7'];
const SECTION_IDS = ['nextSection','nextSection2','nextSection3','nextSection4','nextSection5','nextSection6','nextSection7'];

function smoothstep(min: number, max: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function clampShiftDelta(shift: number, deltaShift: number): number {
  let newShift = shift + deltaShift;
  newShift = Math.max(0, Math.min(MAX_SHIFT, newShift));

  if (deltaShift > 0) {
    const frac = shift - Math.floor(shift);
    if (frac > SHIFT_EPS) {
      newShift = Math.min(newShift, Math.ceil(shift));
    }
  } else if (deltaShift < 0) {
    const frac = shift - Math.floor(shift);
    if (frac > SHIFT_EPS) {
      newShift = Math.max(newShift, Math.floor(shift));
    }
  }

  return newShift;
}

function isInWhiteSections(p: number): boolean {
  return p >= HERO_SPAN && p <= SECTIONS_END;
}

function applyScrollDelta(
  currentProgress: number,
  delta: number,
): number {
  if (isInWhiteSections(currentProgress)) {
    const shift = currentProgress - HERO_SPAN;

    if (delta < 0 && shift <= SHIFT_EPS) {
      return Math.max(0, currentProgress + delta);
    }

    // seção 07: deixa entrar no retorno ao hero
    if (delta > 0 && shift >= MAX_SHIFT - SHIFT_EPS) {
      return currentProgress + delta;
    }

    const newShift = clampShiftDelta(shift, delta);
    return HERO_SPAN + newShift;
  }

  let nextProgress = currentProgress + delta;

  if (nextProgress > TOTAL_PROGRESS) {
    if (currentProgress >= TOTAL_PROGRESS - SHIFT_EPS && delta > 0) {
      return 0;
    }
    nextProgress = TOTAL_PROGRESS;
  } else if (nextProgress < 0) {
    // hero: trava em 0 ao rolar pra trás (sem teleporte)
    if (currentProgress <= HERO_SPAN) {
      nextProgress = 0;
    } else {
      nextProgress = TOTAL_PROGRESS + nextProgress;
    }
  }

  return nextProgress;
}

function shiftToSectionIndex(shift: number): number {
  return Math.max(0, Math.min(SECTION_IDS.length - 1, Math.floor(shift + 1e-9)));
}

function isSection7Arrived(shift: number): boolean {
  return shift >= MAX_SHIFT - SHIFT_EPS;
}

export default function ScrollEngine() {

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const warpOverlay     = document.getElementById('warpOverlay');
    const heroContentEl   = document.querySelector('.hero-content')    as HTMLElement | null;
    const heroActionsEl   = document.querySelector('.hero-actions')    as HTMLElement | null;
    const cosmicMarkersEl = document.querySelector('.cosmic-markers')  as HTMLElement | null;
    const sectionsTrackEl = document.getElementById('sectionsTrack')   as HTMLElement | null;

    function setHeroOpacity(tunnelP: number) {
      const fade = 1 - smoothstep(0.1, 0.7, tunnelP);
      [heroContentEl, heroActionsEl, cosmicMarkersEl].forEach(el => {
        if (el) el.style.opacity = String(fade);
      });
    }

    if (prefersReduced) {
      if (sectionsTrackEl) {
        sectionsTrackEl.style.opacity = '1';
        sectionsTrackEl.classList.add('is-active');
      }
      setHeroOpacity(0);
      return;
    }

    let targetProgress = 0;
    let smoothProgress = 0;
    let isStoryActive = false;
    const finishedKeys: Record<string, boolean> = {};
    const startTimeRef = performance.now();
    let currentFilteredIndex = -1;
    const sectionEls = SECTION_IDS.map(id => document.getElementById(id));

    function snapLoopToHero() {
      targetProgress = 0;
      smoothProgress = 0;
      for (const key of Object.keys(finishedKeys)) delete finishedKeys[key];
      (window as any).__resetStoryLoop?.();
      applyProgress(0);
    }

    function applyScrollTarget(delta: number) {
      const prev = targetProgress;
      targetProgress = applyScrollDelta(targetProgress, delta);
      if (targetProgress === 0 && prev >= TOTAL_PROGRESS - SHIFT_EPS) {
        snapLoopToHero();
      }
    }

    function setActiveFilteredSection(index: number) {
      if (index === currentFilteredIndex) return;
      const prevEl = sectionEls[currentFilteredIndex];
      if (prevEl) prevEl.classList.remove('is-current-section');
      const nextEl = sectionEls[index];
      if (nextEl) nextEl.classList.add('is-current-section');
      currentFilteredIndex = index;
    }

    (window as any).__lockScroll = (sectionIndex = 0) => {
      targetProgress = HERO_SPAN + sectionIndex;
      smoothProgress = HERO_SPAN + sectionIndex;
      isStoryActive = true;
    };

    (window as any).__unlockScroll = () => {
      isStoryActive = false;
    };

    function applyProgress(p: number) {
      let tunnelP: number, trackOpacity: number, shift: number;

      if (p <= HERO_SPAN) {
        const rawP   = Math.max(0, Math.min(1, p / HERO_SPAN));
        tunnelP      = rawP;
        trackOpacity = smoothstep(0.55, 0.95, rawP);
        shift        = 0;
      } else if (p <= SECTIONS_END) {
        tunnelP      = 1;
        trackOpacity = 1;
        shift        = Math.min(p - HERO_SPAN, MAX_SHIFT);
      } else {
        const retRaw = Math.min(Math.max((p - SECTIONS_END) / RETURN_SPAN, 0), 1);
        tunnelP      = 1 - retRaw;
        trackOpacity = smoothstep(0.55, 0.95, 1 - retRaw);
        shift        = MAX_SHIFT;
      }

      if (warpOverlay) warpOverlay.style.opacity = String(smoothstep(0.2, 0.95, tunnelP));
      setHeroOpacity(tunnelP);

      if (sectionsTrackEl) {
        sectionsTrackEl.style.opacity   = String(trackOpacity);
        sectionsTrackEl.classList.toggle('is-active', trackOpacity > 0.5);
        sectionsTrackEl.style.transform = `translate3d(-${shift * 100}vw, 0, 0)`;
      }

      const section7El = sectionEls[SECTION_IDS.length - 1];
      const section7Arrived = isSection7Arrived(shift);
      section7El?.classList.toggle('is-section-ready', section7Arrived);

      const isWhiteSection = true;

      if (trackOpacity > 0.05) {
        const idx = shiftToSectionIndex(shift);
        setActiveFilteredSection(idx);
      } else {
        setActiveFilteredSection(-1);
      }

      if ((window as any).__updateSoulVisibility) {
        (window as any).__updateSoulVisibility(trackOpacity > 0.05, isWhiteSection);
      }
      
      if (trackOpacity > 0.05 && isWhiteSection) {
        document.body.classList.add('in-white-section');
      } else {
        document.body.classList.remove('in-white-section');
      }

      if (trackOpacity > 0.5 && !isStoryActive) {
        const activeIdx = shiftToSectionIndex(shift);
        for (let idx = 0; idx < STORY_ORDER.length; idx++) {
          const key = STORY_ORDER[idx];
          if (!finishedKeys[key] && idx === activeIdx) {
            if (idx === STORY_ORDER.length - 1 && !section7Arrived) break;
            const started = (window as any).__startStoryMode?.(key, idx);
            if (started !== false) finishedKeys[key] = true;
            break;
          }
        }
      }

      if ((window as any).__shaderSetProgress) (window as any).__shaderSetProgress(tunnelP);
      const siteReady = document.getElementById('site')?.classList.contains('is-visible');
      if (siteReady && (window as any).updateWormholeAudio) {
        (window as any).updateWormholeAudio(tunnelP, (performance.now() - startTimeRef) / 1000);
      }

      return tunnelP;
    }

    const onWheel = (e: WheelEvent) => {
      if (isStoryActive) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      if (e.deltaY === 0) return;
      const delta = e.deltaY * WHEEL_K;
      applyScrollTarget(delta);
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };
    const onTouchMove  = (e: TouchEvent) => {
      if (isStoryActive) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      const delta = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;
      if (delta === 0) return;
      applyScrollTarget(delta * TOUCH_K);
    };

    window.addEventListener('wheel',      onWheel,      { passive: false } as any);
    window.addEventListener('touchstart', onTouchStart, { passive: true  });
    window.addEventListener('touchmove',  onTouchMove,  { passive: false } as any);

    let rafId = 0;
    function render() {
      targetProgress = Math.min(Math.max(targetProgress, 0), TOTAL_PROGRESS);

      // loop completo: evita deslizar 7→1 enquanto smooth alcança o hero
      if (targetProgress <= SHIFT_EPS && smoothProgress >= SECTIONS_END) {
        smoothProgress = 0;
      }

      smoothProgress += (targetProgress - smoothProgress) * LERP;
      smoothProgress = Math.min(Math.max(smoothProgress, 0), TOTAL_PROGRESS);
      applyProgress(smoothProgress);
      rafId = requestAnimationFrame(render);
    }
    rafId = requestAnimationFrame(render);

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(rafId);
      else rafId = requestAnimationFrame(render);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('wheel',           onWheel);
      window.removeEventListener('touchstart',      onTouchStart);
      window.removeEventListener('touchmove',       onTouchMove);
      document.removeEventListener('visibilitychange', onVisibility);

      delete (window as any).__lockScroll;
      delete (window as any).__unlockScroll;

      sectionEls.forEach(el => el?.classList.remove('is-current-section', 'is-section-ready'));
    };
  }, []);

  return (
    <>
      <div className="warp-overlay" id="warpOverlay" aria-hidden="true" />
      <div className="scroll-indicator" id="scrollIndicator" aria-hidden="true">
        <span>role para continuar</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 5v14M19 12l-7 7-7-7"
          />
        </svg>
      </div>
    </>
  );
}
