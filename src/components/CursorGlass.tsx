'use client';

import { useEffect, useRef } from 'react';

export default function CursorGlass() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursorGlass = cursorRef.current;
    if (!cursorGlass) return;

    const canCustomCursor = window.matchMedia('(pointer: fine)').matches;
    if (!canCustomCursor) return;

    const pointer = { x: -9999, y: -9999, active: false };
    let cursorRafId = 0;

    const moveCursor = () => {
      cursorGlass.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
      cursorRafId = requestAnimationFrame(moveCursor);
    };
    cursorRafId = requestAnimationFrame(moveCursor);

    const onMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!pointer.active) {
        pointer.active = true;
        cursorGlass.classList.add('is-visible');
      }
    };
    const onLeave = () => {
      pointer.active = false;
      cursorGlass.classList.remove('is-visible');
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(cursorRafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      className="cursor-glass is-negative"
      id="cursorGlass"
      ref={cursorRef}
      aria-hidden="true"
    />
  );
}
