'use client';

import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import { useState } from 'react';

export default function DashboardRoot({ children }){
  const [isHidden, setIsHidden] = useState(false);
  return (
    <div className="w-full min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar isHidden={isHidden} />
      <div className={`w-full flex-1 flex flex-col transition-all duration-300 ${isHidden ? 'ml-0' : 'ml-64'}`}>
        <Navbar isHidden={isHidden} setIsHidden={setIsHidden} />
        <main className={`p-6 pt-16`}>{children}</main>
      </div>
    </div>
  )
}
