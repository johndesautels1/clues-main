/**
 * CLUES Intelligence - Main Module App
 * Clues Intelligence LTD
 *
 * Route structure:
 *  /                → Dashboard (globe, paragraphical button, modules)
 *  /paragraphical   → 24-paragraph input flow
 *  /questionnaire/* → Demographics, DNW, MH, General questions
 *  /results         → Evaluation results (future)
 *  /reports         → Report viewer (future)
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ParagraphicalFlow } from './components/Paragraphical/ParagraphicalFlow';

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/paragraphical" element={<ParagraphicalFlow />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
