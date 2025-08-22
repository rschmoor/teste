'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface PriceFilterProps {
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  minPrice?: number;
  maxPrice?: number;
  isLoading?: boolean;
}

export function PriceFilter({
  priceRange,
  onPriceRangeChange,
  minPrice = 0,
  maxPrice = 1000,
  isLoading = false
}: PriceFilterProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localRange, setLocalRange] = useState<[number, number]>(priceRange);
  const [minInput, setMinInput] = useState(priceRange[0].toString());
  const [maxInput, setMaxInput] = useState(priceRange[1].toString());

  // Update local state when props change
  useEffect(() => {
    setLocalRange(priceRange);
    setMinInput(priceRange[0].toString());
    setMaxInput(priceRange[1].toString());
  }, [priceRange]);

  const handleSliderChange = (values: number[]) => {
    const newRange: [number, number] = [values[0], values[1]];
    setLocalRange(newRange);
    setMinInput(newRange[0].toString());
    setMaxInput(newRange[1].toString());
    onPriceRangeChange(newRange);
  };

  const handleMinInputChange = (value: string) => {
    setMinInput(value);
    const numValue = parseInt(value) || minPrice;
    if (numValue >= minPrice && numValue <= localRange[1]) {
      const newRange: [number, number] = [numValue, localRange[1]];
      setLocalRange(newRange);
      onPriceRangeChange(newRange);
    }
  };

  const handleMaxInputChange = (value: string) => {
    setMaxInput(value);
    const numValue = parseInt(value) || maxPrice;
    if (numValue <= maxPrice && numValue >= localRange[0]) {
      const newRange: [number, number] = [localRange[0], numValue];
      setLocalRange(newRange);
      onPriceRangeChange(newRange);
    }
  };

  const handleReset = () => {
    const defaultRange: [number, number] = [minPrice, maxPrice];
    setLocalRange(defaultRange);
    setMinInput(minPrice.toString());
    setMaxInput(maxPrice.toString());
    onPriceRangeChange(defaultRange);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const isDefaultRange = localRange[0] === minPrice && localRange[1] === maxPrice;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-2 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
          </div>
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
        <span>Preço</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-4">
          {/* Current range display */}
          <div className="text-center">
            <span className="text-sm font-medium text-gray-700">
              {formatPrice(localRange[0])} - {formatPrice(localRange[1])}
            </span>
          </div>

          {/* Range slider */}
          <div className="px-2">
            <Slider
              value={localRange}
              onValueChange={handleSliderChange}
              min={minPrice}
              max={maxPrice}
              step={10}
              className="w-full"
            />
          </div>

          {/* Min/Max inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="min-price" className="text-xs text-gray-600">
                Mínimo
              </Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  R$
                </span>
                <Input
                  id="min-price"
                  type="number"
                  value={minInput}
                  onChange={(e) => handleMinInputChange(e.target.value)}
                  min={minPrice}
                  max={localRange[1]}
                  className="pl-8 text-sm"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="max-price" className="text-xs text-gray-600">
                Máximo
              </Label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  R$
                </span>
                <Input
                  id="max-price"
                  type="number"
                  value={maxInput}
                  onChange={(e) => handleMaxInputChange(e.target.value)}
                  min={localRange[0]}
                  max={maxPrice}
                  className="pl-8 text-sm"
                  placeholder="1000"
                />
              </div>
            </div>
          </div>

          {/* Quick price ranges */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Faixas rápidas</Label>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {[
                [0, 50],
                [50, 100],
                [100, 200],
                [200, 500],
                [500, 1000],
                [1000, maxPrice]
              ].map(([min, max]) => (
                <Button
                  key={`${min}-${max}`}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSliderChange([min, max])}
                  className="h-7 text-xs"
                >
                  {formatPrice(min)} - {formatPrice(max)}
                </Button>
              ))}
            </div>
          </div>

          {/* Reset button */}
          {!isDefaultRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="w-full text-xs text-gray-600 hover:text-gray-800"
            >
              Limpar filtro de preço
            </Button>
          )}
        </div>
      )}
    </div>
  );
}