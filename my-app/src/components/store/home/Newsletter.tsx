'use client'

import { useState } from 'react'
import { TouchButton, TouchInput, TouchOptimized } from '@/components/ui/TouchTargets'
import { Mail, Check } from 'lucide-react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Por favor, insira seu email')
      return
    }

    if (!email.includes('@')) {
      setError('Por favor, insira um email válido')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Here you would typically send the email to your backend/newsletter service
      console.log('Newsletter subscription:', email)
      
      setIsSubscribed(true)
      setEmail('')
    } catch {
      setError('Erro ao cadastrar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubscribed) {
    return (
      <section className="py-16 px-4 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Inscrição Realizada!
            </h3>
            <p className="text-gray-300">
              Obrigado por se inscrever! Você receberá nossas novidades em breve.
            </p>
            <TouchButton 
              onClick={() => setIsSubscribed(false)}
              variant="secondary"
              className="mt-6 border-white/30 text-white hover:bg-white/10"
            >
              Cadastrar outro email
            </TouchButton>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-r from-gray-900 to-gray-800">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/20">
          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Content */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Fique por Dentro das Novidades
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Receba em primeira mão nossas promoções exclusivas, lançamentos e dicas de moda.
          </p>

          {/* Newsletter Form */}
          <TouchOptimized>
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <TouchInput
                    type="email"
                    placeholder="Seu melhor email"
                    value={email}
                    onChange={(value: string) => {
                      setEmail(value)
                      setError('')
                    }}
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus:bg-white/30 focus:border-white/50"
                    disabled={isLoading}
                  />
                </div>
                <TouchButton 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                      Cadastrando...
                    </div>
                  ) : (
                    'Cadastrar'
                  )}
                </TouchButton>
              </div>
            </form>
          </TouchOptimized>
            
            {error && (
              <p className="text-red-300 text-sm mt-3">
                {error}
              </p>
            )}

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-sm">
            <div className="text-gray-300">
              <div className="font-semibold text-white mb-1">🎯 Promoções Exclusivas</div>
              <div>Descontos especiais só para assinantes</div>
            </div>
            <div className="text-gray-300">
              <div className="font-semibold text-white mb-1">🚀 Lançamentos</div>
              <div>Seja o primeiro a conhecer novos produtos</div>
            </div>
            <div className="text-gray-300">
              <div className="font-semibold text-white mb-1">💡 Dicas de Moda</div>
              <div>Conteúdo exclusivo sobre tendências</div>
            </div>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-400 mt-8">
            Seus dados estão seguros conosco. Você pode cancelar a inscrição a qualquer momento.
          </p>
        </div>
      </div>
    </section>
  )
}