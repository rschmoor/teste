'use client'

import { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { AuthContext } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Hook para proteger páginas que requerem autenticação
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (!loading && !user) {
    router.push('/auth/login')
    toast.error('Você precisa estar logado para acessar esta página')
  }

  return { user, loading }
}

// Hook para proteger páginas que requerem permissões de admin
export function useRequireAdmin() {
  const { user, profile, loading, isAdmin } = useAuth()
  const router = useRouter()

  if (!loading && (!user || !isAdmin)) {
    router.push('/')
    toast.error('Você não tem permissão para acessar esta página')
  }

  return { user, profile, loading, isAdmin }
}

// Hook para redirecionar usuários autenticados
export function useRedirectIfAuthenticated() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (!loading && user) {
    router.push('/')
  }

  return { user, loading }
}