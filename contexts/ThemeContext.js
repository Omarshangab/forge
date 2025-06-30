'use client';

import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    // Always set to dark theme
    document.documentElement.setAttribute('data-theme', 'forge-dark');
    document.documentElement.classList.add('dark');
  }, []);

  const value = {
    isDark: true,
    // Remove toggleTheme function since we don't need it
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 