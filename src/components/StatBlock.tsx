import type { ReactNode } from 'react';

interface Stat {
  target: string;
  format?: 'hm' | 'suffix' | 'plain';
  suffix?: string;
  label: string;
  startLabel: string;
}

interface StatBlockProps {
  revealKey: string;
  stats: Stat[];
  singleColumn?: boolean;
}

export default function StatBlock({ revealKey, stats, singleColumn }: StatBlockProps) {
  const style = singleColumn ? { gridTemplateColumns: '1fr', maxWidth: '340px' } : undefined;

  return (
    <div className="swiss-stats-grid story-reveal" data-story-reveal={revealKey} style={style}>
      {stats.map((stat, idx) => (
        <div key={idx} className="swiss-stat-item">
          <span 
            className="swiss-stat-num" 
            data-count-format={stat.format} 
            data-count-target={stat.target}
            data-count-suffix={stat.suffix}
          >
            {stat.startLabel}
          </span>
          <span className="swiss-stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
