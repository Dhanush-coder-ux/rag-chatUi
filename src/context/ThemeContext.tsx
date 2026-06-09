import React, { createContext, useContext, ReactNode } from 'react';

type Theme = 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void; // kept for interface compatibility — no-op
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // VAATHI OS is dark-only. Always enforce the dark class.
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  }

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
