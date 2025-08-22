'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { FilterOption } from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

interface ColorFilterProps {
  colors: FilterOption[];
  selectedColors: string[];
  onColorChange: (color: string) => void;
  isLoading?: boolean;
}

// Mapeamento de cores para valores hexadecimais
const COLOR_MAP: Record<string, string> = {
  'preto': '#000000',
  'branco': '#FFFFFF',
  'cinza': '#808080',
  'vermelho': '#DC2626',
  'azul': '#2563EB',
  'verde': '#16A34A',
  'amarelo': '#EAB308',
  'rosa': '#EC4899',
  'roxo': '#9333EA',
  'laranja': '#EA580C',
  'marrom': '#A16207',
  'bege': '#D6D3D1',
  'navy': '#1E3A8A',
  'vinho': '#7F1D1D',
  'dourado': '#F59E0B',
  'prata': '#94A3B8'
};

export function ColorFilter({
  colors,
  selectedColors,
  onColorChange,
  isLoading = false
}: ColorFilterProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getColorValue = (colorName: string): string => {
    const normalizedName = colorName.toLowerCase().trim();
    return COLOR_MAP[normalizedName] || '#6B7280'; // Default gray if color not found
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-gray-700 transition-colors"
      >
        <span>Cores</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-2">
            {colors.map((color) => {
              const isSelected = selectedColors.includes(color.value);
              const colorValue = getColorValue(color.value);
              const isDisabled = color.count === 0;
              const isWhite = colorValue === '#FFFFFF';
              
              return (
                <div key={color.value} className="relative group">
                  <button
                    onClick={() => !isDisabled && onColorChange(color.value)}
                    disabled={isDisabled}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all duration-200 relative flex items-center justify-center",
                      isSelected
                        ? "border-gray-800 ring-2 ring-gray-300"
                        : "border-gray-300 hover:border-gray-400",
                      isWhite && "border-gray-400",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                    style={{ backgroundColor: colorValue }}
                    title={`${color.label}${color.count ? ` (${color.count})` : ''}`}
                  >
                    {isSelected && (
                      <Check 
                        className={cn(
                          "h-4 w-4",
                          colorValue === '#FFFFFF' || colorValue === '#F3F4F6' 
                            ? "text-gray-800" 
                            : "text-white"
                        )} 
                      />
                    )}
                  </button>
                  
                  {/* Tooltip com nome da cor */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {color.label}
                    {color.count !== undefined && ` (${color.count})`}
                  </div>
                  
                  {/* Contador de produtos */}
                  {color.count !== undefined && color.count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gray-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {color.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Lista de cores selecionadas */}
          {selectedColors.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Cores Selecionadas
              </h4>
              <div className="flex flex-wrap gap-1">
                {selectedColors.map((colorValue) => {
                  const color = colors.find(c => c.value === colorValue);
                  if (!color) return null;
                  
                  return (
                    <span
                      key={colorValue}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-xs rounded-full"
                    >
                      <div
                        className="h-3 w-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: getColorValue(colorValue) }}
                      />
                      {color.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          
          {colors.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              Nenhuma cor disponível
            </p>
          )}
        </div>
      )}
    </div>
  );
}