'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  uploadFile,
  uploadProductImage,
  deleteFile,
  deleteFiles,
  validateFiles,
  FILE_VALIDATION,
  type UploadOptions,
  type UploadResult,
} from '@/lib/supabase/storage';

export interface UploadProgress {
  fileIndex: number;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: UploadResult['data'];
}

export interface UseStorageOptions {
  bucket: string;
  path?: string;
  allowedTypes?: string[];
  maxSizeMB?: number;
  maxFiles?: number;
  compress?: boolean;
  onProgress?: (progress: UploadProgress[]) => void;
  onComplete?: (results: UploadResult[]) => void;
  onError?: (error: string) => void;
}

export function useStorage(options: UseStorageOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult['data'][]>([]);

  const {
    bucket,
    path,
    allowedTypes = FILE_VALIDATION.IMAGE_TYPES,
    maxSizeMB = FILE_VALIDATION.MAX_IMAGE_SIZE_MB,
    maxFiles = FILE_VALIDATION.MAX_FILES_PER_UPLOAD,
    compress = true,
    onProgress,
    onComplete,
    onError,
  } = options;

  const validateAndPrepareFiles = useCallback(
    (files: File[]): { valid: boolean; errors: string[] } => {
      return validateFiles(files, {
        allowedTypes,
        maxSizeMB,
        maxFiles,
      });
    },
    [allowedTypes, maxSizeMB, maxFiles]
  );

  const uploadFiles = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      // Validar arquivos
      const validation = validateAndPrepareFiles(files);
      if (!validation.valid) {
        const errorMessage = validation.errors.join(', ');
        toast.error(errorMessage);
        onError?.(errorMessage);
        return [];
      }

      setIsUploading(true);
      
      // Inicializar progresso
      const initialProgress: UploadProgress[] = files.map((file, index) => ({
        fileIndex: index,
        fileName: file.name,
        progress: 0,
        status: 'pending',
      }));
      
      setUploadProgress(initialProgress);
      onProgress?.(initialProgress);

      const results: UploadResult[] = [];

      try {
        // Upload sequencial para melhor controle de progresso
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Atualizar status para uploading
          setUploadProgress(prev => {
            const updated = prev.map(p => 
              p.fileIndex === i 
                ? { ...p, status: 'uploading' as const, progress: 0 }
                : p
            );
            onProgress?.(updated);
            return updated;
          });

          try {
            const uploadOptions: UploadOptions = {
              bucket,
              path,
              compress,
              maxSizeMB,
            };

            const result = await uploadFile(file, uploadOptions);
            results.push(result);

            if (result.error) {
              // Erro no upload
              setUploadProgress(prev => {
                const updated = prev.map(p => 
                  p.fileIndex === i 
                    ? { 
                        ...p, 
                        status: 'error' as const, 
                        progress: 0,
                        error: result.error?.message 
                      }
                    : p
                );
                onProgress?.(updated);
                return updated;
              });
              
              toast.error(`Erro ao enviar ${file.name}: ${result.error.message}`);
            } else {
              // Upload bem-sucedido
              setUploadProgress(prev => {
                const updated = prev.map(p => 
                  p.fileIndex === i 
                    ? { 
                        ...p, 
                        status: 'completed' as const, 
                        progress: 100,
                        result: result.data 
                      }
                    : p
                );
                onProgress?.(updated);
                return updated;
              });
              
              if (result.data) {
                setUploadedFiles(prev => [...prev, result.data]);
              }
              
              toast.success(`${file.name} enviado com sucesso!`);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            
            setUploadProgress(prev => {
              const updated = prev.map(p => 
                p.fileIndex === i 
                  ? { 
                      ...p, 
                      status: 'error' as const, 
                      progress: 0,
                      error: errorMessage 
                    }
                  : p
              );
              onProgress?.(updated);
              return updated;
            });
            
            results.push({ data: null, error: error as Error });
            toast.error(`Erro ao enviar ${file.name}: ${errorMessage}`);
          }
        }

        onComplete?.(results);
        return results;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
        toast.error(errorMessage);
        onError?.(errorMessage);
        return [];
      } finally {
        setIsUploading(false);
      }
    },
    [bucket, path, compress, maxSizeMB, validateAndPrepareFiles, onProgress, onComplete, onError]
  );

  const uploadProductImages = useCallback(
    async (files: File[], productId?: string): Promise<UploadResult[]> => {
      // Validar arquivos
      const validation = validateAndPrepareFiles(files);
      if (!validation.valid) {
        const errorMessage = validation.errors.join(', ');
        toast.error(errorMessage);
        onError?.(errorMessage);
        return [];
      }

      setIsUploading(true);
      
      const initialProgress: UploadProgress[] = files.map((file, index) => ({
        fileIndex: index,
        fileName: file.name,
        progress: 0,
        status: 'pending',
      }));
      
      setUploadProgress(initialProgress);
      onProgress?.(initialProgress);

      const results: UploadResult[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          setUploadProgress(prev => {
            const updated = prev.map(p => 
              p.fileIndex === i 
                ? { ...p, status: 'uploading' as const, progress: 0 }
                : p
            );
            onProgress?.(updated);
            return updated;
          });

          try {
            const result = await uploadProductImage(file, productId);
            results.push(result);

            if (result.error) {
              setUploadProgress(prev => {
                const updated = prev.map(p => 
                  p.fileIndex === i 
                    ? { 
                        ...p, 
                        status: 'error' as const, 
                        progress: 0,
                        error: result.error?.message 
                      }
                    : p
                );
                onProgress?.(updated);
                return updated;
              });
              
              toast.error(`Erro ao enviar ${file.name}: ${result.error.message}`);
            } else {
              setUploadProgress(prev => {
                const updated = prev.map(p => 
                  p.fileIndex === i 
                    ? { 
                        ...p, 
                        status: 'completed' as const, 
                        progress: 100,
                        result: result.data 
                      }
                    : p
                );
                onProgress?.(updated);
                return updated;
              });
              
              if (result.data) {
                setUploadedFiles(prev => [...prev, result.data]);
              }
              
              toast.success(`${file.name} enviado com sucesso!`);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            
            setUploadProgress(prev => {
              const updated = prev.map(p => 
                p.fileIndex === i 
                  ? { 
                      ...p, 
                      status: 'error' as const, 
                      progress: 0,
                      error: errorMessage 
                    }
                  : p
              );
              onProgress?.(updated);
              return updated;
            });
            
            results.push({ data: null, error: error as Error });
            toast.error(`Erro ao enviar ${file.name}: ${errorMessage}`);
          }
        }

        onComplete?.(results);
        return results;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
        toast.error(errorMessage);
        onError?.(errorMessage);
        return [];
      } finally {
        setIsUploading(false);
      }
    },
    [validateAndPrepareFiles, onProgress, onComplete, onError]
  );

  const removeFile = useCallback(
    async (filePath: string): Promise<boolean> => {
      try {
        const { error } = await deleteFile(bucket, filePath);
        
        if (error) {
          toast.error(`Erro ao remover arquivo: ${error.message}`);
          return false;
        }
        
        // Remover da lista de arquivos enviados
        setUploadedFiles(prev => prev.filter(file => file?.path !== filePath));
        
        toast.success('Arquivo removido com sucesso!');
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao remover arquivo';
        toast.error(errorMessage);
        return false;
      }
    },
    [bucket]
  );

  const removeFiles = useCallback(
    async (filePaths: string[]): Promise<boolean> => {
      try {
        const { error } = await deleteFiles(bucket, filePaths);
        
        if (error) {
          toast.error(`Erro ao remover arquivos: ${error.message}`);
          return false;
        }
        
        // Remover da lista de arquivos enviados
        setUploadedFiles(prev => 
          prev.filter(file => !filePaths.includes(file?.path || ''))
        );
        
        toast.success('Arquivos removidos com sucesso!');
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao remover arquivos';
        toast.error(errorMessage);
        return false;
      }
    },
    [bucket]
  );

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
    setUploadedFiles([]);
  }, []);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    clearProgress();
  }, [clearProgress]);

  return {
    // Estados
    isUploading,
    uploadProgress,
    uploadedFiles,
    
    // Funções
    uploadFiles,
    uploadProductImages,
    removeFile,
    removeFiles,
    validateAndPrepareFiles,
    clearProgress,
    resetUpload,
    
    // Utilitários
    hasErrors: uploadProgress.some(p => p.status === 'error'),
    isCompleted: uploadProgress.length > 0 && uploadProgress.every(p => p.status === 'completed'),
    successCount: uploadProgress.filter(p => p.status === 'completed').length,
    errorCount: uploadProgress.filter(p => p.status === 'error').length,
  };
}

// Hook específico para upload de imagens de produtos
export function useProductImageUpload(productId?: string) {
  return useStorage({
    bucket: 'products',
    path: productId ? `products/${productId}` : 'products',
    allowedTypes: FILE_VALIDATION.IMAGE_TYPES,
    maxSizeMB: 2,
    maxFiles: 5,
    compress: true,
  });
}