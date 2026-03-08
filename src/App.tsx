/**
 * CLUES Intelligence - Main Module App
 * Clues Intelligence LTD
 *
 * Route structure:
 *  /                → Dashboard (globe, paragraphical button, modules)
 *  /login           → Login / Sign-up / Forgot password
 *  /paragraphical   → 30-paragraph input flow
 *  /questionnaire/* → Demographics, DNW, MH, General questions
 *  /results         → Evaluation results (future)
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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
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
            {/* Admin — Question Library Dashboard */}
            <Route
              path="/admin/questions"
              element={
                <ProtectedRoute allowAnonymous>
                  <QuestionLibrary />
                </ProtectedRoute>
              }
            />
          </Routes>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
