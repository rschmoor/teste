'use client';

import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SearchParams } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  filters: SearchParams;
  onFiltersChange: (filters: SearchParams) => void;
  availableCategories?: string[];
  availableBrands?: string[];
  priceRange?: { min: number; max: number };
  className?: string;
  isMobile?: boolean;
}

interface FilterSection {
  id: string;
  title: string;
  isOpen: boolean;
}

export function SearchFilters({
  filters,
  onFiltersChange,
  availableCategories = [],
  availableBrands = [],
  priceRange = { min: 0, max: 1000 },
  className,
  isMobile = false
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SearchParams>(filters);
  const [sections, setSections] = useState<FilterSection[]>([
    { id: 'category', title: 'Categorias', isOpen: true },
    { id: 'brand', title: 'Marcas', isOpen: true },
    { id: 'price', title: 'Preço', isOpen: true },
    { id: 'availability', title: 'Disponibilidade', isOpen: true },
    { id: 'attributes', title: 'Atributos', isOpen: false }
  ]);
  
  // Sincronizar filtros locais com props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  // Aplicar filtros
  const applyFilters = () => {
    onFiltersChange(localFilters);
  };
  
  // Limpar filtros
  const clearFilters = () => {
    const clearedFilters: SearchParams = {
      term: localFilters.term,
      sortBy: localFilters.sortBy,
      page: 1,
      limit: localFilters.limit
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };
  
  // Alternar seção
  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isOpen: !section.isOpen }
        : section
    ));
  };
  
  // Contar filtros ativos
  const activeFiltersCount = [
    localFilters.category,
    localFilters.brand,
    localFilters.minPrice,
    localFilters.maxPrice,
    localFilters.inStockOnly
  ].filter(Boolean).length;
  
  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };
  
  const FiltersContent = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="font-semibold">Filtros</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
      
      {/* Categorias */}
      <Collapsible
        open={sections.find(s => s.id === 'category')?.isOpen}
        onOpenChange={() => toggleSection('category')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <span className="font-medium">Categorias</span>
            {sections.find(s => s.id === 'category')?.isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {availableCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={localFilters.category === category}
                onCheckedChange={(checked) => {
                  setLocalFilters(prev => ({
                    ...prev,
                    category: checked ? category : undefined
                  }));
                }}
              />
              <Label
                htmlFor={`category-${category}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category}
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
      
      {/* Marcas */}
      <Collapsible
        open={sections.find(s => s.id === 'brand')?.isOpen}
        onOpenChange={() => toggleSection('brand')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <span className="font-medium">Marcas</span>
            {sections.find(s => s.id === 'brand')?.isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {availableBrands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand}`}
                checked={localFilters.brand === brand}
                onCheckedChange={(checked) => {
                  setLocalFilters(prev => ({
                    ...prev,
                    brand: checked ? brand : undefined
                  }));
                }}
              />
              <Label
                htmlFor={`brand-${brand}`}
                className="text-sm font-normal cursor-pointer"
              >
                {brand}
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
      
      {/* Preço */}
      <Collapsible
        open={sections.find(s => s.id === 'price')?.isOpen}
        onOpenChange={() => toggleSection('price')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <span className="font-medium">Preço</span>
            {sections.find(s => s.id === 'price')?.isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-2">
          {/* Slider de preço */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{formatPrice(localFilters.minPrice || priceRange.min)}</span>
              <span>{formatPrice(localFilters.maxPrice || priceRange.max)}</span>
            </div>
            <Slider
              value={[
                localFilters.minPrice || priceRange.min,
                localFilters.maxPrice || priceRange.max
              ]}
              onValueChange={([min, max]) => {
                setLocalFilters(prev => ({
                  ...prev,
                  minPrice: min,
                  maxPrice: max
                }));
              }}
              min={priceRange.min}
              max={priceRange.max}
              step={10}
              className="w-full"
            />
          </div>
          
          {/* Inputs de preço */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="min-price" className="text-xs">Mín</Label>
              <Input
                id="min-price"
                type="number"
                placeholder="0"
                value={localFilters.minPrice || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined;
                  setLocalFilters(prev => ({ ...prev, minPrice: value }));
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="max-price" className="text-xs">Máx</Label>
              <Input
                id="max-price"
                type="number"
                placeholder="1000"
                value={localFilters.maxPrice || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined;
                  setLocalFilters(prev => ({ ...prev, maxPrice: value }));
                }}
                className="h-8"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Disponibilidade */}
      <Collapsible
        open={sections.find(s => s.id === 'availability')?.isOpen}
        onOpenChange={() => toggleSection('availability')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <span className="font-medium">Disponibilidade</span>
            {sections.find(s => s.id === 'availability')?.isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="in-stock" className="text-sm font-normal">
              Apenas produtos em estoque
            </Label>
            <Switch
              id="in-stock"
              checked={localFilters.inStockOnly || false}
              onCheckedChange={(checked) => {
                setLocalFilters(prev => ({
                  ...prev,
                  inStockOnly: checked
                }));
              }}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Botões de ação */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={applyFilters} className="flex-1">
          Aplicar Filtros
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="outline" onClick={clearFilters}>
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
  
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>Filtros de Busca</SheetTitle>
            <SheetDescription>
              Refine sua busca usando os filtros abaixo
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <FiltersContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <FiltersContent />
      </CardContent>
    </Card>
  );
}

// Componente de filtros ativos
export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll
}: {
  filters: SearchParams;
  onRemoveFilter: (key: keyof SearchParams) => void;
  onClearAll: () => void;
}) {
  const activeFilters = [];
  
  if (filters.category) {
    activeFilters.push({
      key: 'category' as keyof SearchParams,
      label: `Categoria: ${filters.category}`,
      value: filters.category
    });
  }
  
  if (filters.brand) {
    activeFilters.push({
      key: 'brand' as keyof SearchParams,
      label: `Marca: ${filters.brand}`,
      value: filters.brand
    });
  }
  
  if (filters.minPrice) {
    activeFilters.push({
      key: 'minPrice' as keyof SearchParams,
      label: `Preço mín: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(filters.minPrice)}`,
      value: filters.minPrice
    });
  }
  
  if (filters.maxPrice) {
    activeFilters.push({
      key: 'maxPrice' as keyof SearchParams,
      label: `Preço máx: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(filters.maxPrice)}`,
      value: filters.maxPrice
    });
  }
  
  if (filters.inStockOnly) {
    activeFilters.push({
      key: 'inStockOnly' as keyof SearchParams,
      label: 'Em estoque',
      value: true
    });
  }
  
  if (activeFilters.length === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-600">Filtros ativos:</span>
      {activeFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="cursor-pointer hover:bg-gray-200"
          onClick={() => onRemoveFilter(filter.key)}
        >
          {filter.label}
          <X className="h-3 w-3 ml-1" />
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-red-600 hover:text-red-700 h-6 px-2"
      >
        Limpar todos
      </Button>
    </div>
  );
}