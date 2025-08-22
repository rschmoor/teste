// Armazenamento temporário para arquivos de imagem durante a criação do produto

interface TempImageFile {
  id: string
  file: File
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
}

// Map para armazenar arquivos temporariamente
const tempImageFiles = new Map<string, TempImageFile>()

/**
 * Armazena um arquivo de imagem temporariamente
 */
export function storeTempImageFile(id: string, file: File, crop?: { x: number; y: number; width: number; height: number }) {
  tempImageFiles.set(id, { id, file, crop })
}

/**
 * Recupera um arquivo de imagem temporário
 */
export function getTempImageFile(id: string): TempImageFile | undefined {
  return tempImageFiles.get(id)
}

/**
 * Recupera todos os arquivos de imagem temporários
 */
export function getAllTempImageFiles(): TempImageFile[] {
  return Array.from(tempImageFiles.values())
}

/**
 * Remove um arquivo de imagem temporário
 */
export function removeTempImageFile(id: string) {
  tempImageFiles.delete(id)
}

/**
 * Limpa todos os arquivos de imagem temporários
 */
export function clearTempImageFiles() {
  tempImageFiles.clear()
}

/**
 * Converte dados de imagem do formulário para dados de upload
 */
export function convertFormImagesToUploadData(formImages: Array<{
  url: string
  isPrimary: boolean
  description?: string
}>): Array<{
  file: File
  url: string
  isPrimary: boolean
  description?: string
  crop?: { x: number; y: number; width: number; height: number }
}> {
  return formImages.map(img => {
    // Extrair ID da URL (assumindo que está no final da URL)
    const urlParts = img.url.split('/')
    const imageId = urlParts[urlParts.length - 1].split('.')[0]
    
    const tempFile = getTempImageFile(imageId)
    
    if (!tempFile) {
      throw new Error(`Arquivo não encontrado para imagem: ${imageId}`)
    }
    
    return {
      file: tempFile.file,
      url: img.url,
      isPrimary: img.isPrimary,
      description: img.description,
      crop: tempFile.crop
    }
  })
}