import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Loader2, 
  RefreshCw, 
  Star, 
  Trash2, 
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react'
import Image from 'next/image'

interface ImageDescription {
  tipo_peca: string
  cores_identificadas: string[]
  material_aparente: string
  estilo: string
  detalhes_especiais: string
  publico_alvo: string
  descricao_completa: string
}

interface ProductImage {
  id: string
  url: string
  file: File
  isPrimary: boolean
  description?: ImageDescription
  isGeneratingDescription?: boolean
}

interface ImageWithAIProps {
  image: ProductImage
  onUpdate: (image: ProductImage) => void
  onDelete: (imageId: string) => void
  onSetPrimary: (imageId: string) => void
}

export function ImageWithAI({ 
  image, 
  onUpdate, 
  onDelete, 
  onSetPrimary 
}: ImageWithAIProps) {
  const [showDescription, setShowDescription] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateDescription = async () => {
    setIsGenerating(true)
    
    try {
      const formData = new FormData()
      formData.append('image', image.file)
      
      const response = await fetch('/api/ai/describe-image', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        onUpdate({
          ...image,
          description: data.description,
          isGeneratingDescription: false
        })
      } else {
        console.error('Erro ao gerar descrição:', data.error)
        alert('Erro ao gerar descrição: ' + data.error)
      }
    } catch (error) {
      console.error('Erro ao gerar descrição:', error)
      alert('Erro ao gerar descrição')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDescriptionChange = (field: keyof ImageDescription, value: string | string[]) => {
    if (!image.description) return
    
    onUpdate({
      ...image,
      description: {
        ...image.description,
        [field]: value
      }
    })
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {/* Imagem */}
        <div className="aspect-square relative bg-gray-100">
          <Image
            src={image.url}
            alt="Produto"
            fill
            className="object-cover"
          />
          
          {/* Badge Principal */}
          {image.isPrimary && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              Principal
            </Badge>
          )}
          
          {/* Status da IA */}
          {image.description && (
            <Badge className="absolute top-2 right-2 bg-purple-500 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              IA
            </Badge>
          )}
        </div>
        
        {/* Controles */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 bg-white/90 hover:bg-white"
            onClick={() => onSetPrimary(image.id)}
            disabled={image.isPrimary}
          >
            <Star className="h-3 w-3 mr-1" />
            {image.isPrimary ? 'Principal' : 'Definir Principal'}
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            className="bg-red-500/90 hover:bg-red-500"
            onClick={() => onDelete(image.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        {/* Controles da Descrição */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDescription(!showDescription)}
            >
              {showDescription ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showDescription ? 'Ocultar' : 'Ver'} Descrição
            </Button>
            
            {image.description && (
              <Badge variant="secondary" className="text-xs">
                Descrição IA
              </Badge>
            )}
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={generateDescription}
            disabled={isGenerating || image.isGeneratingDescription}
          >
            {(isGenerating || image.isGeneratingDescription) ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            {image.description ? 'Regenerar' : 'Gerar'} IA
          </Button>
        </div>
        
        {/* Loading da Descrição */}
        {(isGenerating || image.isGeneratingDescription) && (
          <div className="flex items-center justify-center py-4 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Gerando descrição com IA...
          </div>
        )}
        
        {/* Descrição Expandida */}
        {showDescription && image.description && (
          <div className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-xs font-medium text-gray-600">Tipo</Label>
                <div className="mt-1">{image.description.tipo_peca}</div>
              </div>
              
              <div>
                <Label className="text-xs font-medium text-gray-600">Estilo</Label>
                <div className="mt-1">{image.description.estilo}</div>
              </div>
              
              <div>
                <Label className="text-xs font-medium text-gray-600">Material</Label>
                <div className="mt-1">{image.description.material_aparente}</div>
              </div>
              
              <div>
                <Label className="text-xs font-medium text-gray-600">Público</Label>
                <div className="mt-1">{image.description.publico_alvo}</div>
              </div>
            </div>
            
            <div>
              <Label className="text-xs font-medium text-gray-600">Cores</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {image.description.cores_identificadas.map((cor, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {cor}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-xs font-medium text-gray-600">Detalhes Especiais</Label>
              <Textarea
                value={image.description.detalhes_especiais}
                onChange={(e) => handleDescriptionChange('detalhes_especiais', e.target.value)}
                className="mt-1 text-sm"
                rows={2}
              />
            </div>
            
            <div>
              <Label className="text-xs font-medium text-gray-600">Descrição Completa</Label>
              <Textarea
                value={image.description.descricao_completa}
                onChange={(e) => handleDescriptionChange('descricao_completa', e.target.value)}
                className="mt-1 text-sm"
                rows={3}
              />
            </div>
          </div>
        )}
        
        {/* Mensagem quando não há descrição */}
        {showDescription && !image.description && !isGenerating && !image.isGeneratingDescription && (
          <div className="text-center py-4 text-sm text-gray-500">
            Clique em "Gerar IA" para criar uma descrição automática
          </div>
        )}
      </CardContent>
    </Card>
  )
}