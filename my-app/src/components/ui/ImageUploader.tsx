'use client';

import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStorage, type UploadProgress } from '@/hooks/useStorage';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export interface ImageUploaderProps {
  bucket: string;
  path?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  onUploadComplete?: (files: Array<{ path: string; url: string; name: string }>) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  existingImages?: Array<{ path: string; url: string; name: string }>;
  onRemoveExisting?: (path: string) => void;
}

interface PreviewImage {
  file: File;
  preview: string;
  id: string;
}

export function ImageUploader({
  bucket,
  path,
  maxFiles = 5,
  maxSizeMB = 2,
  onUploadComplete,
  onUploadError,
  className,
  disabled = false,
  existingImages = [],
  onRemoveExisting,
}: ImageUploaderProps) {
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadFiles,
    isUploading,
    uploadProgress,
    clearProgress,
  } = useStorage({
    bucket,
    path,
    maxFiles,
    maxSizeMB,
    compress: true,
    onComplete: (results) => {
      const successfulUploads = results
        .filter(result => result.data && !result.error)
        .map((result, index) => ({
          path: result.data!.path,
          url: result.data!.publicUrl,
          name: previewImages[index]?.file.name || 'image',
        }));
      
      if (successfulUploads.length > 0) {
        onUploadComplete?.(successfulUploads);
        // Limpar previews após upload bem-sucedido
        setPreviewImages([]);
        clearProgress();
      }
    },
    onError: (error) => {
      onUploadError?.(error);
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (disabled) return;

      const totalFiles = previewImages.length + existingImages.length + acceptedFiles.length;
      if (totalFiles > maxFiles) {
        onUploadError?.(`Máximo de ${maxFiles} imagens permitidas`);
        return;
      }

      const newPreviews: PreviewImage[] = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
      }));

      setPreviewImages(prev => [...prev, ...newPreviews]);
    },
    [disabled, maxFiles, previewImages.length, existingImages.length, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxFiles,
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: disabled || isUploading,
  });

  const removePreview = useCallback((id: string) => {
    setPreviewImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      // Revogar URL do preview para liberar memória
      const removed = prev.find(img => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  }, []);

  const handleUpload = useCallback(async () => {
    if (previewImages.length === 0) return;
    
    const files = previewImages.map(img => img.file);
    await uploadFiles(files);
  }, [previewImages, uploadFiles]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getProgressForFile = useCallback(
    (fileName: string): UploadProgress | undefined => {
      return uploadProgress.find(p => p.fileName === fileName);
    },
    [uploadProgress]
  );

  const totalImages = existingImages.length + previewImages.length;
  const canAddMore = totalImages < maxFiles && !disabled;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Área de Drop */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            {isDragActive
              ? 'Solte as imagens aqui...'
              : 'Arraste imagens aqui ou clique para selecionar'}
          </p>
          <p className="text-xs text-gray-500">
            Máximo {maxFiles} imagens • Até {maxSizeMB}MB cada • JPG, PNG, WebP
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleFileSelect}
            disabled={disabled}
          >
            Selecionar Arquivos
          </Button>
        </div>
      )}

      {/* Imagens Existentes */}
      {existingImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Imagens Atuais</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {existingImages.map((image, index) => (
              <div key={`existing-${index}`} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(image.path)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview das Novas Imagens */}
      {previewImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              Novas Imagens ({previewImages.length})
            </h4>
            {!isUploading && (
              <Button
                type="button"
                onClick={handleUpload}
                size="sm"
                disabled={disabled}
              >
                <Upload className="h-4 w-4 mr-2" />
                Enviar Imagens
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {previewImages.map((image) => {
              const progress = getProgressForFile(image.file.name);
              
              return (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                    <Image
                      src={image.preview}
                      alt={image.file.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover"
                      unoptimized
                    />
                    
                    {/* Overlay de progresso */}
                    {progress && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        {progress.status === 'uploading' && (
                          <div className="text-center text-white">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                            <div className="text-xs">{progress.progress}%</div>
                          </div>
                        )}
                        {progress.status === 'completed' && (
                          <CheckCircle className="h-8 w-8 text-green-400" />
                        )}
                        {progress.status === 'error' && (
                          <div className="text-center text-white">
                            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-1" />
                            <div className="text-xs">Erro</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Botão de remover */}
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => removePreview(image.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={disabled}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  
                  {/* Nome do arquivo */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                    {image.file.name}
                  </div>
                  
                  {/* Indicador de status */}
                  {progress && (
                    <div className="absolute top-1 left-1">
                      {progress.status === 'pending' && (
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      )}
                      {progress.status === 'uploading' && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      )}
                      {progress.status === 'completed' && (
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                      )}
                      {progress.status === 'error' && (
                        <div className="w-2 h-2 bg-red-400 rounded-full" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Mensagens de erro */}
          {uploadProgress.some(p => p.status === 'error') && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              <div className="flex items-center mb-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                Erros no upload:
              </div>
              <ul className="list-disc list-inside space-y-1">
                {uploadProgress
                  .filter(p => p.status === 'error')
                  .map(p => (
                    <li key={p.fileIndex}>
                      {p.fileName}: {p.error}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Informações */}
      {totalImages >= maxFiles && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Limite máximo de {maxFiles} imagens atingido.
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;