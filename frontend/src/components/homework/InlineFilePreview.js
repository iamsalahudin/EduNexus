"use client"

import { useEffect, useMemo, useState } from 'react'
import homeworksService from '@/services/homeworksService'

function isImage(mime) {
  const m = String(mime || '').toLowerCase()
  return m.startsWith('image/')
}

function isPdf(mime) {
  const m = String(mime || '').toLowerCase()
  return m === 'application/pdf' || m.endsWith('/pdf')
}

export default function InlineFilePreview({ file, onClear }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [objectUrl, setObjectUrl] = useState('')
  const [contentType, setContentType] = useState('')

  const name = useMemo(() => String(file?.name || file?.filename || ''), [file])
  const mimeType = useMemo(() => String(file?.mimeType || ''), [file])
  const url = useMemo(() => String(file?.url || ''), [file])

  useEffect(() => {
    let active = true
    async function run() {
      setError('')
      setObjectUrl('')
      setContentType('')
      if (!url) return
      setLoading(true)
      try {
        const { blob, contentType: ct } = await homeworksService.fetchFileBlob(url)
        if (!active) return
        const objUrl = URL.createObjectURL(blob)
        setObjectUrl(objUrl)
        setContentType(ct || mimeType)
      } catch (e) {
        if (!active) return
        setError(e?.response?.data?.error || 'Failed to preview file')
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
      try {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  if (!file) return null

  return (
    <div className="card mt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">Preview</div>
          <div className="text-sm text-gray-600 mt-1 break-all">{name || url}</div>
        </div>
        <button className="px-3 py-2 rounded btn-secondary" onClick={onClear}>
          Close
        </button>
      </div>

      {loading ? <div className="text-sm text-gray-600 mt-3">Loading previewâ€¦</div> : null}
      {error ? <div className="text-sm text-red-600 mt-3">{error}</div> : null}

      {!loading && !error && objectUrl ? (
        <div className="mt-3">
          {isImage(contentType) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={objectUrl} alt={name || 'file'} className="max-h-[520px] w-auto rounded border" />
          ) : isPdf(contentType) ? (
            <iframe title={name || 'PDF preview'} src={objectUrl} className="w-full h-[520px] rounded border" />
          ) : (
            <div className="text-sm text-gray-600">
              Preview not available for this file type.
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

