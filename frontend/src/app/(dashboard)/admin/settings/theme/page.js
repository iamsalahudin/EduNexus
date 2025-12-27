"use client"
import { useEffect, useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'

const presets = {
  Ocean: {
    primary:'#0ea5a4', secondary:'#7c3aed', textLight:'#ffffff', textDark:'#0f172a', cta:'#06b6d4'
  },
  Sunset: {
    primary:'#ef4444', secondary:'#f97316', textLight:'#ffffff', textDark:'#111827', cta:'#f43f5e'
  },
  Classic: {
    primary:'#2563eb', secondary:'#64748b', textLight:'#ffffff', textDark:'#0b1220', cta:'#10b981'
  }
}

export default function ThemeSettings(){
  const { user } = useAuth()
  const { palette, setPalette } = useTheme()
  const [mode, setMode] = useState('preset')
  const [presetName, setPresetName] = useState('Ocean')
  const [custom, setCustom] = useState({ primary:'', secondary:'', textLight:'', textDark:'', cta:'' })

  useEffect(()=>{
    if(palette) {
      setCustom(palette)
    }
  },[palette])

  if(!user || user.role !== 'admin'){
    return <div className="card">Only admin can change theme.</div>
  }

  function applyPreset(name){
    setPresetName(name)
    const p = presets[name]
    setPalette(p)
  }

  function saveCustom(){
    setPalette(custom)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Admin Theme Settings</h2>
      <p className="text-sm text-gray-600 mt-1">Choose a palette or set a custom color scheme (5 colors).</p>

      <div className="mt-4 space-y-4">
        <div className="flex gap-3">
          {Object.keys(presets).map(name=> (
            <button key={name} onClick={()=>applyPreset(name)} className={`px-3 py-2 rounded border ${presetName===name? 'border-indigo-600':'border-gray-200'}`}>
              {name}
            </button>
          ))}
        </div>

        <div className="card">
          <h3 className="font-medium">Custom Palette</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center gap-2">Primary
              <input type="color" value={custom.primary||palette.primary} onChange={e=>setCustom({...custom, primary:e.target.value})} />
            </label>
            <label className="flex items-center gap-2">Secondary
              <input type="color" value={custom.secondary||palette.secondary} onChange={e=>setCustom({...custom, secondary:e.target.value})} />
            </label>
            <label className="flex items-center gap-2">Light Text / Dark Background
              <input type="color" value={custom.textLight||palette.textLight} onChange={e=>setCustom({...custom, textLight:e.target.value})} />
            </label>
            <label className="flex items-center gap-2">Dark Text / Light Background
              <input type="color" value={custom.textDark||palette.textDark} onChange={e=>setCustom({...custom, textDark:e.target.value})} />
            </label>
            <label className="flex items-center gap-2">CTA
              <input type="color" value={custom.cta||palette.cta} onChange={e=>setCustom({...custom, cta:e.target.value})} />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={saveCustom} className="px-4 py-2 btn-primary rounded">Save Custom</button>
            <button onClick={()=>applyPreset(presetName)} className="px-4 py-2 border rounded">Apply Preset</button>
          </div>
        </div>

        <div className="card">
          <h3 className="font-medium">Preview</h3>
          <div className="mt-3 p-4 rounded" style={{background: 'linear-gradient(90deg,' + (palette.primary||'#0ea5a4') + ', ' + (palette.secondary||'#7c3aed') + ')'}}>
            <div className="text-white p-4 rounded">Primary / Secondary Preview</div>
          </div>
        </div>
      </div>
    </div>
  )
}
