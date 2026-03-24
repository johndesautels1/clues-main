/**
 * CLUES Intelligence - Main Module App
 * Clues Intelligence LTD
 *
 * Route structure:
 *  /                → Dashboard (globe, paragraphical button, modules)
 *  /login           → Login / Sign-up / Forgot password
 *  /paragraphical   → 30-paragraph input flow
 *  /questionnaire/* → Demographics, DNW, MH, General questions
 *  /module/:moduleId → Mini module questionnaire (23 modules × 100 Q)
 *  /results         → Evaluation results (ResultsDashboard)
 *  /reports         → Report viewer (future)
 *
 * Auth wrapping:
 *  AuthProvider sits OUTSIDE UserProvider — auth resolves before session hydration.
 *  Dashboard and Paragraphical allow anonymous access (allowAnonymous).
 *  Data persists to Supabase only when authenticated.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { Dashboard } from './components/Dashboard/Dashboard';
import { DiscoveryFlow } from './components/Discovery';
import { LoginPage } from './components/Auth/LoginPage';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { QuestionLibrary } from './components/Admin/QuestionLibrary';
import { MainQuestionnaire, ModuleLauncher } from './components/Questionnaire';
import { ResultsPage } from './components/Results/ResultsPage';
import { ErrorBoundary } from './components/Shared/ErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <ErrorBoundary>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Dashboard — accessible without login (anonymous OK) */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowAnonymous>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Discovery Questionnaire — 30-paragraph Olivia-enhanced flow */}
            <Route
              path="/paragraphical"
              element={
                <ProtectedRoute allowAnonymous>
                  <DiscoveryFlow />
                </ProtectedRoute>
              }
            />
            {/* Main Module Questionnaire — Demographics, DNW, MH, Trade-offs, General */}
            <Route
              path="/questionnaire"
              element={
                <ProtectedRoute allowAnonymous>
                  <MainQuestionnaire />
                </ProtectedRoute>
              }
            />

            {/* Mini Module Questionnaire — 23 individual modules × 100 questions */}
            <Route
              path="/module/:moduleId"
              element={
                <ProtectedRoute allowAnonymous>
                  <ModuleLauncher />
                </ProtectedRoute>
              }
            />

            {/* Results — Evaluation results with Smart Scores (anonymous OK) */}
            <Route
              path="/results"
              element={
                <ProtectedRoute allowAnonymous>
                  <ResultsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin — Question Library Dashboard (requires authentication) */}
            <Route
              path="/admin/questions"
              element={
                <ProtectedRoute>
                  <QuestionLibrary />
                </ProtectedRoute>
              }
            />

            {/* 404 catch-all */}
            <Route
              path="*"
              element={
                <ProtectedRoute allowAnonymous>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
          </ErrorBoundary>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
