/**
 * User Context
 * Centralized state management for the entire CLUES session.
 * Uses useReducer for predictable state transitions.
 * Persists to Supabase (primary) + localStorage (fallback) via useSessionPersistence.
 *
 * Globe selection is denormalized in Supabase so the evaluation pipeline can
 * query by region without parsing JSONB — dramatically reducing LLM token usage.
 */

import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type Dispatch,
} from 'react';
import { useAuth } from './AuthContext';
import { useSessionPersistence } from '../hooks/useSessionPersistence';
import type {
  UserSession,
  GlobeSelection,
  ParagraphEntry,
  ModuleStatus,
  SubSectionStatus,
  CompletionTier,
  GeminiExtraction,
  DemographicAnswers,
  DNWAnswers,
  MHAnswers,
  TradeoffAnswers,
  GeneralAnswers,
  EvaluationResult,
} from '../types';

// ─── Actions ─────────────────────────────────────────────────────
type Action =
  | { type: 'SET_GLOBE'; payload: GlobeSelection }
  | { type: 'CLEAR_GLOBE' }
  | { type: 'SET_PARAGRAPHICAL_STATUS'; payload: ModuleStatus }
  | { type: 'UPDATE_PARAGRAPH'; payload: ParagraphEntry }
  | { type: 'SET_EXTRACTION'; payload: GeminiExtraction }
  | { type: 'SET_SUBSECTION_STATUS'; payload: { section: keyof SubSectionStatus; status: ModuleStatus } }
  | { type: 'SET_DEMOGRAPHICS'; payload: DemographicAnswers }
  | { type: 'SET_DNW'; payload: DNWAnswers }
  | { type: 'SET_MH'; payload: MHAnswers }
  | { type: 'SET_TRADEOFFS'; payload: TradeoffAnswers }
  | { type: 'SET_GENERAL_ANSWERS'; payload: GeneralAnswers }
  | { type: 'COMPLETE_MODULE'; payload: string }
  | { type: 'SET_EVALUATION'; payload: EvaluationResult }
  | { type: 'SET_TIER'; payload: { tier: CompletionTier; confidence: number } }
  | { type: 'SET_USER'; payload: { userId: string; email: string } }
  | { type: 'LOAD_SESSION'; payload: UserSession }
  | { type: 'RESET' };

// ─── Initial State ───────────────────────────────────────────────
const INITIAL_STATE: UserSession = {
  id: crypto.randomUUID(),
  globe: null,
  paragraphical: {
    status: 'not_started',
    paragraphs: [],
  },
  mainModule: {
    subSectionStatus: {
      demographics: 'not_started',
      dnw: 'locked',
      mh: 'locked',
      general: 'locked',
      tradeoffs: 'locked',
    },
  },
  completedModules: [],
  currentTier: 'discovery',
  confidence: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── Reducer ─────────────────────────────────────────────────────
function sessionReducer(state: UserSession, action: Action): UserSession {
  const now = new Date().toISOString();

  switch (action.type) {
    case 'SET_GLOBE':
      return { ...state, globe: action.payload, updatedAt: now };

    case 'CLEAR_GLOBE':
      return { ...state, globe: null, updatedAt: now };

    case 'SET_PARAGRAPHICAL_STATUS':
      return {
        ...state,
        paragraphical: { ...state.paragraphical, status: action.payload },
        updatedAt: now,
      };

    case 'UPDATE_PARAGRAPH': {
      const existing = state.paragraphical.paragraphs;
      const idx = existing.findIndex(p => p.id === action.payload.id);
      const updated = idx >= 0
        ? existing.map((p, i) => i === idx ? action.payload : p)
        : [...existing, action.payload];
      return {
        ...state,
        paragraphical: { ...state.paragraphical, paragraphs: updated },
        updatedAt: now,
      };
    }

    case 'SET_EXTRACTION':
      return {
        ...state,
        paragraphical: { ...state.paragraphical, extraction: action.payload },
        updatedAt: now,
      };

    case 'SET_SUBSECTION_STATUS':
      return {
        ...state,
        mainModule: {
          ...state.mainModule,
          subSectionStatus: {
            ...state.mainModule.subSectionStatus,
            [action.payload.section]: action.payload.status,
          },
        },
        updatedAt: now,
      };

    case 'SET_DEMOGRAPHICS':
      return {
        ...state,
        mainModule: { ...state.mainModule, demographics: action.payload },
        updatedAt: now,
      };

    case 'SET_DNW':
      return {
        ...state,
        mainModule: { ...state.mainModule, dnw: action.payload },
        updatedAt: now,
      };

    case 'SET_MH':
      return {
        ...state,
        mainModule: { ...state.mainModule, mh: action.payload },
        updatedAt: now,
      };

    case 'SET_TRADEOFFS':
      return {
        ...state,
        mainModule: { ...state.mainModule, tradeoffAnswers: action.payload },
        updatedAt: now,
      };

    case 'SET_GENERAL_ANSWERS':
      return {
        ...state,
        mainModule: { ...state.mainModule, generalAnswers: action.payload },
        updatedAt: now,
      };

    case 'COMPLETE_MODULE':
      if (state.completedModules.includes(action.payload)) return state;
      return {
        ...state,
        completedModules: [...state.completedModules, action.payload],
        updatedAt: now,
      };

    case 'SET_EVALUATION':
      return { ...state, evaluation: action.payload, updatedAt: now };

    case 'SET_TIER':
      return {
        ...state,
        currentTier: action.payload.tier,
        confidence: action.payload.confidence,
        updatedAt: now,
      };

    case 'SET_USER':
      return {
        ...state,
        userId: action.payload.userId,
        email: action.payload.email,
        updatedAt: now,
      };

    case 'LOAD_SESSION':
      return {
        ...INITIAL_STATE,
        ...action.payload,
        mainModule: {
          ...INITIAL_STATE.mainModule,
          ...action.payload.mainModule,
          subSectionStatus: {
            ...INITIAL_STATE.mainModule.subSectionStatus,
            ...action.payload.mainModule?.subSectionStatus,
          },
        },
        paragraphical: {
          ...INITIAL_STATE.paragraphical,
          ...action.payload.paragraphical,
        },
      };

    case 'RESET':
      return { ...INITIAL_STATE, id: crypto.randomUUID(), createdAt: now, updatedAt: now };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────
interface UserContextValue {
  session: UserSession;
  dispatch: Dispatch<Action>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────
export function UserProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // Callback when a saved session is loaded from Supabase or localStorage
  const handleSessionLoaded = useCallback((loadedSession: UserSession) => {
    dispatch({ type: 'LOAD_SESSION', payload: loadedSession });
    setIsLoading(false);
  }, []);

  // Three-layer persistence: Supabase → localStorage → memory
  useSessionPersistence({
    session,
    onSessionLoaded: handleSessionLoaded,
  });

  // Stamp auth user onto session when they log in
  const { user: authUser } = useAuth();
  useEffect(() => {
    if (authUser && authUser.id !== session.userId) {
      dispatch({
        type: 'SET_USER',
        payload: { userId: authUser.id, email: authUser.email },
      });
    }
  }, [authUser, session.userId]);

  // If no saved session found after 800ms, stop loading anyway
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <UserContext.Provider value={{ session, dispatch, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────
export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within <UserProvider>');
  return ctx;
}
