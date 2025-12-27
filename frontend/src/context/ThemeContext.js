"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

const defaultPalette = {
  primary:'#0ea5a4',
  secondary:'#7c3aed',
  textLight:'#ffffff',
  textDark:'#111827',
  cta:'#ef4444'
}

export function ThemeProvider({ children }){
  const [palette, setPaletteState] = useState(() => {
    try{
      const raw = localStorage.getItem('edunexus-admin-palette')
      return raw ? JSON.parse(raw) : defaultPalette
    }catch{ return defaultPalette }
  })
  const [dark, setDark] = useState(false)

  useEffect(()=>{
    const root = document.documentElement
    // apply raw palette entries as --color-<key>
    Object.entries(palette).forEach(([k,v])=>{
      root.style.setProperty(`--color-${k}`, v)
    })
    // set unified runtime vars based on dark flag
    const bg = dark ? (palette.bgDark || getComputedStyle(root).getPropertyValue('--color-bg-dark') || '#0f172a') : (palette.bgLight || getComputedStyle(root).getPropertyValue('--color-bg-light') || '#f9fafb')
    const text = dark ? (palette.textLight || getComputedStyle(root).getPropertyValue('--color-text-light') || '#ffffff') : (palette.textDark || getComputedStyle(root).getPropertyValue('--color-text-dark') || '#111827')
    root.style.setProperty('--color-bg', bg)
    root.style.setProperty('--color-text', text)
    // toggle class for tailwind dark utilities as well
    if(dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')

    localStorage.setItem('edunexus-admin-palette', JSON.stringify(palette))
  },[palette, dark])

  function setPalette(p){
    setPaletteState(prev=>({ ...prev, ...p }))
  }

  function toggleDark(){ setDark(d => !d) }

  return (
    <ThemeContext.Provider value={{ palette, setPalette, dark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(){
  return useContext(ThemeContext)
}
