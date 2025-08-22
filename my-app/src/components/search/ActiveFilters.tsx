'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchParams } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface ActiveFiltersProps {
  filters: SearchParams;
  onRemoveFilter: (key: keyof SearchParams) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
  className
}: ActiveFiltersProps) {
  // Filtros que devem ser exibidos
  const displayFilters = [
    { key: 'category' as keyof SearchParams, label: 'Categoria', value: filters.category },
    { key: 'brand' as keyof SearchParams, label: 'Marca', value: filters.brand },
    { key: 'minPrice' as keyof SearchParams, label: 'Preço mín.', value: filters.minPrice },
    { key: 'maxPrice' as keyof SearchParams, label: 'Preço máx.', value: filters.maxPrice },
    { key: 'inStockOnly' as keyof SearchParams, label: 'Em estoque', value: filters.inStockOnly },
    { key: 'sortBy' as keyof SearchParams, label: 'Ordenação', value: filters.sortBy }
  ].filter(filter => {
    // Não exibir filtros vazios ou padrão
    if (!filter.value) return false;
    if (filter.key === 'inStockOnly' && !filter.value) return false;
    if (filter.key === 'sortBy' && filter.value === 'relevance') return false;
    return true;
  });

  // Formatação de valores
  const formatValue = (key: keyof SearchParams, value: any): string => {
    switch (key) {
      case 'minPrice':
        return `R$ ${value}`;
      case 'maxPrice':
        return `R$ ${value}`;
      case 'inStockOnly':
        return 'Sim';
      case 'sortBy':
        const sortLabels: Record<string, string> = {
          'relevance': 'Relevância',
          'price_asc': 'Menor preço',
          'price_desc': 'Maior preço',
          'name': 'Nome A-Z',
          'created_at': 'Mais recentes'
        };
        return sortLabels[value] || value;
      default:
        return String(value);
    }
  };

  if (displayFilters.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-gray-600 font-medium">Filtros ativos:</span>
      
      {displayFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1"
        >
          <span className="text-xs">
            {filter.label}: {formatValue(filter.key, filter.value)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveFilter(filter.key)}
            className="h-3 w-3 p-0 hover:bg-transparent"
          >
            <X className="h-2 w-2" />
          </Button>
        </Badge>
      ))}
      
      {displayFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs text-red-600 hover:text-red-700 h-6 px-2"
        >
          Limpar todos
        </Button>
      )}
    </div>
  );
}

// Componente para exibir um resumo dos filtros
export function FiltersSummary({
  filters,
  className
}: {
  filters: SearchParams;
  className?: string;
}) {
  const activeCount = Object.keys(filters).filter(
    key => key !== 'page' && key !== 'limit' && key !== 'term' && filters[key as keyof SearchParams]
  ).length;

  if (activeCount === 0) {
    return null;
  }

  return (
    <div className={cn("text-sm text-gray-600", className)}>
      {activeCount} filtro{activeCount > 1 ? 's' : ''} ativo{activeCount > 1 ? 's' : ''}
    </div>
  );
}

// Hook para gerenciar filtros ativos
export function useActiveFilters(initialFilters: SearchParams = {}) {
  const [filters, setFilters] = useState<SearchParams>(initialFilters);

  const addFilter = (key: keyof SearchParams, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const removeFilter = (key: keyof SearchParams) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      term: filters.term,
      page: 1,
      limit: filters.limit || 20
    });
  };

  const hasActiveFilters = Object.keys(filters).some(
    key => key !== 'page' && key !== 'limit' && key !== 'term' && filters[key as keyof SearchParams]
  );

  const activeFiltersCount = Object.keys(filters).filter(
    key => key !== 'page' && key !== 'limit' && key !== 'term' && filters[key as keyof SearchParams]
  ).length;

  return {
    filters,
    setFilters,
    addFilter,
    removeFilter,
    clearAllFilters,
    hasActiveFilters,
    activeFiltersCount
  };
}