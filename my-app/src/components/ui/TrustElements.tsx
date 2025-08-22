'use client'

import { Shield, Truck, CreditCard, Star, Award, Clock, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TrustBadgeProps {
  icon: React.ReactNode
  text: string
  className?: string
}

function TrustBadge({ icon, text, className }: TrustBadgeProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200",
      className
    )}>
      {icon}
      <span className="text-sm font-medium">{text}</span>
    </div>
  )
}

// Elementos de confiança para página de produto
export function ProductTrustElements({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <TrustBadge 
        icon={<Shield className="h-4 w-4" />}
        text="Compra 100% Segura"
      />
      <TrustBadge 
        icon={<Truck className="h-4 w-4" />}
        text="Entrega Garantida"
      />
      <TrustBadge 
        icon={<CreditCard className="h-4 w-4" />}
        text="12x sem juros"
      />
    </div>
  )
}

// Elementos de confiança para checkout
export function CheckoutTrustElements({ className }: { className?: string }) {
  return (
    <Card className={cn("bg-green-50 border-green-200", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-green-800">Compra Protegida</h3>
        </div>
        <div className="space-y-2 text-sm text-green-700">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Dados protegidos com criptografia SSL</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Garantia de entrega ou dinheiro de volta</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Suporte 24/7 para dúvidas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Barra de confiança para header/footer
export function TrustBar({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-green-50 border-y border-green-200 py-3",
      className
    )}>
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-green-700">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Compra Segura</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="font-medium">Frete Grátis acima de R$ 199</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="font-medium">Parcelamento sem juros</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Entrega em até 7 dias</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Reviews/ratings mock
export function ProductReviews({ className }: { className?: string }) {
  const reviews = [
    {
      id: 1,
      name: "Maria Silva",
      rating: 5,
      comment: "Produto excelente! Qualidade surpreendente e entrega rápida.",
      date: "2024-01-15",
      verified: true
    },
    {
      id: 2,
      name: "João Santos",
      rating: 5,
      comment: "Superou minhas expectativas. Recomendo!",
      date: "2024-01-10",
      verified: true
    },
    {
      id: 3,
      name: "Ana Costa",
      rating: 4,
      comment: "Muito bom produto, chegou certinho no prazo.",
      date: "2024-01-08",
      verified: true
    }
  ]

  const averageRating = 4.7
  const totalReviews = 127

  return (
    <div className={cn("space-y-4", className)}>
      {/* Rating Summary */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">{averageRating}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(averageRating) 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {totalReviews} avaliações
          </div>
        </div>
        
        <div className="flex-1">
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((stars) => {
              const percentage = stars === 5 ? 75 : stars === 4 ? 20 : 5
              return (
                <div key={stars} className="flex items-center gap-2 text-sm">
                  <span className="w-3">{stars}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-600">{percentage}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{review.name}</span>
                  {review.verified && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Compra verificada
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={cn(
                        "h-3 w-3",
                        i < review.rating 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.date).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <p className="text-gray-700 text-sm">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Selo de qualidade
export function QualitySeal({ className }: { className?: string }) {
  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-full border border-blue-200",
      className
    )}>
      <Award className="h-4 w-4" />
      <span className="text-sm font-medium">Produto Certificado</span>
    </div>
  )
}

// Garantias
export function ProductGuarantees({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-semibold text-gray-900 mb-3">Nossas Garantias</h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span>30 dias para troca ou devolução</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span>Garantia de qualidade do fabricante</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span>Suporte técnico especializado</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span>Entrega rastreada em todo Brasil</span>
        </div>
      </div>
    </div>
  )
}