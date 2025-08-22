"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"

interface ChatMessage {
  id: string
  conversation_id: string
  sender_type: 'customer' | 'agent'
  sender_name: string
  content: string
  message_type: 'text' | 'product' | 'image'
  metadata?: Record<string, unknown>
  created_at: string
  read_at?: string
}

interface Conversation {
  id: string
  customer_name: string
  customer_email: string
  status: 'active' | 'waiting' | 'closed'
  sentiment?: 'positive' | 'neutral' | 'negative'
  last_message?: string
  last_message_at?: string
  unread_count: number
  created_at: string
  updated_at: string
}

export function useRealtimeChat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<{ [conversationId: string]: ChatMessage[] }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Efeito inicial removido em favor do efeito que depende de fetchConversations e setupRealtimeSubscription

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: conversationsData, error: conversationsError } = await supabase
        .from('chat_conversations')
        .select(`
          id,
          customer_name,
          customer_email,
          status,
          sentiment,
          last_message,
          last_message_at,
          unread_count,
          created_at,
          updated_at
        `)
        .order('updated_at', { ascending: false })

      if (conversationsError) throw conversationsError

      setConversations(conversationsData || [])
    } catch (err) {
      console.error('Erro ao buscar conversas:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          conversation_id,
          sender_type,
          sender_name,
          content,
          message_type,
          metadata,
          created_at,
          read_at
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError

      setMessages(prev => ({
        ...prev,
        [conversationId]: messagesData || []
      }))

      return messagesData || []
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err)
      return []
    }
  }

  const sendMessage = async (
    conversationId: string,
    message: string,
    messageType: 'text' | 'product' | 'image' = 'text',
    metadata?: Record<string, unknown>
  ) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'agent',
          sender_name: 'Atendente',
          content: message,
          message_type: messageType,
          metadata
        })
        .select()
        .single()

      if (error) throw error

      // Atualizar conversa
      await supabase
        .from('chat_conversations')
        .update({
          last_message: message,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      return data
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
      throw err
    }
  }

  const updateConversationStatus = async (conversationId: string, status: Conversation['status']) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      if (error) throw error

      // Atualizar estado local
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, status, updated_at: new Date().toISOString() }
            : conv
        )
      )
    } catch (err) {
      console.error('Erro ao atualizar status da conversa:', err)
      throw err
    }
  }

  const markAsRead = async (conversationId: string) => {
    try {
      // Marcar mensagens como lidas
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .is('read_at', null)
        .eq('sender_type', 'customer')

      if (messagesError) throw messagesError

      // Resetar contador de não lidas
      const { error: conversationError } = await supabase
        .from('chat_conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId)

      if (conversationError) throw conversationError

      // Atualizar estado local
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      )
    } catch (err) {
      console.error('Erro ao marcar como lida:', err)
    }
  }

  const setupRealtimeSubscription = useCallback(() => {
    const newChannel = supabase
      .channel('chat-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations(prev => [payload.new as Conversation, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setConversations(prev => 
              prev.map(conv => 
                conv.id === payload.new.id 
                  ? { ...conv, ...payload.new as Conversation }
                  : conv
              )
            )
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          setMessages(prev => ({
            ...prev,
            [newMessage.conversation_id]: [
              ...(prev[newMessage.conversation_id] || []),
              newMessage
            ]
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(newChannel)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    const cleanup = setupRealtimeSubscription()
    return cleanup
  }, [fetchConversations, setupRealtimeSubscription])

  const filterConversations = useCallback((status?: string, searchTerm?: string) => {
    let filtered = conversations

    if (status && status !== 'all') {
      filtered = filtered.filter(conv => conv.status === status)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(conv => 
        conv.customer_name.toLowerCase().includes(term) ||
        conv.customer_email.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [conversations])

  return {
    conversations,
    messages,
    loading,
    error,
    fetchMessages,
    sendMessage,
    updateConversationStatus,
    markAsRead,
    filterConversations,
    refetch: fetchConversations
  }
}