"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

// Defaults aligned with the Teal + Zinc palette in globals.css
const defaultPalette = {
  primary: '#14B8A6',
  'primary-hover': '#0D9488',
  'primary-fg': '#FFFFFF',
  accent: '#A78BFA',
  danger: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  // legacy aliases (still read by some older pages)
  secondary: '#A78BFA',
  cta: '#EF4444',
  textLight: '#FAFAFA',
  textDark: '#18181B',
}

const PALETTE_KEY = 'edunexus-admin-palette'
const MODE_KEY = 'edunexus-theme-mode'

function readPalette() {
  if (typeof window === 'undefined') return defaultPalette
  try {
    const raw = localStorage.getItem(PALETTE_KEY)
    if (!raw) return defaultPalette
    return { ...defaultPalette, ...JSON.parse(raw) }
  } catch {
    return defaultPalette
  }
}

function readMode() {
  if (typeof window === 'undefined') return true // SSR default = dark
  try {
    const saved = localStorage.getItem(MODE_KEY)
    return saved ? saved === 'dark' : true
  } catch {
    return true
  }
}

export function ThemeProvider({ children }) {
  // Lazy initializers so first client render matches the inline no-FOUC script.
  const [palette, setPaletteState] = useState(readPalette)
  const [dark, setDark] = useState(readMode)

  // Apply palette CSS variables
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    Object.entries(palette).forEach(([k, v]) => {
      root.style.setProperty(`--color-${k}`, v)
    })
    try { localStorage.setItem(PALETTE_KEY, JSON.stringify(palette)) } catch {}
  }, [palette])

  // Apply dark-mode class + persist
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (dark) root.classList.add('dark')
    else root.classList.remove('dark')
    try { localStorage.setItem(MODE_KEY, dark ? 'dark' : 'light') } catch {}
  }, [dark])

  function setPalette(p) {
    setPaletteState(prev => ({ ...prev, ...p }))
  }

  function toggleDark() { setDark(d => !d) }

  function resetPalette() { setPaletteState(defaultPalette) }

  return (
    <ThemeContext.Provider value={{ palette, setPalette, resetPalette, dark, setDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
