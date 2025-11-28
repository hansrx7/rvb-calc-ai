// src/App.tsx

import { ChatContainer } from './components/chat/ChatContainer';
import AuroraBackground from './components/layout/AuroraBackground';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <AuroraBackground />
        <ChatContainer />
      </div>
    </ErrorBoundary>
  );
}

export default App;