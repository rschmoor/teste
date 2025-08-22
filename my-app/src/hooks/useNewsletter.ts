'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface UseNewsletterReturn {
  isLoading: boolean
  subscribe: (email: string) => Promise<boolean>
  unsubscribe: (email: string) => Promise<boolean>
  checkSubscription: (email: string) => Promise<boolean>
}

export function useNewsletter(): UseNewsletterReturn {
  const [isLoading, setIsLoading] = useState(false)

  const subscribe = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true)

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        toast.error('Por favor, insira um email válido')
        return false
      }

      // Verificar se já está inscrito
      const { data: existingSubscription } = await supabase
        .from('newsletter_subscriptions')
        .select('id, is_active')
        .eq('email', email.toLowerCase())
        .single()

      if (existingSubscription) {
        if (existingSubscription.is_active) {
          toast.info('Este email já está inscrito na nossa newsletter!')
          return true
        } else {
          // Reativar inscrição
          const { error } = await supabase
            .from('newsletter_subscriptions')
            .update({ 
              is_active: true, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', existingSubscription.id)

          if (error) throw error

          toast.success('Sua inscrição foi reativada com sucesso!')
          return true
        }
      }

      // Criar nova inscrição
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email: email.toLowerCase(),
          is_active: true,
          subscribed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Obrigado! Você foi inscrito com sucesso na nossa newsletter!')
      return true
    } catch (error) {
      console.error('Erro ao inscrever na newsletter:', error)
      toast.error('Erro ao processar inscrição. Tente novamente.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true)

      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({ 
          is_active: false, 
          unsubscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('email', email.toLowerCase())

      if (error) throw error

      toast.success('Você foi removido da nossa newsletter.')
      return true
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error)
      toast.error('Erro ao cancelar inscrição. Tente novamente.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const checkSubscription = async (email: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('newsletter_subscriptions')
        .select('is_active')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single()

      return !!data
    } catch {
      return false
    }
  }

  return {
    isLoading,
    subscribe,
    unsubscribe,
    checkSubscription
  }
}