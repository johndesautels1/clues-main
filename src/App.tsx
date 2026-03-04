/**
 * CLUES Intelligence - Main Module App
 * Clues Intelligence LTD
 *
 * Route structure:
 *  /                → Dashboard (globe, paragraphical button, modules)
 *  /login           → Login / Sign-up / Forgot password
 *  /paragraphical   → 24-paragraph input flow
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
import { ParagraphicalFlow } from './components/Paragraphical/ParagraphicalFlow';
import { LoginPage } from './components/Auth/LoginPage';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';

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

            {/* Paragraphical — accessible without login */}
            <Route
              path="/paragraphical"
              element={
                <ProtectedRoute allowAnonymous>
                  <ParagraphicalFlow />
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
