import './globals.css'
import Script from 'next/script'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'

export const metadata = {
  title: 'EduNexus',
  description: 'Smart Institute Management System - Frontend',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var s=localStorage.getItem('edunexus-theme-mode');var d=s?s==='dark':true;if(d)document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})()`}
        </Script>
        <Script id="performance-marks-polyfill" strategy="beforeInteractive">
          {`(function(){try{var perf=window.performance;if(!perf)return;if(typeof perf.clearMarks!=='function'){perf.clearMarks=function(){}}if(typeof perf.clearMeasures!=='function'){perf.clearMeasures=function(){}}}catch(e){}})()`}
        </Script>
        <Script id="chunkload-recovery" strategy="beforeInteractive">
          {`(function(){try{var KEY='edunexus_chunk_reload_at';function shouldReload(){var now=Date.now();var last=Number(sessionStorage.getItem(KEY)||0);if(now-last<5000)return false;sessionStorage.setItem(KEY,String(now));return true;}function isChunk(err){var m=err&&(err.message||err.name||'');return /ChunkLoadError|Loading chunk\\s.+\\s?failed/.test(String(m))||(err&&err.name==='ChunkLoadError');}window.addEventListener('error',function(e){if(isChunk(e.error||e)){if(shouldReload())location.reload();}});window.addEventListener('unhandledrejection',function(e){if(isChunk(e.reason)){if(shouldReload())location.reload();}});}catch(e){}})()`}
        </Script>
      </head>
      <body className=' scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
