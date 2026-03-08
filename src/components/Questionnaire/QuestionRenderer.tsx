/**
 * QuestionRenderer — Renders the correct input control for any question type.
 * Maps the question's `type` string to the appropriate UI widget:
 *   Likert-* → labeled radio group (1-5)
 *   Dealbreaker → red-gradient radio group (1-5)
 *   Single-select → radio group (parsed from question text)
 *   Multi-select → checkbox group (parsed from question text)
 *   Yes/No → toggle buttons
 *   Slider → continuous slider 0-100
 *   Range → dual-handle range slider
 *   Ranking → drag-to-reorder list
 *   Open-text / Text → textarea
 */

import { useState, useCallback, useRef } from 'react';
import { RESPONSE_TYPES } from '../../data/questions/meta';
import { classifyResponseType, type AnswerValue } from '../../types/questionnaire';
import type { QuestionItem } from '../../data/questions/types';

interface QuestionRendererProps {
  question: QuestionItem;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

export function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  const rendererType = classifyResponseType(question.type);
  const meta = RESPONSE_TYPES[question.type];

  switch (rendererType) {
    case 'likert':
    case 'dealbreaker':
      return (
        <LikertInput
          labels={meta?.labels || ['1', '2', '3', '4', '5']}
          value={value?.type === 'likert' ? value.scale : undefined}
          onChange={(scale, label) => onChange({ type: 'likert', scale, label })}
          isDealbreaker={rendererType === 'dealbreaker'}
        />
      );

    case 'single-select':
      return (
        <SingleSelectInput
          question={question.question}
          value={value?.type === 'single-select' ? value.selected : undefined}
          onChange={(selected) => onChange({ type: 'single-select', selected })}
        />
      );

    case 'multi-select':
      return (
        <MultiSelectInput
          question={question.question}
          value={value?.type === 'multi-select' ? value.selected : []}
          onChange={(selected) => onChange({ type: 'multi-select', selected })}
        />
      );

    case 'yes-no':
      return (
        <YesNoInput
          value={value?.type === 'yes-no' ? value.value : undefined}
          onChange={(v) => onChange({ type: 'yes-no', value: v })}
        />
      );

    case 'slider':
      return (
        <SliderInput
          value={value?.type === 'slider' ? value.value : 50}
          onChange={(v) => onChange({ type: 'slider', value: v })}
        />
      );

    case 'range':
      return (
        <RangeInput
          value={value?.type === 'range' ? value : { type: 'range', min: 20, max: 80 }}
          onChange={(min, max) => onChange({ type: 'range', min, max })}
        />
      );

    case 'ranking':
      return (
        <RankingInput
          question={question.question}
          value={value?.type === 'ranking' ? value.order : undefined}
          onChange={(order) => onChange({ type: 'ranking', order })}
        />
      );

    case 'text':
      return (
        <TextInput
          value={value?.type === 'text' ? value.value : ''}
          onChange={(v) => onChange({ type: 'text', value: v })}
        />
      );
  }
}

// ─── LIKERT (1-5 scale with labels) ──────────────────────────────

