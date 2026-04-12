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
    <html lang="en">
      <head>
        <Script id="performance-marks-polyfill" strategy="beforeInteractive">
          {`(function(){try{var perf=window.performance;if(!perf)return;if(typeof perf.clearMarks!=='function'){perf.clearMarks=function(){}}if(typeof perf.clearMeasures!=='function'){perf.clearMeasures=function(){}}}catch(e){}})()`}
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
