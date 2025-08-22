'use client'

import { ReactNode } from 'react'
import { Header } from '@/components/store/layout/Header'
import { Footer } from '@/components/store/layout/Footer'
import { TrustBar } from '@/components/ui/TrustElements'
import { MobileNavigation } from '@/components/ui/MobileNavigation'
import { useCart } from '@/contexts/CartContext'

interface StoreLayoutProps {
  children: ReactNode
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  const { itemCount } = useCart()

  return (
    <div className="min-h-screen flex flex-col">
      <Header cartItemsCount={itemCount} />
      <TrustBar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <MobileNavigation />
    </div>
  )
}