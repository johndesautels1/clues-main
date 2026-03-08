/**
 * QuestionRenderer — Single-card view input controls for all question types.
 * Designed for mobile-first one-question-at-a-time flow.
 * WCAG 2.1 AA compliant (all colors verified against #0a0e1a).
 *
 * Response types handled:
 *   Likert-*     → 5-button horizontal scale with labels
 *   Dealbreaker  → 5-button red gradient scale
 *   Single-select → vertical radio list (options parsed from question text)
 *   Multi-select  → vertical checkbox list
 *   Yes/No       → large toggle buttons
 *   Slider       → continuous 0-100 with live value
 *   Range        → min/max number inputs
 *   Ranking      → drag-to-reorder list with keyboard controls
 *   Text/Open-text → textarea
 */

import { useState, useCallback, useRef } from 'react';
import { RESPONSE_TYPES } from '../../data/questions/meta';
import { COUNTRIES } from '../../data/countries';
import {
  extractInlineOptions,
  C,
} from './questionnaireData';
import type { QuestionItem } from '../../data/questions/types';

/** Detect if a question is about countries (citizenship, residence, etc.) */
function isCountryQuestion(questionText: string): boolean {
  const q = questionText.toLowerCase();
  return (
    (q.includes('citizenship') || q.includes('country of residence') || q.includes('nationality')) &&
    (q.includes('select one') || q.includes('select all'))
  );
}

interface QuestionRendererProps {
  question: QuestionItem;
  value: string | number | boolean | string[] | undefined;
  onChange: (value: string | number | boolean | string[]) => void;
  accent: string;
}

