'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'
import { toast } from 'sonner'

type UserProfile = Tables<'user_profiles'>

interface UserWithAuth extends UserProfile {
  email: string
  last_sign_in_at?: string
  created_at: string
  permissions?: UserPermissions
  is_active?: boolean
  bio?: string
  metadata?: Record<string, unknown>
}

interface UserPermissions {
  can_manage_products: boolean
  can_manage_orders: boolean
  can_manage_users: boolean
  can_manage_promotions: boolean
  can_view_reports: boolean
  can_manage_settings: boolean
}

interface CreateUserData {
  email: string
  password: string
  full_name?: string
  role: 'admin' | 'customer'
  permissions?: UserPermissions
}

export function useUsers() {
  const [users, setUsers] = useState<UserWithAuth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar todos os usuários
  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      // Buscar perfis de usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Buscar dados de autenticação (apenas para admins)
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (currentUser) {
        const { data: currentProfile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        if (currentProfile?.role === 'admin') {
          // Admin pode ver dados de autenticação
          const usersWithAuth = await Promise.all(
            profiles.map(async (profile) => {
              try {
                // Para cada perfil, buscar dados básicos de auth
                const { data: authData } = await supabase.auth.admin.getUserById(profile.id)
                
                return {
                  ...profile,
                  email: authData.user?.email || 'N/A',
                  last_sign_in_at: authData.user?.last_sign_in_at,
                  created_at: authData.user?.created_at || profile.created_at
                }
              } catch {
                return {
                  ...profile,
                  email: 'N/A',
                  last_sign_in_at: undefined,
                  created_at: profile.created_at
                }
              }
            })
          )
          
          setUsers(usersWithAuth)
        } else {
          // Usuário comum só vê perfis básicos
          const basicUsers = profiles.map(profile => ({
            ...profile,
            email: 'N/A',
            last_sign_in_at: undefined,
            created_at: profile.created_at
          }))
          
          setUsers(basicUsers)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar usuários')
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  // Criar novo usuário
  const createUser = async (userData: CreateUserData) => {
    try {
      // Criar usuário na autenticação
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Falha ao criar usuário')

      // Criar perfil do usuário
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name: userData.full_name,
          role: userData.role,
          is_active: true,
          permissions: userData.permissions || {
            can_manage_products: userData.role === 'admin',
            can_manage_orders: userData.role === 'admin',
            can_manage_users: userData.role === 'admin',
            can_manage_promotions: userData.role === 'admin',
            can_view_reports: userData.role === 'admin',
            can_manage_settings: userData.role === 'admin'
          }
        })

      if (profileError) throw profileError

      toast.success('Usuário criado com sucesso!')
      await fetchUsers()
      return authData.user
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuário'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  // Atualizar usuário
  const updateUser = async (id: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      toast.success('Usuário atualizado com sucesso!')
      await fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar usuário'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  // Atualizar role do usuário
  const updateUserRole = async (id: string, role: 'admin' | 'customer') => {
    try {
      const defaultPermissions = {
        can_manage_products: role === 'admin',
        can_manage_orders: role === 'admin',
        can_manage_users: role === 'admin',
        can_manage_promotions: role === 'admin',
        can_view_reports: role === 'admin',
        can_manage_settings: role === 'admin'
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          role,
          permissions: defaultPermissions
        })
        .eq('id', id)

      if (error) throw error

      toast.success(`Usuário ${role === 'admin' ? 'promovido a administrador' : 'alterado para cliente'}!`)
      await fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar role do usuário'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  // Atualizar permissões do usuário
  const updateUserPermissions = async (id: string, permissions: UserPermissions) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ permissions })
        .eq('id', id)

      if (error) throw error

      toast.success('Permissões atualizadas com sucesso!')
      await fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar permissões'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  // Ativar/desativar usuário
  const toggleUserStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error

      toast.success(`Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso!`)
      await fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar status do usuário'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  // Deletar usuário
  const deleteUser = async (id: string) => {
    try {
      // Deletar perfil (o usuário de auth será deletado via trigger)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id)

      if (profileError) throw profileError

      // Deletar usuário da autenticação (apenas admins podem fazer isso)
      try {
        await supabase.auth.admin.deleteUser(id)
      } catch (authError) {
        console.warn('Erro ao deletar usuário da autenticação:', authError)
        // Continuar mesmo se falhar, pois o perfil já foi deletado
      }

      toast.success('Usuário deletado com sucesso!')
      await fetchUsers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar usuário'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  // Resetar senha do usuário
  const resetUserPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      toast.success('Email de reset de senha enviado!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar reset de senha'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  // Buscar estatísticas de usuários
  const getUserStats = () => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.is_active).length
    const adminUsers = users.filter(u => u.role === 'admin').length
    const customerUsers = users.filter(u => u.role === 'customer').length
    const recentUsers = users.filter(u => {
      const createdAt = new Date(u.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return createdAt > thirtyDaysAgo
    }).length

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      customerUsers,
      recentUsers
    }
  }

  // Buscar usuário por ID
  const getUserById = (id: string) => {
    return users.find(user => user.id === id)
  }

  // Verificar se usuário tem permissão específica
  const hasPermission = (userId: string, permission: keyof UserPermissions) => {
    const user = getUserById(userId)
    if (!user) return false
    if (user.role === 'admin') return true // Admins têm todas as permissões
    return user.permissions?.[permission] || false
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    updateUserRole,
    updateUserPermissions,
    toggleUserStatus,
    deleteUser,
    resetUserPassword,
    getUserStats,
    getUserById,
    hasPermission
  }
}

export type { UserWithAuth, UserPermissions, CreateUserData }