'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { STORY_BEATS, type Beat } from '../lib/storyBeats';

const TYPEWRITER_MS = 3;
const AUTO_DELAY = 2200;

const STORY_SECTION_MAP: Record<string, string> = {
  intro: 'nextSection', s2: 'nextSection2', s3: 'nextSection3',
  s4: 'nextSection4', s5: 'nextSection5', s6: 'nextSection6',
  s7: 'nextSection7',
};

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

export default function StoryUI() {
  const [isActive, setIsActive] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [currentKey, setCurrentKey] = useState<string>('');
  const [isComment, setIsComment] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [screenReaderText, setScreenReaderText] = useState('');
  const [isNegative, setIsNegative] = useState(false);
  
  const currentBeatIndex = useRef(0);
  const finishedKeys = useRef<Record<string, boolean>>({});
  const typewriterTimer = useRef<number>(0);
  const autoAdvanceTimer = useRef<number>(0);
  const typewriterFullText = useRef('');
  const typewriterOnComplete = useRef<(() => void) | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const getRevealTargets = useCallback((key: string, sectionKey: string) => {
    const sectionId = STORY_SECTION_MAP[sectionKey] || 'nextSection';
    return document.querySelectorAll<HTMLElement>(`#${sectionId} [data-story-reveal="${key}"]`);
  }, []);

  const revealContent = useCallback((revealKey: string, sectionKey: string) => {
    if (!revealKey) return;
    const els = getRevealTargets(revealKey, sectionKey);
    els.forEach(el => {
      el.classList.add('is-revealed');
    });
  }, [getRevealTargets]);

  const showContinueButton = useCallback(() => {
    setShowContinue(true);
    if (buttonRef.current) buttonRef.current.focus({ preventScroll: true });
  }, []);

  const finishTyping = useCallback(() => {
    clearTimeout(typewriterTimer.current);
    clearTimeout(autoAdvanceTimer.current);
    setTypedText(typewriterFullText.current);
    setIsTyping(false);
    
    const cb = typewriterOnComplete.current;
    typewriterOnComplete.current = null;
    if (cb) cb(); else showContinueButton();
  }, [showContinueButton]);

  const typeText = useCallback((text: string, onComplete: () => void) => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    clearTimeout(typewriterTimer.current);
    typewriterFullText.current = text;
    typewriterOnComplete.current = onComplete;
    setIsTyping(true);
    setShowContinue(false);
    setTypedText('');
    setScreenReaderText(text);

    if (prefersReduced) {
      finishTyping();
      return;
    }

    let i = 0;
    const tick = () => {
      i++;
      setTypedText(text.slice(0, i));
      if (i >= text.length) {
        finishTyping();
        return;
      }
      typewriterTimer.current = window.setTimeout(tick, TYPEWRITER_MS);
    };
    tick();
  }, [finishTyping]);

  const runStatCountForReveal = useCallback((revealKey: string, sectionKey: string) => {
    const sectionId = STORY_SECTION_MAP[sectionKey] || 'nextSection';
    const stats = document.querySelectorAll<HTMLElement>(
      `#${sectionId} [data-story-reveal="${revealKey}"] .swiss-stat-num[data-count-target]`
    );
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!stats.length || prefersReduced) {
      showContinueButton();
      return;
    }

    stats.forEach(el => {
      const target = parseFloat(el.getAttribute('data-count-target') || '0');
      if (Number.isNaN(target)) return;
      
      const format = el.getAttribute('data-count-format') || 'plain';
      const suffix = el.getAttribute('data-count-suffix') || '';
      
      const formatCount = (val: number) => {
        const rounded = Math.round(val);
        if (format === 'hm') {
          const h = Math.floor(rounded / 60);
          const m = String(rounded % 60).padStart(2, '0');
          return `${h}h${m}`;
        }
        if (format === 'suffix') return `${rounded}${suffix}`;
        return String(rounded);
      };

      const finalText = formatCount(target);
      const duration = 750;
      const start = performance.now();
      
      const animateStat = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = formatCount(target * easeOutCubic(t));
        if (t < 1) requestAnimationFrame(animateStat);
        else el.textContent = finalText;
      };
      requestAnimationFrame(animateStat);
    });

    setTimeout(showContinueButton, 750 + 200);
  }, [showContinueButton]);

  const endStoryMode = useCallback(() => {
    finishedKeys.current[currentKey] = true;
    setIsActive(false);
    if ((window as any).__unlockScroll) (window as any).__unlockScroll();
    document.getElementById('scrollIndicator')?.classList.add('is-visible');
  }, [currentKey]);

  const showBeat = useCallback((key: string, index: number) => {
    const beats = STORY_BEATS[key];
    const beat = beats?.[index];
    if (!beat) { endStoryMode(); return; }

    setIsComment(beat.type === 'comment');
    setShowContinue(false);

    if (beat.reveal) revealContent(beat.reveal, key);

    typeText(beat.text, () => {
      if (beat.type === 'stat' && beat.reveal) {
        runStatCountForReveal(beat.reveal, key);
      } else {
        showContinueButton();
      }
    });
  }, [endStoryMode, revealContent, typeText, runStatCountForReveal, showContinueButton]);

  const advanceStory = useCallback(() => {
    if (!isActive) return;
    if (isTyping) { finishTyping(); return; }
    
    const nextIndex = currentBeatIndex.current + 1;
    currentBeatIndex.current = nextIndex;
    
    const beats = STORY_BEATS[currentKey];
    if (nextIndex >= (beats?.length ?? 0)) {
      endStoryMode();
    } else {
      showBeat(currentKey, nextIndex);
    }
  }, [isActive, isTyping, finishTyping, currentKey, endStoryMode, showBeat]);

  const showBeatRef = useRef(showBeat);
  showBeatRef.current = showBeat;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  useEffect(() => {
    (window as any).__resetStoryLoop = () => {
      finishedKeys.current = {};
      setIsActive(false);
      setCurrentKey('');
      document.querySelectorAll('.story-reveal.is-revealed').forEach(el => {
        el.classList.remove('is-revealed');
      });
    };

    (window as any).__startStoryMode = (key: string, sectionIndex: number): boolean => {
      if (isActiveRef.current || finishedKeys.current[key]) return false;
      const beats = STORY_BEATS[key];
      if (!beats?.length) return false;

      setIsActive(true);
      setCurrentKey(key);
      currentBeatIndex.current = 0;
      setIsNegative(false);

      if ((window as any).__lockScroll) (window as any).__lockScroll(sectionIndex);
      document.getElementById('scrollIndicator')?.classList.remove('is-visible');

      showBeatRef.current(key, 0);
      return true;
    };

    return () => {
      delete (window as any).__startStoryMode;
      delete (window as any).__resetStoryLoop;
    };
  }, []);

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (!isActive) return;
      const blocked = [' ', 'Spacebar', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp'];
      if (blocked.includes(e.key) && document.activeElement !== buttonRef.current) e.preventDefault();
    };
    window.addEventListener('keydown', onKeydown, { passive: false });
    return () => window.removeEventListener('keydown', onKeydown);
  }, [isActive]);

  useEffect(() => {
    if (showContinue && isAutoMode && isActive) {
      autoAdvanceTimer.current = window.setTimeout(() => {
        advanceStory();
      }, AUTO_DELAY);
    }
    return () => clearTimeout(autoAdvanceTimer.current);
  }, [showContinue, isAutoMode, isActive, advanceStory]);

  const handleAutoToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAutoMode(!isAutoMode);
    if (!isAutoMode && showContinue) {
      advanceStory();
    }
  };

  const handleContinue = (e: React.MouseEvent) => {
    e.stopPropagation();
    advanceStory();
  };

  const handlePanelClick = () => {
    if (isActive) advanceStory();
  };

  return (
    <div className={`story-ui ${isActive ? 'is-active' : ''}`} id="storyUI">
      <div className={`story-panel ${isNegative ? 'is-negative-active' : ''}`} onClick={handlePanelClick}>
        <div className="story-avatar" aria-hidden="true">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            width={36}
            height={36}
          >
            <source src="/soulzinho-animacao-ofical-tela-inicial.webm" type="video/webm" />
            <track kind="captions" src="/tracks/silent.vtt" srclang="pt" label="Português" />
          </video>
        </div>

        <p className={`story-text ${isComment ? 'is-comment' : ''}`} aria-hidden="true">
          <span>{typedText}</span>
          <span className={`story-caret ${isTyping ? 'is-visible' : ''}`} />
        </p>
        <span className="sr-only" aria-live="polite">{screenReaderText}</span>
        <div className={`story-controls ${showContinue ? 'is-visible' : ''}`}>
          <button
            className={`story-auto-btn ${isAutoMode ? 'is-active' : ''}`}
            type="button"
            aria-pressed={isAutoMode}
            aria-label="Avanço Automático"
            onClick={handleAutoToggle}
          >
            auto
          </button>
          <button
            ref={buttonRef}
            className="story-continue-btn"
            type="button"
            aria-label="Continuar a história"
            onClick={handleContinue}
          >
            continuar →
          </button>
        </div>
      </div>
    </div>
  );
}