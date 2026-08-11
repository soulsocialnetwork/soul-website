import type { ReactNode } from 'react';

interface Concept {
  title: string;
  text: string;
}

interface ConceptGridProps {
  revealKey: string;
  concepts: Concept[];
  singleColumn?: boolean;
}

export default function ConceptGrid({ revealKey, concepts, singleColumn }: ConceptGridProps) {
  const style = singleColumn ? { gridTemplateColumns: '1fr', maxWidth: '460px' } : undefined;
  
  return (
    <div className="swiss-concept-grid story-reveal" data-story-reveal={revealKey} style={style}>
      {concepts.map((concept, idx) => (
        <div key={idx} className="swiss-concept-item">
          <span className="swiss-concept-title">{concept.title}</span>
          <p className="swiss-concept-text">{concept.text}</p>
        </div>
      ))}
    </div>
  );
}
