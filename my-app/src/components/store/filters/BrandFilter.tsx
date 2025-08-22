'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FilterOption } from '@/hooks/useFilters';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface BrandFilterProps {
  brands: FilterOption[];
  selectedBrands: string[];
  onBrandChange: (brand: string) => void;
  isLoading?: boolean;
}

export function BrandFilter({
  brands,
  selectedBrands,
  onBrandChange,
  isLoading = false
}: BrandFilterProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-6 bg-gray-200 rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-gray-700 transition-colors"
      >
        <span>Marcas</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2">
          {brands.map((brand) => {
            const isSelected = selectedBrands.includes(brand.value);
            
            return (
              <div key={brand.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand.value}`}
                  checked={isSelected}
                  onCheckedChange={() => onBrandChange(brand.value)}
                  className="data-[state=checked]:bg-black data-[state=checked]:border-black"
                />
                <Label
                  htmlFor={`brand-${brand.value}`}
                  className="flex-1 text-sm font-normal cursor-pointer hover:text-gray-700 transition-colors"
                >
                  {brand.label}
                </Label>
                {brand.count !== undefined && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {brand.count}
                  </span>
                )}
              </div>
            );
          })}
          
          {brands.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              Nenhuma marca disponível
            </p>
          )}
        </div>
      )}
    </div>
  );
}