/**
 * Timeline — Right-side vertical navigation dots
 */

import { SECTIONS, C } from './discoveryData';

interface TimelineProps {
  current: number;
  answers: Record<number, string>;
  onNavigate: (idx: number) => void;
}

export function Timeline({ current, answers, onNavigate }: TimelineProps) {
  return (
    <nav
      className="discovery-timeline"
      aria-label="Section navigation timeline"
      style={{
        position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 50,
      }}
    >
      {SECTIONS.map((s, i) => {
        const isActive = i === current;
        const hasAnswer = (answers[s.id]?.trim().length ?? 0) > 0;
        const isCatStart = i === 0 || s.cat !== SECTIONS[i - 1].cat;

        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {isCatStart && i > 0 && <div style={{ height: 5 }} />}
            <button
              onClick={() => onNavigate(i)}
              aria-label={`Section ${s.id}: ${s.title}${hasAnswer ? ' (completed)' : ''}`}
              aria-current={isActive ? 'step' : undefined}
              className="discovery-btn"
              style={{
                width: isActive ? 14 : 8,
                height: isActive ? 14 : 8,
                borderRadius: '50%',
                border: isActive
                  ? `2px solid ${s.accent}`
                  : hasAnswer
                    ? `2px solid ${s.accent}`
                    : `1.5px solid ${C.inputBorder}`,
                background: isActive ? 'transparent' : hasAnswer ? s.accent : C.pageBg,
                padding: 0,
                margin: '2.5px 0',
                transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
                boxShadow: isActive ? `0 0 10px ${s.accent}55` : 'none',
              }}
            />
            {i < SECTIONS.length - 1 && (
              <div
                aria-hidden="true"
                style={{ width: 1, height: isCatStart && i > 0 ? 2 : 4, background: C.divider }}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
