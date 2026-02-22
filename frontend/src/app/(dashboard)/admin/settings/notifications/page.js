"use client"

import { useEffect, useState } from 'react'
import ToggleBox from '@/components/ui/ToggleBox'

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState({
    push: true,
    email: true,
    sms: false
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem('edunexus-notification-prefs')
      if (raw) setPrefs(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('edunexus-notification-prefs', JSON.stringify(prefs))
    } catch {}
  }, [prefs])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-gray-600 mt-1">Basic preferences stored locally.</p>
      </div>

      <div className="card space-y-3 max-w-xl">
        <div className="flex flex-wrap gap-2">
          <ToggleBox active={prefs.push} onToggle={(next) => setPrefs((p) => ({ ...p, push: next }))}>Push notifications</ToggleBox>
          <ToggleBox active={prefs.email} onToggle={(next) => setPrefs((p) => ({ ...p, email: next }))}>Email notifications</ToggleBox>
          <ToggleBox active={prefs.sms} onToggle={(next) => setPrefs((p) => ({ ...p, sms: next }))}>SMS notifications</ToggleBox>
        </div>
      </div>
    </div>
  )
}
