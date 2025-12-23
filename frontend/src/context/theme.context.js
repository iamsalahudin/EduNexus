'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { PALETTES } from '@/constants/palettes';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('theme-mode') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  const [palette, setPalette] = useState(() => {
    try {
      const p = localStorage.getItem('theme-palette');
      return p ? JSON.parse(p) : PALETTES.blue;
    } catch (e) {
      return PALETTES.blue;
    }
  });

  useEffect(() => {
    const root = document.documentElement;

    // apply mode class for Tailwind's dark mode and persist
    root.classList.toggle('dark', mode === 'dark');
    try {
      localStorage.setItem('theme-mode', mode);
    } catch (e) {}

    // expose palette values as CSS vars
    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--secondary', palette.secondary);
    root.style.setProperty('--text-light-bg', palette.textLightBg);
    root.style.setProperty('--text-dark-bg', palette.textDarkBg);
    root.style.setProperty('--cta', palette.cta);

    // set bg/fg based on mode and palette so `bg-bg` / `text-fg` update
    // palette.textLightBg = color for text on light backgrounds (dark color)
    // palette.textDarkBg = color for text on dark backgrounds (light color)
    if (mode === 'dark') {
      root.style.setProperty('--bg', palette.textLightBg);
      root.style.setProperty('--fg', palette.textDarkBg);
    } else {
      root.style.setProperty('--bg', palette.textDarkBg);
      root.style.setProperty('--fg', palette.textLightBg);
    }

    // hint the browser about preferred color scheme
    try {
      document.documentElement.style.colorScheme = mode;
    } catch (e) {}

    // persist palette selection
    try {
      localStorage.setItem('theme-palette', JSON.stringify(palette));
    } catch (e) {}
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
