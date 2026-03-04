/**
 * CLUES Intelligence - Main Module App
 * Clues Intelligence LTD
 */

import { UserProvider } from './context/UserContext';
import { Dashboard } from './components/Dashboard/Dashboard';

function App() {
  return (
    <UserProvider>
      <Dashboard />
    </UserProvider>
  );
}

export default App;
