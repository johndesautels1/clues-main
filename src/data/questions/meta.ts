import type { ResponseTypeMeta } from './types';

// CLUES Question Library — Metadata and response type definitions
// Split from questionLibrary.ts

export const LIBRARY_META = {
  project: "CLUES Intelligence",
  description: "All review module questions with structured response types for UI modal design",
  totalModules: 26,
  totalQuestions: 2500,
  moduleStructure: "23 category modules × 100 questions each (10 sections × 10 questions) + Main Module (100Q: 34 Demographics + 33 DNW + 33 Must Haves) + General Questions (50Q) + Trade-off Questions (50Q) = 2,500 total questions",
  brand: {
  "darkBackground": "#0a0e1a",
  "cardBackground": "#111827",
  "goldAccent": "#C4A87A",
  "sapphireAccent": "#3b82f6",
  "textPrimary": "#f9fafb",
  "textSecondary": "#9ca3af",
  "textMuted": "#8b95a5",
  "orangeAccent": "#f97316"
},
} as const;

export const RESPONSE_TYPES: Record<string, ResponseTypeMeta> = {
  "Likert-Importance": {
    "scale": "1-5",
    "labels": [
      "Not Important",
      "Slightly Important",
      "Moderately Important",
      "Very Important",
      "Essential"
    ],
    "component": "RadioGroup or StarRating"
  },
  "Likert-Concern": {
    "scale": "1-5",
    "labels": [
      "Not Concerned",
      "Slightly Concerned",
      "Moderately Concerned",
      "Very Concerned",
      "Extremely Concerned"
    ],
    "component": "RadioGroup"
  },
  "Likert-Comfort": {
    "scale": "1-5",
    "labels": [
      "Very Uncomfortable",
      "Uncomfortable",
      "Neutral",
      "Comfortable",
      "Very Comfortable"
    ],
    "component": "RadioGroup"
  },
  "Likert-Willingness": {
    "scale": "1-5",
    "labels": [
      "Not Willing",
      "Slightly Willing",
      "Moderately Willing",
      "Very Willing",
      "Completely Willing"
    ],
    "component": "RadioGroup"
  },
  "Likert-Frequency": {
    "scale": "1-5",
    "labels": [
      "Never",
      "Rarely",
      "Sometimes",
      "Often",
      "Very Frequently"
    ],
    "component": "RadioGroup"
  },
  "Likert-Satisfaction": {
    "scale": "1-5",
    "labels": [
      "Very Dissatisfied",
      "Dissatisfied",
      "Neutral",
      "Satisfied",
      "Very Satisfied"
    ],
    "component": "RadioGroup"
  },
  "Likert-Agreement": {
    "scale": "1-5",
    "labels": [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree"
    ],
    "component": "RadioGroup"
  },
  "Multi-select": {
    "description": "Checkbox list, multiple selections allowed",
    "component": "CheckboxGroup"
  },
  "Single-select": {
    "description": "Radio button list, one selection only",
    "component": "RadioGroup"
  },
  "Yes/No": {
    "description": "Binary toggle",
    "component": "Toggle or RadioGroup"
  },
  "Range": {
    "description": "Numeric range slider with min/max",
    "component": "RangeSlider"
  },
  "Slider": {
    "description": "Continuous slider 0-100 or contextual scale",
    "component": "Slider"
  },
  "Ranking": {
    "description": "Drag-to-reorder list of 5-10 items",
    "component": "DragToRank"
  },
  "Dealbreaker": {
    "scale": "1-5",
    "labels": [
      "Mild Preference to Avoid",
      "Would Rather Avoid",
      "Significant Concern",
      "Strong Aversion",
      "Absolute Deal-Breaker"
    ],
    "component": "RadioGroup with red gradient"
  },
  "Open-text": {
    "description": "Free text input, multi-line",
    "component": "Textarea"
  },
  "Text": {
    "description": "Free text input, multi-line",
    "component": "Textarea"
  }
};
