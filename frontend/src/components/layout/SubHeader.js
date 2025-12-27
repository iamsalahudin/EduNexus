"use client"
import { useRouter } from 'next/navigation'

export default function SubHeader({ breadcrumb = [], className = '' }){
  const router = useRouter()

  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        <button onClick={()=>router.back()} aria-label="Back" className="px-2 py-1 border rounded flex items-center gap-2" style={{color:'var(--color-text)'}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="text-sm text-gray-500" style={{color:'var(--color-text)'}}>
          {breadcrumb.join(' — ')}
        </div>
      </div>
      <div></div>
    </div>
  )
}
