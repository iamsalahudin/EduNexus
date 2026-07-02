'use client'

import React from 'react'

export default function ValidationBar({ errors }) {
  if (!errors || errors.length === 0) return null
  return (
    <div className="card mt-4 border-l-4 border-red-500 bg-red-50 p-3">
      <div className="font-medium text-red-700">Validation</div>
      <ul className="list-disc pl-5 mt-2 text-sm text-red-600">
        {errors.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </div>
  )
}
