'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Tipos de feedback
export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface FeedbackProps {
  type: FeedbackType
  title?: string
  message: string
  duration?: number
  onClose?: () => void
  className?: string
  showCloseButton?: boolean
}

// Ícones para cada tipo
const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  loading: Loader2,
}

// Cores para cada tipo
const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  loading: 'bg-gray-50 border-gray-200 text-gray-800',
}

// Cores dos ícones
const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
  loading: 'text-gray-500',
}

export function Feedback({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  className,
  showCloseButton = true,
}: FeedbackProps) {
  const [isVisible, setIsVisible] = useState(true)
  const Icon = icons[type]

  useEffect(() => {
    if (duration > 0 && type !== 'loading') {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose, type])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'relative flex items-start p-4 border rounded-lg shadow-sm',
            colors[type],
            className
          )}
        >
          <div className="flex-shrink-0">
            <Icon
              className={cn(
                'h-5 w-5',
                iconColors[type],
                type === 'loading' && 'animate-spin'
              )}
            />
          </div>
          
          <div className="ml-3 flex-1">
            {title && (
              <h3 className="text-sm font-medium mb-1">
                {title}
              </h3>
            )}
            <p className="text-sm">
              {message}
            </p>
          </div>

          {showCloseButton && type !== 'loading' && (
            <button
              onClick={handleClose}
              className="ml-4 flex-shrink-0 rounded-md p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook para gerenciar feedbacks
interface FeedbackItem {
  id: string
  type: FeedbackType
  title?: string
  message: string
  duration?: number
}

export function useFeedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])

  const addFeedback = (feedback: Omit<FeedbackItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setFeedbacks(prev => [...prev, { ...feedback, id }])
  }

  const removeFeedback = (id: string) => {
    setFeedbacks(prev => prev.filter(f => f.id !== id))
  }

  const clearAll = () => {
    setFeedbacks([])
  }

  // Métodos de conveniência
  const success = (message: string, title?: string, duration?: number) => {
    addFeedback({ type: 'success', message, title, duration })
  }

  const error = (message: string, title?: string, duration?: number) => {
    addFeedback({ type: 'error', message, title, duration })
  }

  const warning = (message: string, title?: string, duration?: number) => {
    addFeedback({ type: 'warning', message, title, duration })
  }

  const info = (message: string, title?: string, duration?: number) => {
    addFeedback({ type: 'info', message, title, duration })
  }

  const loading = (message: string, title?: string) => {
    addFeedback({ type: 'loading', message, title, duration: 0 })
  }

  return {
    feedbacks,
    addFeedback,
    removeFeedback,
    clearAll,
    success,
    error,
    warning,
    info,
    loading,
  }
}

// Container para exibir feedbacks
interface FeedbackContainerProps {
  feedbacks: FeedbackItem[]
  onRemove: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  className?: string
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
}

export function FeedbackContainer({
  feedbacks,
  onRemove,
  position = 'top-right',
  className,
}: FeedbackContainerProps) {
  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col space-y-2 max-w-sm w-full',
        positionClasses[position],
        className
      )}
    >
      <AnimatePresence>
        {feedbacks.map((feedback) => (
          <Feedback
            key={feedback.id}
            type={feedback.type}
            title={feedback.title}
            message={feedback.message}
            duration={feedback.duration}
            onClose={() => onRemove(feedback.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Componente de progresso para operações longas
interface ProgressFeedbackProps {
  title: string
  progress: number // 0-100
  message?: string
  onCancel?: () => void
  className?: string
}

export function ProgressFeedback({
  title,
  progress,
  message,
  onCancel,
  className,
}: ProgressFeedbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{message || 'Processando...'}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  )
}

// Componente de confirmação
interface ConfirmationFeedbackProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  className?: string
}

export function ConfirmationFeedback({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'info',
  className,
}: ConfirmationFeedbackProps) {
  const confirmColors = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'bg-white border border-gray-200 rounded-lg shadow-lg p-6 max-w-md',
        className
      )}
    >
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      
      <div className="flex space-x-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            confirmColors[type]
          )}
        >
          {confirmText}
        </button>
      </div>
    </motion.div>
  )
}