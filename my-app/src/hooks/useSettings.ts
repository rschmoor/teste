'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface Settings {
  general?: {
    store_name?: string
    store_url?: string
    store_description?: string
    logo_url?: string
    contact_email?: string
    contact_phone?: string
    address?: string
  }
  payments?: {
    pix_enabled?: boolean
    credit_card_enabled?: boolean
    boleto_enabled?: boolean
    gateway?: string
    api_key?: string
    api_secret?: string
  }
  shipping?: {
    free_shipping_enabled?: boolean
    free_shipping_minimum?: number
    origin_zipcode?: string
    processing_time?: number
    default_method?: string
  }
  email?: {
    smtp_host?: string
    smtp_port?: number
    smtp_user?: string
    smtp_password?: string
    smtp_secure?: boolean
  }
  security?: {
    require_2fa?: boolean
    maintenance_mode?: boolean
    session_timeout?: number
    max_login_attempts?: number
  }
  appearance?: {
    theme?: string
    primary_color?: string
    font_family?: string
    show_prices?: boolean
    show_stock?: boolean
    show_reviews?: boolean
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar configurações
  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setSettings(data.config || {})
      } else {
        // Se não existir configuração, criar uma padrão
        const defaultSettings: Settings = {
          general: {
            store_name: 'Minha Boutique',
            store_description: 'Uma loja incrível',
            contact_email: 'contato@minhaboutique.com'
          },
          payments: {
            pix_enabled: true,
            credit_card_enabled: true,
            boleto_enabled: false
          },
          shipping: {
            free_shipping_enabled: true,
            free_shipping_minimum: 100,
            processing_time: 2
          },
          appearance: {
            theme: 'light',
            primary_color: '#000000',
            font_family: 'inter',
            show_prices: true,
            show_reviews: true
          }
        }
        setSettings(defaultSettings)
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Salvar configurações
  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const updatedSettings = {
        ...settings,
        ...newSettings
      }

      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 1, // ID fixo para configurações globais
          config: updatedSettings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setSettings(updatedSettings)
      return updatedSettings
    } catch (err) {
      console.error('Erro ao salvar configurações:', err)
      throw err
    }
  }

  // Upload de logo
  const uploadLogo = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (err) {
      console.error('Erro ao fazer upload do logo:', err)
      throw err
    }
  }

  // Testar configurações de email
  const testEmailSettings = async () => {
    try {
      if (!settings?.email?.smtp_host) {
        throw new Error('Configurações de email não encontradas')
      }

      // Aqui você implementaria o teste real do SMTP
      // Por enquanto, apenas simula o teste
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simula sucesso
      return true
    } catch (err) {
      console.error('Erro ao testar email:', err)
      throw err
    }
  }

  // Restaurar configurações padrão
  const resetToDefaults = async () => {
    try {
      const defaultSettings: Settings = {
        general: {
          store_name: 'Minha Boutique',
          store_description: 'Uma loja incrível',
          contact_email: 'contato@minhaboutique.com'
        },
        payments: {
          pix_enabled: true,
          credit_card_enabled: true,
          boleto_enabled: false
        },
        shipping: {
          free_shipping_enabled: true,
          free_shipping_minimum: 100,
          processing_time: 2
        },
        email: {
          smtp_port: 587,
          smtp_secure: true
        },
        security: {
          require_2fa: false,
          maintenance_mode: false,
          session_timeout: 30,
          max_login_attempts: 5
        },
        appearance: {
          theme: 'light',
          primary_color: '#000000',
          font_family: 'inter',
          show_prices: true,
          show_stock: false,
          show_reviews: true
        }
      }

      await updateSettings(defaultSettings)
      toast.success('Configurações restauradas para o padrão')
    } catch (err) {
      console.error('Erro ao restaurar configurações:', err)
      toast.error('Erro ao restaurar configurações')
      throw err
    }
  }

  // Carregar configurações ao montar o componente
  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    updateSettings,
    uploadLogo,
    testEmailSettings,
    resetToDefaults,
    refetch: fetchSettings
  }
}