function LikertInput({
  labels,
  value,
  onChange,
  isDealbreaker,
}: {
  labels: string[];
  value: number | undefined;
  onChange: (scale: number, label: string) => void;
  isDealbreaker: boolean;
}) {
  return (
    <div className="qr-likert" role="radiogroup" aria-label="Rating scale">
      {labels.map((label, i) => {
        const scale = i + 1;
        const isSelected = value === scale;
        const colorClass = isDealbreaker
          ? `qr-likert-deal-${scale}`
          : `qr-likert-level-${scale}`;

        return (
          <button
            key={scale}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`qr-likert-option ${colorClass} ${isSelected ? 'qr-likert-selected' : ''}`}
            onClick={() => onChange(scale, label)}
          >
            <span className="qr-likert-number">{scale}</span>
            <span className="qr-likert-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── SINGLE SELECT (radio from question options) ─────────────────

function extractOptions(questionText: string): string[] {
  // Extracts options from patterns like "(Select one: option1, option2, option3)"
  // or "Select all that apply: option1, option2, option3)"
  const parenMatch = questionText.match(/\((?:Select (?:one|all that apply)[:\s]*)?([^)]+)\)/i);
  if (parenMatch) {
    return parenMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  }
  // Fallback: look for colon-separated options at end
  const colonMatch = questionText.match(/:\s*([^?]+)$/);
  if (colonMatch) {
    return colonMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function SingleSelectInput({
  question,
  value,
  onChange,
}: {
  question: string;
  value: string | undefined;
  onChange: (selected: string) => void;
}) {
  const options = extractOptions(question);

  if (options.length === 0) {
    return (
      <TextInput
        value={value || ''}
        onChange={(v) => onChange(v)}
        placeholder="Type your answer..."
      />
    );
  }

  return (
    <div className="qr-options" role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={value === opt}
          className={`qr-option ${value === opt ? 'qr-option-selected' : ''}`}
          onClick={() => onChange(opt)}
        >
          <span className="qr-option-radio">{value === opt ? '◉' : '○'}</span>
          <span className="qr-option-text">{opt}</span>
        </button>
      ))}
    </div>
  );
}

// ─── MULTI SELECT (checkboxes) ───────────────────────────────────

function MultiSelectInput({
  question,
  value,
  onChange,
}: {
  question: string;
  value: string[];
  onChange: (selected: string[]) => void;
}) {
  const options = extractOptions(question);

  const toggle = useCallback(
    (opt: string) => {
      onChange(
        value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]
      );
    },
    [value, onChange]
  );

  if (options.length === 0) {
    return (
      <TextInput
        value={value.join(', ')}
        onChange={(v) => onChange(v.split(',').map(s => s.trim()).filter(Boolean))}
        placeholder="Enter options separated by commas..."
      />
    );
  }

  return (
    <div className="qr-options" role="group" aria-label="Select all that apply">
      {options.map((opt) => {
        const checked = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            role="checkbox"
            aria-checked={checked}
            className={`qr-option ${checked ? 'qr-option-selected' : ''}`}
            onClick={() => toggle(opt)}
          >
            <span className="qr-option-check">{checked ? '☑' : '☐'}</span>
            <span className="qr-option-text">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── YES / NO ────────────────────────────────────────────────────

function YesNoInput({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="qr-yesno" role="radiogroup" aria-label="Yes or No">
      <button
        type="button"
        role="radio"
        aria-checked={value === true}
        className={`qr-yesno-btn ${value === true ? 'qr-yesno-yes' : ''}`}
        onClick={() => onChange(true)}
      >
        Yes
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === false}
        className={`qr-yesno-btn ${value === false ? 'qr-yesno-no' : ''}`}
        onClick={() => onChange(false)}
      >
        No
      </button>
    </div>
  );
}

// ─── SLIDER (0-100) ─────────────────────────────────────────────

function SliderInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="qr-slider">
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="qr-slider-input"
        aria-label="Value slider"
      />
      <div className="qr-slider-value">{value}</div>
    </div>
  );
}

// ─── RANGE (min/max) ─────────────────────────────────────────────

function RangeInput({
  value,
  onChange,
}: {
  value: { min: number; max: number };
  onChange: (min: number, max: number) => void;
}) {
  return (
    <div className="qr-range">
      <label className="qr-range-label">
        <span>Min</span>
        <input
          type="number"
          value={value.min}
          onChange={(e) => onChange(Number(e.target.value), value.max)}
          className="qr-range-input"
        />
      </label>
      <span className="qr-range-sep">to</span>
      <label className="qr-range-label">
        <span>Max</span>
        <input
          type="number"
          value={value.max}
          onChange={(e) => onChange(value.min, Number(e.target.value))}
          className="qr-range-input"
        />
      </label>
    </div>
  );
}

// ─── RANKING (drag-to-reorder) ───────────────────────────────────

function RankingInput({
  question,
  value,
  onChange,
}: {
  question: string;
  value: string[] | undefined;
  onChange: (order: string[]) => void;
}) {
  const items = extractOptions(question);
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

  // Move item up/down for keyboard accessibility
  const moveItem = useCallback((index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= order.length) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setOrder(newOrder);
    onChange(newOrder);
  }, [order, onChange]);

  if (items.length === 0) {
    return (
      <TextInput
        value={value?.join(', ') || ''}
        onChange={(v) => onChange(v.split(',').map(s => s.trim()).filter(Boolean))}
        placeholder="Enter items to rank, separated by commas..."
      />
    );
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
        >
          <span className="qr-ranking-num">{i + 1}</span>
          <span className="qr-ranking-text">{item}</span>
          <span className="qr-ranking-controls">
            <button
              type="button"
              onClick={() => moveItem(i, -1)}
              disabled={i === 0}
              aria-label={`Move ${item} up`}
              className="qr-ranking-btn"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => moveItem(i, 1)}
              disabled={i === order.length - 1}
              aria-label={`Move ${item} down`}
              className="qr-ranking-btn"
            >
              ▼
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── TEXT (textarea) ─────────────────────────────────────────────

function TextInput({
  value,
  onChange,
  placeholder = 'Share your thoughts...',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className="qr-textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
    />
  );
}
