import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { ChatLayout } from './components/ChatLayout';

const App: React.FC = () => (
  <ThemeProvider>
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  </ThemeProvider>
);

export default App;
