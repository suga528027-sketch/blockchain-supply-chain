import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'pink' | 'dark' | 'nature' | 'midnight';

const THEMES: Theme[] = ['pink', 'dark', 'nature', 'midnight'];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    if (THEMES.includes(saved)) return saved;
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(...THEMES);
    
    // 'pink' is a light theme variant
    if (theme === 'pink') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const currentIndex = THEMES.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
