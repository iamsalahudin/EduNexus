"use client"
import { useEffect, useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { Button, Card, Input, PageHeader } from '@/components/ui'

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
  const [presetName, setPresetName] = useState('Ocean')
  const [custom, setCustom] = useState({ primary:'', secondary:'', textLight:'', textDark:'', cta:'' })

  useEffect(()=>{
    if(palette) {
      setCustom(palette)
    }
  },[palette])

  if(!user || user.role !== 'Admin'){
    return <Card>Only admin can change theme.</Card>
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
      <PageHeader
        title="Admin Theme Settings"
        subtitle="Choose a palette or set a custom color scheme (5 colors)."
      />

      <div className="mt-4 space-y-4">
        <div className="flex gap-3">
          {Object.keys(presets).map(name=> (
            <Button
              key={name}
              type="button"
              variant={presetName === name ? 'primary' : 'secondary'}
              onClick={() => applyPreset(name)}
            >
              {name}
            </Button>
          ))}
        </div>

        <Card>
          <h3 className="font-medium">Custom Palette</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Primary</div>
              <Input
                type="color"
                value={custom.primary || palette.primary}
                onChange={(e) => setCustom({ ...custom, primary: e.target.value })}
                className="shrink-0"
                inputClassName="w-16 h-10 p-1"
                aria-label="Primary"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Secondary</div>
              <Input
                type="color"
                value={custom.secondary || palette.secondary}
                onChange={(e) => setCustom({ ...custom, secondary: e.target.value })}
                className="shrink-0"
                inputClassName="w-16 h-10 p-1"
                aria-label="Secondary"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Light Text / Dark Background</div>
              <Input
                type="color"
                value={custom.textLight || palette.textLight}
                onChange={(e) => setCustom({ ...custom, textLight: e.target.value })}
                className="shrink-0"
                inputClassName="w-16 h-10 p-1"
                aria-label="Light text"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Dark Text / Light Background</div>
              <Input
                type="color"
                value={custom.textDark || palette.textDark}
                onChange={(e) => setCustom({ ...custom, textDark: e.target.value })}
                className="shrink-0"
                inputClassName="w-16 h-10 p-1"
                aria-label="Dark text"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">CTA</div>
              <Input
                type="color"
                value={custom.cta || palette.cta}
                onChange={(e) => setCustom({ ...custom, cta: e.target.value })}
                className="shrink-0"
                inputClassName="w-16 h-10 p-1"
                aria-label="CTA"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" variant="primary" onClick={saveCustom}>Save Custom</Button>
            <Button type="button" variant="secondary" onClick={() => applyPreset(presetName)}>Apply Preset</Button>
          </div>
        </Card>

        <Card>
          <h3 className="font-medium">Preview</h3>
          <div className="mt-3 p-4 rounded" style={{background: 'linear-gradient(90deg,' + (palette.primary||'#0ea5a4') + ', ' + (palette.secondary||'#7c3aed') + ')'}}>
            <div className="text-white p-4 rounded">Primary / Secondary Preview</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
