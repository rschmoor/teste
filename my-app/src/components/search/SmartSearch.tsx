'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Loader2, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SearchFilters } from './SearchFilters';
import { SearchSuggestions } from './SearchSuggestions';
import { ActiveFilters } from './ActiveFilters';
import { useSearch } from '@/hooks/useSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchParams, SearchResult } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface SmartSearchProps {
  onSearch: (params: SearchParams) => void;
  onProductClick?: (productId: string) => void;
  placeholder?: string;
  showFilters?: boolean;
  showHistory?: boolean;
  className?: string;
}

export function SmartSearch({
  onSearch,
  onProductClick,
  placeholder = "Buscar produtos...",
  showFilters = true,
  showHistory = true,
  className
}: SmartSearchProps) {
  const { registerSearch } = useSearch();
  
  // Estados
  const [filters, setFilters] = useState<SearchParams>({});
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  
  // Executar busca
  const handleSearch = (term: string) => {
    const searchParams: SearchParams = {
      ...filters,
      term,
      page: 1,
      limit: 20
    };
    
    onSearch(searchParams);
    
    // Registrar busca se houver termo
    if (term) {
      registerSearch(term, 0); // 0 = não sabemos o resultado ainda
    }
  };
  
  // Clique em produto (se fornecido)
  const handleProductClick = (productId: string) => {
    if (onProductClick) {
      onProductClick(productId);
    }
  };
  
  // Aplicar filtros
  const handleFiltersChange = (newFilters: SearchParams) => {
    setFilters(newFilters);
    onSearch(newFilters);
  };
  
  // Remover filtro específico
  const removeFilter = (key: keyof SearchParams) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    onSearch(newFilters);
  };
  
  // Limpar todos os filtros
  const clearAllFilters = () => {
    const clearedFilters: SearchParams = {
      term: filters.term,
      page: 1,
      limit: filters.limit || 20
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };
  
  // Contar filtros ativos
  const activeFiltersCount = Object.keys(filters).filter(
    key => key !== 'page' && key !== 'limit' && key !== 'term' && filters[key as keyof SearchParams]
  ).length;
  
  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Campo de busca principal */}
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchSuggestions
            onSuggestionClick={handleSearch}
            currentTerm={filters.term || ''}
          />
        </div>
        
        {showFilters && (
          <Button
            variant="outline"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={cn(
              "flex items-center gap-2",
              activeFiltersCount > 0 && "border-primary text-primary"
            )}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        )}
      </div>
      
      {/* Filtros ativos */}
      {activeFiltersCount > 0 && (
        <ActiveFilters
          filters={filters}
          onRemoveFilter={removeFilter}
          onClearAll={clearAllFilters}
        />
      )}
      
      {/* Painel de filtros */}
      {showFilters && showFiltersPanel && (
        <SearchFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableCategories={['Roupas', 'Calçados', 'Acessórios', 'Bolsas']}
          availableBrands={['Nike', 'Adidas', 'Zara', 'H&M']}
          priceRange={{ min: 0, max: 1000 }}
        />
      )}
    </div>
  );
}