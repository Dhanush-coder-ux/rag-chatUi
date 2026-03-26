import React from 'react';
import { ThemeProvider } from './context/ThemeContext';

import { ChatLayout } from './components/ChatLayout';
import { RagProvider } from './context/RagContext';

const App: React.FC = () => (
  <ThemeProvider>
    <RagProvider>
      <ChatLayout />
    </RagProvider>
  </ThemeProvider>
);

export default App;
