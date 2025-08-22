'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProductReview {
  id: string
  userName: string
  rating: number
  comment: string
  date: string
  verified: boolean
}

export interface ProductSpecification {
  label: string
  value: string
}

export interface ProductMeasurement {
  size: string
  chest?: string
  waist?: string
  hip?: string
  length?: string
  [key: string]: string | undefined
}

export interface ProductTabsProps {
  // Description
  description?: string
  features?: string[]
  careInstructions?: string[]
  materials?: string[]
  
  // Specifications
  specifications?: ProductSpecification[]
  
  // Measurements
  measurements?: ProductMeasurement[]
  measurementGuide?: string
  
  // Reviews
  reviews?: ProductReview[]
  averageRating?: number
  totalReviews?: number
  ratingDistribution?: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  
  // Loading state
  isLoading?: boolean
}

export function ProductTabs({
  description,
  features = [],
  careInstructions = [],
  materials = [],
  specifications = [],
  measurements = [],
  measurementGuide,
  reviews = [],
  averageRating = 0,
  totalReviews = 0,
  ratingDistribution,
  isLoading = false
}: ProductTabsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }
  
  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="description">Descrição</TabsTrigger>
        <TabsTrigger value="specifications">Detalhes</TabsTrigger>
        <TabsTrigger value="reviews" className="relative">
          Avaliações
          {totalReviews > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {totalReviews}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      
      {/* Description Tab */}
      <TabsContent value="description" className="mt-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            {description && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Descrição do Produto</h3>
                <p className="text-gray-700 leading-relaxed">{description}</p>
              </div>
            )}
            
            {features.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Características</h3>
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {materials.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Materiais</h3>
                <div className="flex flex-wrap gap-2">
                  {materials.map((material, index) => (
                    <Badge key={index} variant="outline">
                      {material}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {careInstructions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Cuidados</h3>
                <ul className="space-y-2">
                  {careInstructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700">{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Specifications Tab */}
      <TabsContent value="specifications" className="mt-6">
        <div className="space-y-6">
          {specifications.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Especificações Técnicas</h3>
                <div className="space-y-3">
                  {specifications.map((spec, index) => (
                    <div key={index} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="font-medium text-gray-600">{spec.label}:</span>
                      <span className="text-gray-900">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {measurements.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Tabela de Medidas</h3>
                  {measurementGuide && (
                    <Badge variant="outline" className="text-xs">
                      {measurementGuide}
                    </Badge>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Tamanho</th>
                        {measurements[0] && Object.keys(measurements[0]).filter(key => key !== 'size').map(key => (
                          <th key={key} className="text-center py-2 font-medium capitalize">
                            {key === 'chest' ? 'Peito' : 
                             key === 'waist' ? 'Cintura' :
                             key === 'hip' ? 'Quadril' :
                             key === 'length' ? 'Comprimento' : key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((measurement, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 font-medium">{measurement.size}</td>
                          {Object.entries(measurement).filter(([key]) => key !== 'size').map(([key, value]) => (
                            <td key={key} className="text-center py-2">{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
      
      {/* Reviews Tab */}
      <TabsContent value="reviews" className="mt-6">
        <div className="space-y-6">
          {/* Rating Summary */}
          {totalReviews > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Overall Rating */}
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
                    <div className="flex items-center justify-center mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-5 w-5",
                            i < Math.floor(averageRating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      Baseado em {totalReviews} avaliações
                    </p>
                  </div>
                  
                  {/* Rating Distribution */}
                  {ratingDistribution && (
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = ratingDistribution[rating as keyof typeof ratingDistribution] || 0
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                        
                        return (
                          <div key={rating} className="flex items-center gap-2 text-sm">
                            <span className="w-8">{rating}★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-400 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-8 text-gray-600">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Individual Reviews */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{review.userName}</span>
                          {review.verified && (
                            <Badge variant="outline" className="text-xs">
                              Compra verificada
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < review.rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Star className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhuma avaliação ainda
                </h3>
                <p className="text-gray-500">
                  Seja o primeiro a avaliar este produto
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}