'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Package, Home } from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header simples */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Sistema de Produtos</h1>
              <span className="text-sm text-muted-foreground">(Modo Teste)</span>
            </div>
            <nav className="flex items-center space-x-4">
              <Link 
                href="/admin" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <Home className="h-4 w-4" />
                <span>Início</span>
              </Link>
              <Link 
                href="/admin/produtos" 
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <Package className="h-4 w-4" />
                <span>Produtos</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}