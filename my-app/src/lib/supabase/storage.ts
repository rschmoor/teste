import { supabase } from './client';
// import { createClient } from './server';
import imageCompression from 'browser-image-compression';

export interface UploadOptions {
  bucket: string;
  path?: string;
  upsert?: boolean;
  compress?: boolean;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

export interface UploadResult {
  data: {
    path: string;
    fullPath: string;
    publicUrl: string;
  } | null;
  error: Error | null;
}

/**
 * Upload genérico de arquivo
 */
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    let fileToUpload = file;
    
    // Compressão de imagem se necessário
    if (options.compress && file.type.startsWith('image/')) {
      const compressionOptions = {
        maxSizeMB: options.maxSizeMB || 5,
        maxWidthOrHeight: options.maxWidthOrHeight || 1920,
        useWebWorker: true,
      };
      
      fileToUpload = await imageCompression(file, compressionOptions);
    }

    // Gerar nome único se não especificado
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    
    const filePath = options.path 
      ? `${options.path}/${fileName}`
      : fileName;

    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, fileToUpload, {
        upsert: options.upsert || false,
      });

    if (error) {
      throw error;
    }

    const publicUrl = getPublicUrl(options.bucket, data.path);

    return {
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error as Error,
    };
  }
}

/**
 * Upload específico para imagens de produtos
 */
export async function uploadProductImage(
  file: File,
  productId?: string
): Promise<UploadResult> {
  const path = productId ? `products/${productId}` : 'products';
  
  return uploadFile(file, {
    bucket: 'products',
    path,
    compress: true,
    maxSizeMB: 2,
    maxWidthOrHeight: 1200,
  });
}

/**
 * Deletar arquivo do storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Deletar múltiplos arquivos
 */
export async function deleteFiles(
  bucket: string,
  paths: string[]
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Obter URL pública de um arquivo
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Obter URL temporária (assinada) de um arquivo
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600 // 1 hora por padrão
): Promise<{ data: { signedUrl: string } | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Listar arquivos em um bucket/pasta
 */
export async function listFiles(
  bucket: string,
  path?: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order: 'asc' | 'desc' };
  }
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, options);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Verificar se um arquivo existe
 */
export async function fileExists(
  bucket: string,
  path: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'));

    if (error) {
      return false;
    }

    const fileName = path.split('/').pop();
    return data.some(file => file.name === fileName);
  } catch {
    return false;
  }
}

/**
 * Obter informações de um arquivo
 */
export async function getFileInfo(
  bucket: string,
  path: string
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'));

    if (error) {
      throw error;
    }

    const fileName = path.split('/').pop();
    const fileInfo = data.find(file => file.name === fileName);

    return { data: fileInfo || null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Validar tipo de arquivo
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });
}

/**
 * Validar tamanho do arquivo
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number
): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Constantes para validação
 */
export const FILE_VALIDATION = {
  IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_IMAGE_SIZE_MB: 5,
  MAX_FILE_SIZE_MB: 10,
  MAX_FILES_PER_UPLOAD: 5,
} as const;

/**
 * Função para validar múltiplos arquivos
 */
export function validateFiles(
  files: File[],
  options: {
    allowedTypes?: string[];
    maxSizeMB?: number;
    maxFiles?: number;
  } = {}
): { valid: boolean; errors: string[] } {
  const {
    allowedTypes = FILE_VALIDATION.IMAGE_TYPES,
    maxSizeMB = FILE_VALIDATION.MAX_IMAGE_SIZE_MB,
    maxFiles = FILE_VALIDATION.MAX_FILES_PER_UPLOAD,
  } = options;

  const errors: string[] = [];

  if (files.length > maxFiles) {
    errors.push(`Máximo de ${maxFiles} arquivos permitidos`);
  }

  files.forEach((file, index) => {
    if (!validateFileType(file, allowedTypes)) {
      errors.push(`Arquivo ${index + 1}: Tipo não permitido (${file.type})`);
    }

    if (!validateFileSize(file, maxSizeMB)) {
      errors.push(`Arquivo ${index + 1}: Tamanho excede ${maxSizeMB}MB`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}