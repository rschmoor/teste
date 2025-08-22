'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FilterOption } from '@/hooks/useFilters';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SizeFilterProps {
  sizes: FilterOption[];
  selectedSizes: string[];
  onSizeChange: (size: string) => void;
  isLoading?: boolean;
}

export function SizeFilter({
  sizes,
  selectedSizes,
  onSizeChange,
  isLoading = false
}: SizeFilterProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Separate clothing sizes from shoe sizes
  const clothingSizes = sizes.filter(size => 
    ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'].includes(size.value)
  );
  const shoeSizes = sizes.filter(size => 
    !['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'].includes(size.value)
  );

  const renderSizeGrid = (sizeList: FilterOption[], title?: string) => {
    if (sizeList.length === 0) return null;

    return (
      <div className="space-y-2">
        {title && (
          <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </h4>
        )}
        <div className="grid grid-cols-4 gap-2">
          {sizeList.map((size) => {
            const isSelected = selectedSizes.includes(size.value);
            const isDisabled = size.count === 0;
            
            return (
              <Button
                key={size.value}
                variant="outline"
                size="sm"
                onClick={() => !isDisabled && onSizeChange(size.value)}
                disabled={isDisabled}
                className={cn(
                  "h-8 text-xs font-medium transition-all duration-200 relative",
                  isSelected
                    ? "bg-black text-white border-black hover:bg-gray-800"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {size.label}
                {size.count !== undefined && size.count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {size.count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-gray-700 transition-colors"
      >
        <span>Tamanhos</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4">
          {renderSizeGrid(clothingSizes, clothingSizes.length > 0 ? "Roupas" : undefined)}
          {renderSizeGrid(shoeSizes, shoeSizes.length > 0 ? "Calçados" : undefined)}
          
          {sizes.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              Nenhum tamanho disponível
            </p>
          )}
        </div>
      )}
    </div>
  );
}