export function QuestionRenderer({ question, value, onChange, accent }: QuestionRendererProps) {
  const type = question.type;
  const meta = RESPONSE_TYPES[type];

  // Likert-* or Dealbreaker (1-5 scale with labels)
  if (type.startsWith('Likert-') || type === 'Dealbreaker') {
    const labels = meta?.labels || ['1', '2', '3', '4', '5'];
    const isDealbreaker = type === 'Dealbreaker';
    const selectedIdx = typeof value === 'number' ? value - 1 : -1;

    return (
      <div className="qr-scale" role="radiogroup" aria-label="Rating scale">
        {labels.map((label, i) => {
          const isSelected = selectedIdx === i;
          const scaleVal = i + 1;
          let btnBg: string;
          let btnBorder: string;
          let btnColor: string;

          if (isDealbreaker) {
            const reds = ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444'];
            btnBg = isSelected ? `${reds[i]}cc` : `${reds[i]}18`;
            btnBorder = isSelected ? reds[i] : `${reds[i]}44`;
            btnColor = isSelected ? '#fecaca' : '#f87171';
          } else {
            btnBg = isSelected ? `${accent}22` : 'rgba(255,255,255,0.03)';
            btnBorder = isSelected ? accent : C.divider;
            btnColor = isSelected ? accent : C.textSecondary;
          }

          return (
            <button
              key={scaleVal}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${scaleVal}: ${label}`}
              className="qr-scale-btn"
              onClick={() => onChange(scaleVal)}
              style={{
                background: btnBg,
                borderColor: btnBorder,
                color: btnColor,
                boxShadow: isSelected ? `0 0 12px ${isDealbreaker ? '#ef444433' : accent + '22'}` : 'none',
              }}
            >
              <span className="qr-scale-num">{scaleVal}</span>
              <span className="qr-scale-label">{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Single-select (radio list or dropdown for many options)
  if (type === 'Single-select') {
    // Use full COUNTRIES list for country-type questions
    const useCountries = isCountryQuestion(question.question);
    const options = useCountries ? COUNTRIES : extractInlineOptions(question.question);

    if (options.length === 0) {
      return <TextInput value={String(value || '')} onChange={(v) => onChange(v)} accent={accent} placeholder="Type your answer..." />;
    }

    // Use dropdown for 8+ options (better UX for long lists like countries, income)
    if (options.length >= 8) {
      return (
        <div className="qr-dropdown">
          <select
            className="qr-dropdown-select"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Select one"
            style={{ '--accent': accent, borderColor: value ? accent : C.inputBorder } as React.CSSProperties}
          >
            <option value="">{useCountries ? '— Select a country —' : '— Select an option —'}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="qr-options" role="radiogroup" aria-label="Select one">
        {options.map((opt) => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className="qr-option-btn"
              onClick={() => onChange(opt)}
              style={{
                background: isSelected ? `${accent}15` : 'rgba(255,255,255,0.03)',
                borderColor: isSelected ? accent : C.divider,
              }}
            >
              <span className="qr-radio-dot" style={{
                borderColor: isSelected ? accent : C.textMuted,
                background: isSelected ? accent : 'transparent',
              }} />
              <span style={{ color: isSelected ? C.textPrimary : C.textSecondary }}>{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Multi-select (checkbox list)
  if (type === 'Multi-select') {
    const useCountries = isCountryQuestion(question.question);
    const options = useCountries ? COUNTRIES : extractInlineOptions(question.question);
    const selected = Array.isArray(value) ? value : [];

    if (options.length === 0) {
      return <TextInput value={selected.join(', ')} onChange={(v) => onChange(v.split(',').map(s => s.trim()).filter(Boolean))} accent={accent} placeholder="Enter options separated by commas..." />;
    }

    // For very long lists (countries), use searchable multi-select
    if (options.length > 30) {
      return (
        <SearchableMultiSelect
          options={options}
          selected={selected}
          onChange={(next) => onChange(next)}
          accent={accent}
          placeholder={useCountries ? 'Search countries...' : 'Search options...'}
        />
      );
    }

    const toggle = (opt: string) => {
      const next = selected.includes(opt)
        ? selected.filter(s => s !== opt)
        : [...selected, opt];
      onChange(next);
    };

    return (
      <div className="qr-options" role="group" aria-label="Select all that apply">
        {options.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              role="checkbox"
              aria-checked={checked}
              className="qr-option-btn"
              onClick={() => toggle(opt)}
              style={{
                background: checked ? `${accent}15` : 'rgba(255,255,255,0.03)',
                borderColor: checked ? accent : C.divider,
              }}
            >
              <span className="qr-check-box" style={{
                borderColor: checked ? accent : C.textMuted,
                background: checked ? accent : 'transparent',
              }}>
                {checked && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#0a0e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </span>
              <span style={{ color: checked ? C.textPrimary : C.textSecondary }}>{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Yes/No
  if (type === 'Yes/No') {
    const boolVal = value === true || value === 'true' ? true : value === false || value === 'false' ? false : undefined;
    return (
      <div className="qr-yesno" role="radiogroup" aria-label="Yes or No">
        {([true, false] as const).map((v) => {
          const isSelected = boolVal === v;
          const label = v ? 'Yes' : 'No';
          const color = v ? '#22c55e' : '#ef4444';
          return (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className="qr-yesno-btn"
              onClick={() => onChange(v)}
              style={{
                background: isSelected ? `${color}18` : 'rgba(255,255,255,0.03)',
                borderColor: isSelected ? color : C.divider,
                color: isSelected ? color : C.textSecondary,
              }}
            >
              <span className="qr-yesno-icon">{v ? '\u2713' : '\u2715'}</span>
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  // Slider (0-100)
  if (type === 'Slider') {
    const numVal = typeof value === 'number' ? value : 50;
    return (
      <div className="qr-slider">
        <div className="qr-slider-labels">
          <span style={{ color: C.textMuted }}>Strongly disagree</span>
          <span style={{ color: accent, fontWeight: 600, fontSize: '1.25rem' }}>{numVal}</span>
          <span style={{ color: C.textMuted }}>Strongly agree</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={numVal}
          onChange={(e) => onChange(Number(e.target.value))}
          className="qr-slider-input"
          aria-label="Value slider"
          style={{
            '--accent': accent,
            '--pct': `${numVal}%`,
          } as React.CSSProperties}
        />
        <div className="qr-slider-track-labels">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>
    );
  }

  // Range (min/max numeric)
  if (type === 'Range') {
    const strVal = String(value || '');
    return <TextInput value={strVal} onChange={(v) => onChange(v)} accent={accent} placeholder="Enter a value or range..." />;
  }

  // Ranking (drag-to-reorder)
  if (type === 'Ranking') {
    return <RankingInput question={question.question} value={Array.isArray(value) ? value : undefined} onChange={onChange} accent={accent} />;
  }

  // Text / Open-text
  return <TextInput value={String(value || '')} onChange={(v) => onChange(v)} accent={accent} />;
}

// ─── TEXT INPUT ───────────────────────────────────────────────────

function TextInput({
  value,
  onChange,
  accent,
  placeholder = 'Share your thoughts...',
}: {
  value: string;
  onChange: (v: string) => void;
  accent: string;
  placeholder?: string;
}) {
  return (
    <textarea
      className="qr-textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      style={{
        borderColor: value ? accent : C.inputBorder,
        boxShadow: value ? `0 0 0 1px ${accent}22` : 'none',
      }}
    />
  );
}

// ─── RANKING INPUT ───────────────────────────────────────────────

function RankingInput({
  question,
  value,
  onChange,
  accent,
}: {
  question: string;
  value: string[] | undefined;
  onChange: (v: string[]) => void;
  accent: string;
}) {
  const items = extractInlineOptions(question);
  const [order, setOrder] = useState<string[]>(value || items);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    dragOver.current = index;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current === null || dragOver.current === null) return;
    const newOrder = [...order];
    const [dragged] = newOrder.splice(dragItem.current, 1);
    newOrder.splice(dragOver.current, 0, dragged);
    setOrder(newOrder);
    onChange(newOrder);
    dragItem.current = null;
    dragOver.current = null;
  }, [order, onChange]);

  const moveItem = useCallback((index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= order.length) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setOrder(newOrder);
    onChange(newOrder);
  }, [order, onChange]);

  if (items.length === 0) {
    return <TextInput value={value?.join(', ') || ''} onChange={(v) => onChange(v.split(',').map(s => s.trim()).filter(Boolean))} accent={accent} placeholder="Enter items to rank, separated by commas..." />;
  }

  return (
    <div className="qr-ranking" role="list" aria-label="Drag to reorder">
      {order.map((item, i) => (
        <div
          key={item}
          className="qr-ranking-item"
          role="listitem"
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragEnter={() => handleDragEnter(i)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
          style={{ borderColor: C.divider }}
        >
          <span className="qr-ranking-num" style={{ color: accent }}>{i + 1}</span>
          <span className="qr-ranking-grip" aria-hidden="true">{'\u2807'}</span>
          <span className="qr-ranking-text">{item}</span>
          <span className="qr-ranking-arrows">
            <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0} aria-label={`Move ${item} up`} className="qr-ranking-arrow">&#9650;</button>
            <button type="button" onClick={() => moveItem(i, 1)} disabled={i === order.length - 1} aria-label={`Move ${item} down`} className="qr-ranking-arrow">&#9660;</button>
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── SEARCHABLE MULTI-SELECT (for countries and long lists) ─────

function SearchableMultiSelect({
  options,
  selected,
  onChange,
  accent,
  placeholder = 'Search...',
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  accent: string;
  placeholder?: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (opt: string) => {
    const next = selected.includes(opt)
      ? selected.filter(s => s !== opt)
      : [...selected, opt];
    onChange(next);
  };

  return (
    <div className="qr-searchable-multi">
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="qr-sm-tags">
          {selected.map(s => (
            <span key={s} className="qr-sm-tag" style={{ borderColor: accent, color: accent }}>
              {s}
              <button
                type="button"
                className="qr-sm-tag-remove"
                onClick={() => toggle(s)}
                aria-label={`Remove ${s}`}
                style={{ color: accent }}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <input
        type="text"
        className="qr-sm-search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={placeholder}
        aria-label="Search options"
        style={{ borderColor: search ? accent : C.inputBorder }}
      />

      {/* Options list (scrollable) */}
      <div className="qr-sm-list" role="group" aria-label="Select all that apply">
        {filtered.length === 0 && (
          <div className="qr-sm-empty" style={{ color: C.textMuted }}>No matches found</div>
        )}
        {filtered.map(opt => {
          const checked = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              role="checkbox"
              aria-checked={checked}
              className="qr-sm-option"
              onClick={() => toggle(opt)}
              style={{
                background: checked ? `${accent}15` : 'transparent',
                borderColor: checked ? accent : 'transparent',
              }}
            >
              <span className="qr-check-box" style={{
                borderColor: checked ? accent : C.textMuted,
                background: checked ? accent : 'transparent',
                width: '18px', height: '18px', borderRadius: '4px', border: '2px solid',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {checked && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#0a0e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </span>
              <span style={{ color: checked ? C.textPrimary : C.textSecondary }}>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
