// import { supabase } from '../supabase/client'
import { uploadProductImage } from '@/lib/supabase/storage'

export interface ImageUploadData {
  file: File
  url: string // Data URL para preview
  isPrimary: boolean
  description?: {
    tipo_peca?: string
    cores_identificadas?: string[]
    material_aparente?: string
    estilo?: string
    detalhes_especiais?: string
    publico_alvo?: string
    descricao_completa?: string
  }
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface ProcessedImage {
  url: string
  isPrimary: boolean
  description?: {
    tipo_peca?: string
    cores_identificadas?: string[]
    material_aparente?: string
    estilo?: string
    detalhes_especiais?: string
    publico_alvo?: string
    descricao_completa?: string
  }
}

/**
 * Aplica crop em uma imagem e retorna um novo File
 */
export async function applyCropToImage(
  file: File,
  crop: { x: number; y: number; width: number; height: number }
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const image = new Image()
    
    image.onload = () => {
      // Calcular dimensões do crop
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      
      canvas.width = crop.width * scaleX
      canvas.height = crop.height * scaleY
      
      // Desenhar a parte cropada
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      )
      
      // Converter canvas para blob e depois para File
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(croppedFile)
        }
      }, file.type, 0.9)
    }
    
    image.src = URL.createObjectURL(file)
  })
}

/**
 * Processa e faz upload de múltiplas imagens
 */
export async function uploadProductImages(
  images: ImageUploadData[],
  productId?: string
): Promise<ProcessedImage[]> {
  const uploadPromises = images.map(async (imageData, index) => {
    try {
      let fileToUpload = imageData.file
      
      // Aplicar crop se especificado
      if (imageData.crop) {
        fileToUpload = await applyCropToImage(imageData.file, imageData.crop)
      }
      
      // Fazer upload para o Supabase Storage
      const uploadResult = await uploadProductImage(fileToUpload, productId)
      
      if (uploadResult.error) {
        throw uploadResult.error
      }
      
      if (!uploadResult.data) {
        throw new Error('Falha no upload da imagem')
      }
      
      return {
        url: uploadResult.data.publicUrl,
        isPrimary: imageData.isPrimary,
        description: imageData.description
      }
    } catch (error) {
      console.error(`Erro no upload da imagem ${index + 1}:`, error)
      throw error
    }
  })
  
  return Promise.all(uploadPromises)
}

/**
 * Converte data URL para File
 */
export function dataURLtoFile(dataURL: string, filename: string): File {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  return new File([u8arr], filename, { type: mime })
}

/**
 * Redimensiona uma imagem mantendo a proporção
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.9
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const image = new Image()
    
    image.onload = () => {
      // Calcular novas dimensões mantendo proporção
      let { width, height } = image
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Desenhar imagem redimensionada
      ctx.drawImage(image, 0, 0, width, height)
      
      // Converter para blob e depois para File
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(resizedFile)
        }
      }, file.type, quality)
    }
    
    image.src = URL.createObjectURL(file)
  })
}