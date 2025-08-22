'use client';

import { X, Filter, RotateCcw } from 'lucide-react';
import { useFilters, FilterOption } from '@/hooks/useFilters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CategoryFilter } from './CategoryFilter';
import { BrandFilter } from './BrandFilter';
import { SizeFilter } from './SizeFilter';
import { ColorFilter } from './ColorFilter';
import { PriceFilter } from './PriceFilter';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  categories: FilterOption[];
  brands: FilterOption[];
  sizes: FilterOption[];
  colors: FilterOption[];
  isLoading?: boolean;
  className?: string;
  onClose?: () => void; // For mobile modal
  isMobile?: boolean;
}

export function FilterSidebar({
  categories,
  brands,
  sizes,
  colors,
  isLoading = false,
  className,
  onClose,
  isMobile = false
}: FilterSidebarProps) {
  const {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    activeFiltersCount
  } = useFilters();

  const handleCategoryChange = (category: string) => {
    const currentCategories = filters.category ? [filters.category] : [];
    updateFilter('category', category === filters.category ? '' : category);
  };

  const handleBrandChange = (brand: string) => {
    updateFilter('brand', brand === filters.brand ? '' : brand);
  };

  const handleSizeToggle = (size: string) => {
    const currentSizes = filters.sizes || [];
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size];
    updateFilter('sizes', newSizes);
  };

  const handleColorToggle = (color: string) => {
    const currentColors = filters.colors || [];
    const newColors = currentColors.includes(color)
      ? currentColors.filter(c => c !== color)
      : [...currentColors, color];
    updateFilter('colors', newColors);
  };

  const handlePriceRangeChange = (priceRange: [number, number]) => {
    updateFilter('priceRange', priceRange);
  };

  const getActiveFilterChips = () => {
    const chips: Array<{ type: string; value: string; label: string }> = [];

    // Category chip
    if (filters.category) {
      const category = categories.find(c => c.value === filters.category);
      if (category) {
        chips.push({ type: 'category', value: filters.category, label: category.label });
      }
    }

    // Brand chip
    if (filters.brand) {
      const brand = brands.find(b => b.value === filters.brand);
      if (brand) {
        chips.push({ type: 'brand', value: filters.brand, label: brand.label });
      }
    }

    // Size chips
    filters.sizes?.forEach(size => {
      const sizeOption = sizes.find(s => s.value === size);
      if (sizeOption) {
        chips.push({ type: 'sizes', value: size, label: sizeOption.label });
      }
    });

    // Color chips
    filters.colors?.forEach(color => {
      const colorOption = colors.find(c => c.value === color);
      if (colorOption) {
        chips.push({ type: 'colors', value: color, label: colorOption.label });
      }
    });

    // Price range chip
    if (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 1000) {
      chips.push({
        type: 'priceRange',
        value: 'price',
        label: `R$ ${filters.priceRange[0]} - R$ ${filters.priceRange[1]}`
      });
    }

    return chips;
  };

  const activeChips = getActiveFilterChips();

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 h-full flex flex-col",
      isMobile && "border-r-0 border-t",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Filtros</h2>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-black text-white">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          
          {isMobile && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Clear all filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="mt-2 w-full justify-start text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar todos os filtros
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filtros ativos</h3>
          <div className="flex flex-wrap gap-2">
            {activeChips.map((chip, index) => (
              <Badge
                key={`${chip.type}-${chip.value}-${index}`}
                variant="secondary"
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                onClick={() => {
                  if (chip.type === 'category') {
                    updateFilter('category', '');
                  } else if (chip.type === 'brand') {
                    updateFilter('brand', '');
                  } else if (chip.type === 'sizes') {
                    handleSizeToggle(chip.value);
                  } else if (chip.type === 'colors') {
                    handleColorToggle(chip.value);
                  } else if (chip.type === 'priceRange') {
                    updateFilter('priceRange', [0, 1000]);
                  }
                }}
              >
                {chip.label}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Filter content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategories={filters.category ? [filters.category] : []}
          onCategoryChange={handleCategoryChange}
          isLoading={isLoading}
        />

        <Separator />

        {/* Brand Filter */}
        <BrandFilter
          brands={brands}
          selectedBrands={filters.brand ? [filters.brand] : []}
          onBrandChange={handleBrandChange}
          isLoading={isLoading}
        />

        <Separator />

        {/* Size Filter */}
        <SizeFilter
          sizes={sizes}
          selectedSizes={filters.sizes || []}
          onSizeChange={handleSizeToggle}
          isLoading={isLoading}
        />

        <Separator />

        {/* Color Filter */}
        <ColorFilter
          colors={colors}
          selectedColors={filters.colors || []}
          onColorChange={handleColorToggle}
          isLoading={isLoading}
        />

        <Separator />

        {/* Price Filter */}
        <PriceFilter
          priceRange={filters.priceRange}
          onPriceRangeChange={handlePriceRangeChange}
          isLoading={isLoading}
        />
      </div>

      {/* Mobile apply button */}
      {isMobile && (
        <div className="p-4 border-t border-gray-200">
          <Button onClick={onClose} className="w-full">
            Ver Produtos
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white text-black">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}