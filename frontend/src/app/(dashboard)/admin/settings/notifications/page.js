"use client"

import { useEffect, useState } from 'react'

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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={prefs.push} onChange={(e) => setPrefs((p) => ({ ...p, push: e.target.checked }))} />
          Push notifications
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={prefs.email} onChange={(e) => setPrefs((p) => ({ ...p, email: e.target.checked }))} />
          Email notifications
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={prefs.sms} onChange={(e) => setPrefs((p) => ({ ...p, sms: e.target.checked }))} />
          SMS notifications
        </label>
      </div>
    </div>
  )
}
