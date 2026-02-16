'use client';

import ChatWidget from '@/components/chat/ChatWidget';
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import SubHeader from '@/components/layout/SubHeader'
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation'

export default function DashboardRoot({ children }){
  const [isHidden, setIsHidden] = useState(false);
  const pathname = usePathname()

  const showSubHeader = useMemo(() => {
    if (!pathname) return false
    if (pathname.includes('/chat')) return false
    const parts = pathname.split('/').filter(Boolean)
    // overview is just '/role' (1 part). everything else is a sub-page
    return parts.length >= 2
  }, [pathname])

  useEffect(() => {
    if((pathname || '').includes('/chat')){
      setIsHidden(true);
    }
  }, [pathname]);

  return (
    <div className="w-full min-h-screen flex bg-[--color-bg]   scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <Sidebar isHidden={isHidden}/>
      <div className={`w-full flex-1 flex flex-col transition-all duration-300 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isHidden ? 'ml-0' : 'ml-64'}`}>
        <Navbar isHidden={isHidden} setIsHidden={setIsHidden} />
        <main className='pt-16 px-6'>
          {showSubHeader ? <SubHeader /> : null}
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  )
}
