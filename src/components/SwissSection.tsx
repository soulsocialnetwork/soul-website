import type { ReactNode } from 'react';

interface SwissSectionProps {
  id: string;
  canvasId: string;
  theme?: 'light' | 'negative';
  isFooter?: boolean;
  children: ReactNode;
  canvasColor?: (a: number) => string;
}

export default function SwissSection({ 
  id, 
  canvasId, 
  theme = 'light',
  isFooter = false,
  children 
}: SwissSectionProps) {
  return (
    <section
      className={`next-section ${theme === 'negative' ? 'section-negative' : ''}`}
      id={id}
    >
      <canvas className="next-starfield" id={canvasId} aria-hidden="true"></canvas>
      <div className={`swiss-body ${isFooter ? 'swiss-footer-body' : ''} ${id === 'nextSection' ? 'first-section' : ''}`}>
        {children}
      </div>
    </section>
  );
}