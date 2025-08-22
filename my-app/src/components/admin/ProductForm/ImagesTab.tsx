'use client'

import React, { useState, useRef, useCallback } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { CreateProduct } from '@/lib/validations/product'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Image as ImageIcon, 
  AlertTriangle, 
  Move,
  Crop as CropIcon,
  Download
} from 'lucide-react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { ImageWithAI } from './ImageWithAI'
import { storeTempImageFile, removeTempImageFile } from '@/lib/utils/product-images'
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
  crop?: PixelCrop
}

interface ImagesTabProps {
  form: UseFormReturn<CreateProduct>
}

export function ImagesTab({ form }: ImagesTabProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [cropImage, setCropImage] = useState<ProductImage | null>(null)
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Atualizar formulário quando imagens mudarem
  React.useEffect(() => {
    form.setValue('images', images.map(img => ({
      url: img.url,
      isPrimary: img.isPrimary,
      description: img.description
    })))
  }, [images, form])

  // Upload de imagens
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (images.length + files.length > 5) {
      alert('Máximo de 5 imagens permitidas')
      return
    }

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} não é uma imagem válida`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
        const newImage: ProductImage = {
          id: imageId,
          url: e.target?.result as string,
          file,
          isPrimary: images.length === 0, // Primeira imagem é principal
          isGeneratingDescription: true
        }
        
        // Armazenar arquivo temporariamente
        storeTempImageFile(imageId, file)
        
        setImages(prev => {
          const updated = [...prev, newImage]
          
          // Gerar descrição automaticamente
          setTimeout(() => {
            generateDescriptionForImage(newImage.id)
          }, 100)
          
          return updated
        })
      }
      reader.readAsDataURL(file)
    })

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [images.length])

  // Gerar descrição IA para uma imagem
  const generateDescriptionForImage = async (imageId: string) => {
    const image = images.find(img => img.id === imageId)
    if (!image) return

    try {
      const formData = new FormData()
      formData.append('image', image.file)
      
      const response = await fetch('/api/ai/describe-image', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        setImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, description: data.description, isGeneratingDescription: false }
            : img
        ))
      } else {
        console.error('Erro ao gerar descrição:', data.error)
        setImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, isGeneratingDescription: false }
            : img
        ))
      }
    } catch (error) {
      console.error('Erro ao gerar descrição:', error)
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, isGeneratingDescription: false }
          : img
      ))
    }
  }

  // Atualizar imagem
  const handleImageUpdate = useCallback((updatedImage: ProductImage) => {
    setImages(prev => prev.map(img => 
      img.id === updatedImage.id ? updatedImage : img
    ))
  }, [])

  // Deletar imagem
  const handleImageDelete = useCallback((imageId: string) => {
    // Remover arquivo temporário
    removeTempImageFile(imageId)
    
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId)
      
      // Se a imagem deletada era principal, definir a primeira como principal
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        filtered[0].isPrimary = true
      }
      
      return filtered
    })
  }, [])

  // Definir imagem principal
  const handleSetPrimary = useCallback((imageId: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    })))
  }, [])

  // Drag and Drop para reordenar
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null) return
    
    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    
    newImages.splice(draggedIndex, 1)
    newImages.splice(dropIndex, 0, draggedImage)
    
    setImages(newImages)
    setDraggedIndex(null)
  }

  // Crop da imagem
  const handleCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop)
  }

  const applyCrop = () => {
    if (!cropImage || !completedCrop || !imgRef.current) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const image = imgRef.current
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = completedCrop.width
    canvas.height = completedCrop.height

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    )

    canvas.toBlob((blob) => {
      if (!blob || !cropImage) return
      
      const croppedFile = new File([blob], cropImage.file.name, {
        type: cropImage.file.type
      })
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const croppedUrl = e.target?.result as string
        
        setImages(prev => prev.map(img => 
          img.id === cropImage.id 
            ? { ...img, url: croppedUrl, file: croppedFile, crop: completedCrop }
            : img
        ))
        
        setCropImage(null)
      }
      reader.readAsDataURL(croppedFile)
    })
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Imagens do Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              
              <div className="space-y-2">
                <p className="text-lg font-medium">Adicionar Imagens</p>
                <p className="text-sm text-gray-500">
                  Arraste imagens aqui ou clique para selecionar
                </p>
                <p className="text-xs text-gray-400">
                  Máximo 5 imagens • JPG, PNG • Até 10MB cada
                </p>
              </div>
              
              <Button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4"
                disabled={images.length >= 5}
              >
                Selecionar Imagens
              </Button>
            </div>
            
            {/* Informações */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {images.length}/5 imagens
                </Badge>
                
                {images.some(img => img.isPrimary) && (
                  <Badge className="bg-yellow-500">
                    Imagem principal definida
                  </Badge>
                )}
              </div>
              
              {images.length > 1 && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Move className="h-3 w-3" />
                  Arraste para reordenar
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {images.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Adicione pelo menos uma imagem do produto. A primeira imagem será definida como principal automaticamente.
          </AlertDescription>
        </Alert>
      )}

      {images.length > 0 && !images.some(img => img.isPrimary) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Defina uma imagem como principal clicando no botão "Definir Principal".
          </AlertDescription>
        </Alert>
      )}

      {/* Grid de Imagens */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="relative group cursor-move"
            >
              <ImageWithAI
                image={image}
                onUpdate={handleImageUpdate}
                onDelete={handleImageDelete}
                onSetPrimary={handleSetPrimary}
              />
              
              {/* Botão de Crop */}
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90"
                onClick={() => setCropImage(image)}
              >
                <CropIcon className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Crop */}
      {cropImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>Recortar Imagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={handleCropComplete}
                  aspect={1}
                  minWidth={100}
                  minHeight={100}
                >
                  <img
                    ref={imgRef}
                    src={cropImage.url}
                    alt="Crop"
                    className="max-w-full max-h-[60vh] object-contain"
                  />
                </ReactCrop>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setCropImage(null)}
                >
                  Cancelar
                </Button>
                <Button onClick={applyCrop}>
                  Aplicar Recorte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}