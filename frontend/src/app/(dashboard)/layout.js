'use client';

import ChatWidget from '@/components/chat/ChatWidget';
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import { useEffect, useState } from 'react';

export default function DashboardRoot({ children }){
  const [isHidden, setIsHidden] = useState(false);
  const thispath = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    if(thispath.includes('/chat')){
      setIsHidden(true);
    }
  }, [thispath]);

  return (
    <div className="w-full min-h-screen flex bg-gray-50 dark:bg-gray-900  scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <Sidebar isHidden={isHidden}/>
      <div className={`w-full flex-1 flex flex-col transition-all duration-300 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isHidden ? 'ml-0' : 'ml-64'}`}>
        <Navbar isHidden={isHidden} setIsHidden={setIsHidden} />
        <main className='pt-16 px-6'>{children}</main>
      </div>
      <ChatWidget />
    </div>
  )
}
