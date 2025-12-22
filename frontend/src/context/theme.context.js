'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { PALETTES } from '@/constants/palettes';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');
  const [palette, setPalette] = useState(PALETTES.blue);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle('dark', mode === 'dark');
    root.classList.toggle('light', mode === 'light');

    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--secondary', palette.secondary);
    root.style.setProperty('--text-light-bg', palette.textLightBg);
    root.style.setProperty('--text-dark-bg', palette.textDarkBg);
    root.style.setProperty('--cta', palette.cta);
  }, [mode, palette]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        palette,
        setPalette,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
