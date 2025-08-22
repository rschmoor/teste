"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip, 
  Smile,
  Check,
  CheckCheck,
  Clock,
  User,
  Bot,
  Package,
  ExternalLink,
  MessageCircle,
  XCircle,
  CheckCircle
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"

interface Message {
  id: string
  conversation_id: string
  content: string
  sender_type: 'customer' | 'agent'
  sender_name?: string
  created_at: string
  read_at?: string
  message_type?: 'text' | 'product_suggestion' | 'system' | 'product' | 'image'
  metadata?: {
    product_id?: string
    product_name?: string
    product_price?: number
    product_image?: string
  }
}

interface Conversation {
  id: string
  customer_name: string
  customer_email: string
  status: 'active' | 'waiting' | 'closed'
  sentiment?: 'positive' | 'negative' | 'neutral'
  created_at: string
  last_message_at?: string
  last_message?: string
  unread_count: number
}

interface ChatViewerProps {
  conversationId: string
  messages: Message[]
  onSendMessage: (conversationId: string, content: string, messageType?: 'text' | 'product' | 'image', metadata?: any) => Promise<void>
  onUpdateStatus: (conversationId: string, status: 'active' | 'waiting' | 'closed') => Promise<void>
  conversation?: Conversation
}

export function ChatViewer({
  conversationId,
  messages,
  onSendMessage,
  onUpdateStatus,
  conversation
}: ChatViewerProps) {
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    setIsTyping(true)
    try {
      await onSendMessage(conversationId, newMessage.trim())
      setNewMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'HH:mm', { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const formatMessageDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      if (date.toDateString() === today.toDateString()) {
        return 'Hoje'
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem'
      } else {
        return format(date, 'dd/MM/yyyy', { locale: ptBR })
      }
    } catch {
      return dateString
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MessageCircle className="h-4 w-4 text-green-500" />
      case 'waiting':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'waiting':
        return 'Aguardando'
      case 'closed':
        return 'Fechado'
      default:
        return status
    }
  }

  const renderMessage = (message: Message, index: number) => {
    const isAgent = message.sender_type === 'agent'
    const isSystem = message.message_type === 'system'
    const isProductSuggestion = message.message_type === 'product_suggestion'
    
    // Check if we need to show date separator
    const showDateSeparator = index === 0 || 
      formatMessageDate(message.created_at) !== formatMessageDate(messages[index - 1]?.created_at)

    return (
      <div key={message.id}>
        {showDateSeparator && (
          <div className="flex justify-center my-4">
            <Badge variant="secondary" className="text-xs">
              {formatMessageDate(message.created_at)}
            </Badge>
          </div>
        )}
        
        {isSystem ? (
          <div className="flex justify-center my-2">
            <Badge variant="outline" className="text-xs">
              {message.content}
            </Badge>
          </div>
        ) : (
          <div className={cn(
            "flex mb-4",
            isAgent ? "justify-end" : "justify-start"
          )}>
            <div className={cn(
              "flex max-w-[70%] space-x-2",
              isAgent ? "flex-row-reverse space-x-reverse" : "flex-row"
            )}>
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className={cn(
                  "text-xs",
                  isAgent ? "bg-primary text-primary-foreground" : "bg-secondary"
                )}>
                  {isAgent ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              
              <div className={cn(
                "flex flex-col",
                isAgent ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "rounded-lg px-3 py-2 max-w-full",
                  isAgent 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground",
                  isProductSuggestion && "border-2 border-blue-200"
                )}>
                  {isProductSuggestion && message.metadata ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4" />
                        <span className="text-sm font-medium">Produto Sugerido</span>
                      </div>
                      
                      <div className="bg-white/10 rounded p-2">
                        <div className="flex items-center space-x-2 mb-2">
                          {message.metadata.product_image && (
                            <Image 
                              src={message.metadata.product_image} 
                              alt={message.metadata.product_name ?? 'Imagem do produto'}
                              width={48}
                              height={48}
                              className="object-cover rounded"
                              unoptimized
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {message.metadata.product_name}
                            </p>
                            {message.metadata.product_price && (
                              <p className="text-sm opacity-90">
                                {formatPrice(message.metadata.product_price)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="w-full"
                          onClick={() => {
                            if (message.metadata?.product_id) {
                              window.open(`/produtos/${message.metadata.product_id}`, '_blank')
                            }
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver Produto
                        </Button>
                      </div>
                      
                      {message.content && (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                
                <div className={cn(
                  "flex items-center space-x-1 mt-1 text-xs text-muted-foreground",
                  isAgent ? "flex-row-reverse space-x-reverse" : "flex-row"
                )}>
                  <span>{formatMessageTime(message.created_at)}</span>
                  {isAgent && (
                    <div className="flex items-center">
                      {message.read_at ? (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Conversa não encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>
                {conversation.customer_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="font-medium">{conversation.customer_name}</h3>
              <p className="text-sm text-muted-foreground">
                {conversation.customer_email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant={conversation.status === 'active' ? 'default' : 'secondary'}
              className="flex items-center space-x-1"
            >
              {getStatusIcon(conversation.status)}
              <span>{getStatusLabel(conversation.status)}</span>
            </Badge>
            
            <div className="flex items-center space-x-1">
              <Button size="sm" variant="ghost">
                <Phone className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Video className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Status Actions */}
        <div className="flex items-center space-x-2 mt-3">
          <Button 
            size="sm" 
            variant={conversation.status === 'active' ? 'secondary' : 'default'}
            onClick={() => onUpdateStatus(conversationId, 'active')}
            disabled={conversation.status === 'active'}
          >
            Ativar
          </Button>
          <Button 
            size="sm" 
            variant={conversation.status === 'waiting' ? 'secondary' : 'outline'}
            onClick={() => onUpdateStatus(conversationId, 'waiting')}
            disabled={conversation.status === 'waiting'}
          >
            Aguardar
          </Button>
          <Button 
            size="sm" 
            variant={conversation.status === 'closed' ? 'secondary' : 'outline'}
            onClick={() => onUpdateStatus(conversationId, 'closed')}
            disabled={conversation.status === 'closed'}
          >
            Fechar
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Nenhuma mensagem ainda. Inicie a conversa!
              </p>
            </div>
          ) : (
            messages.map((message, index) => renderMessage(message, index))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="flex items-end space-x-2">
          <Button size="sm" variant="ghost">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              className="min-h-[40px] max-h-[120px] resize-none pr-12"
              disabled={isTyping || conversation.status === 'closed'}
            />
            <Button 
              size="sm" 
              variant="ghost" 
              className="absolute right-2 bottom-2"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isTyping || conversation.status === 'closed'}
            size="sm"
          >
            {isTyping ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {conversation.status === 'closed' && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Esta conversa foi fechada. Reative para continuar o atendimento.
          </p>
        )}
      </div>
    </div>
  )
}