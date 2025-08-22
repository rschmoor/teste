"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatViewer } from "@/components/admin/ChatViewer"
import { useRealtimeChat } from "@/hooks/useRealtimeChat"
import { 
  Search, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Smile,
  Meh,
  Frown,
  Users
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function ChatPage() {
  const {
    conversations,
    messages,
    loading,
    error,
    fetchMessages,
    sendMessage,
    updateConversationStatus,
    markAsRead,
    filterConversations
  } = useRealtimeChat()

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const handleConversationSelect = async (conversationId: string) => {
    setSelectedConversation(conversationId)
    await fetchMessages(conversationId)
    await markAsRead(conversationId)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Ativo',
          variant: 'default' as const,
          icon: MessageCircle,
          color: 'text-green-600'
        }
      case 'waiting':
        return {
          label: 'Aguardando',
          variant: 'secondary' as const,
          icon: Clock,
          color: 'text-yellow-600'
        }
      case 'closed':
        return {
          label: 'Fechado',
          variant: 'outline' as const,
          icon: CheckCircle,
          color: 'text-gray-600'
        }
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          icon: MessageCircle,
          color: 'text-gray-600'
        }
    }
  }

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="h-4 w-4 text-green-500" />
      case 'negative':
        return <Frown className="h-4 w-4 text-red-500" />
      case 'neutral':
      default:
        return <Meh className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      
      if (diffInHours < 24) {
        return format(date, 'HH:mm', { locale: ptBR })
      } else {
        return format(date, 'dd/MM', { locale: ptBR })
      }
    } catch {
      return dateString
    }
  }

  const filteredConversations = filterConversations(statusFilter, searchTerm)

  const getStatusCounts = () => {
    return {
      all: conversations.length,
      active: conversations.filter(c => c.status === 'active').length,
      waiting: conversations.filter(c => c.status === 'waiting').length,
      closed: conversations.filter(c => c.status === 'closed').length
    }
  }

  const statusCounts = getStatusCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">Erro ao carregar chat</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 h-screen flex">
      {/* Lista de conversas */}
      <div className="w-80 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-semibold mb-4">Chat de Atendimento</h2>
          
          {/* Busca */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros por status */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">
                Todos
                <Badge variant="secondary" className="ml-1 text-xs">
                  {statusCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs">
                Ativo
                <Badge variant="default" className="ml-1 text-xs">
                  {statusCounts.active}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="waiting" className="text-xs">
                Aguard.
                <Badge variant="secondary" className="ml-1 text-xs">
                  {statusCounts.waiting}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="closed" className="text-xs">
                Fechado
                <Badge variant="outline" className="ml-1 text-xs">
                  {statusCounts.closed}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const statusConfig = getStatusConfig(conversation.status)
              const StatusIcon = statusConfig.icon
              const isSelected = selectedConversation === conversation.id
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation.id)}
                  className={cn(
                    "p-4 border-b cursor-pointer hover:bg-white transition-colors",
                    isSelected && "bg-white border-l-4 border-l-primary"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {conversation.customer_name}
                        </p>
                        {getSentimentIcon(conversation.sentiment)}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.customer_email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant={statusConfig.variant} className="text-xs">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      {conversation.last_message_at && (
                        <span className="text-xs text-gray-400">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {conversation.last_message && (
                    <p className="text-xs text-gray-600 truncate">
                      {conversation.last_message}
                    </p>
                  )}
                  
                  {conversation.unread_count > 0 && (
                    <div className="flex justify-end mt-2">
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unread_count}
                      </Badge>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatViewer
            conversationId={selectedConversation}
            messages={messages[selectedConversation] || []}
            onSendMessage={sendMessage}
            onUpdateStatus={updateConversationStatus}
            conversation={conversations.find(c => c.id === selectedConversation)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-sm text-gray-500">
                Escolha uma conversa da lista para começar a atender
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}