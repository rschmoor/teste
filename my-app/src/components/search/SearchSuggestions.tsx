'use client';

import React, { useState, useEffect } from 'react';
import { Search, Clock, TrendingUp, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSearch } from '@/hooks/useSearch';
import { SearchSuggestion, UserSearchHistory, SearchTerm } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface SearchSuggestionsProps {
  onSuggestionClick: (term: string) => void;
  currentTerm?: string;
  className?: string;
}

export function SearchSuggestions({
  onSuggestionClick,
  currentTerm = '',
  className
}: SearchSuggestionsProps) {
  const {
    suggestions,
    getSuggestions,
    getSearchHistory,
    getPopularSearches,
    clearSearchHistory
  } = useSearch();
  
  const [searchHistory, setSearchHistory] = useState<UserSearchHistory[]>([]);
  const [popularSearches, setPopularSearches] = useState<SearchTerm[]>([]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(currentTerm);
  
  // Carregar dados iniciais
  useEffect(() => {
    getSearchHistory();
    getPopularSearches();
  }, [getSearchHistory, getPopularSearches]);
  
  // Atualizar input quando currentTerm muda
  useEffect(() => {
    setInputValue(currentTerm);
  }, [currentTerm]);
  
  // Buscar sugestões quando o input muda
  useEffect(() => {
    if (inputValue.length >= 2) {
      getSuggestions(inputValue);
    }
  }, [inputValue, getSuggestions]);
  
  // Lidar com clique em sugestão
  const handleSuggestionClick = (term: string) => {
    setInputValue(term);
    setIsOpen(false);
    onSuggestionClick(term);
  };
  
  // Lidar com submit do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setIsOpen(false);
      onSuggestionClick(inputValue.trim());
    }
  };
  
  // Limpar histórico
  const handleClearHistory = () => {
    clearSearchHistory();
  };
  
  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder="Buscar produtos..."
              className="pl-10 pr-4"
            />
          </form>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[400px] p-0" 
          align="start"
          side="bottom"
        >
          <Command>
            <CommandList className="max-h-[400px]">
              {/* Sugestões baseadas no input */}
              {inputValue.length >= 2 && suggestions.length > 0 && (
                <CommandGroup heading="Sugestões">
                  {suggestions.slice(0, 5).map((suggestion, index) => (
                    <CommandItem
                      key={`suggestion-${index}`}
                      onSelect={() => handleSuggestionClick(suggestion.suggestion)}
                      className="cursor-pointer"
                    >
                      <Search className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{suggestion.suggestion}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {suggestion.category}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Histórico de busca */}
              {inputValue.length < 2 && searchHistory.length > 0 && (
                <CommandGroup heading="Buscas recentes">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs text-gray-500">Histórico</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearHistory}
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                    >
                      Limpar
                    </Button>
                  </div>
                  {searchHistory.slice(0, 5).map((history) => (
                    <CommandItem
                      key={history.id}
                      onSelect={() => handleSuggestionClick(history.search_term)}
                      className="cursor-pointer"
                    >
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{history.search_term}</span>
                      {history.result_count > 0 && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          {history.result_count} resultados
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Buscas populares */}
              {inputValue.length < 2 && popularSearches.length > 0 && (
                <CommandGroup heading="Buscas populares">
                  {popularSearches.slice(0, 8).map((search, index) => (
                    <CommandItem
                      key={search.term}
                      onSelect={() => handleSuggestionClick(search.term)}
                      className="cursor-pointer"
                    >
                      <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{search.term}</span>
                      <div className="ml-auto flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {search.search_count}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* Estado vazio */}
              {inputValue.length >= 2 && suggestions.length === 0 && (
                <CommandEmpty>
                  <div className="text-center py-4">
                    <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Nenhuma sugestão encontrada
                    </p>
                  </div>
                </CommandEmpty>
              )}
              
              {inputValue.length < 2 && searchHistory.length === 0 && popularSearches.length === 0 && (
                <CommandEmpty>
                  <div className="text-center py-4">
                    <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Digite para buscar produtos
                    </p>
                  </div>
                </CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Componente para exibir sugestões em cards (para páginas de categoria, etc.)
export function SearchSuggestionsCards({
  onSuggestionClick,
  title = "Sugestões de busca",
  className
}: {
  onSuggestionClick: (term: string) => void;
  title?: string;
  className?: string;
}) {
  const { getPopularSearches } = useSearch();
  const [popularSearches, setPopularSearches] = useState<SearchTerm[]>([]);
  
  useEffect(() => {
    const loadPopularSearches = async () => {
      try {
        const searches = await getPopularSearches();
        setPopularSearches(searches);
      } catch (error) {
        console.error('Erro ao carregar buscas populares:', error);
      }
    };
    
    loadPopularSearches();
  }, [getPopularSearches]);
  
  if (popularSearches.length === 0) {
    return null;
  }
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {popularSearches.slice(0, 12).map((search, index) => (
            <Button
              key={search.term}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick(search.term)}
              className="h-8 text-xs"
            >
              {search.term}
              <Badge variant="secondary" className="ml-2 text-xs">
                {search.search_count}
              </Badge>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para exibir categorias populares
export function PopularCategories({
  onCategoryClick,
  categories = [],
  title = "Categorias populares",
  className
}: {
  onCategoryClick: (category: string) => void;
  categories?: Array<{ name: string; count: number; image?: string }>;
  title?: string;
  className?: string;
}) {
  if (categories.length === 0) {
    return null;
  }
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((category) => (
            <Button
              key={category.name}
              variant="outline"
              onClick={() => onCategoryClick(category.name)}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              {category.image && (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-lg">{category.image}</span>
                </div>
              )}
              <div className="text-center">
                <div className="font-medium text-sm">{category.name}</div>
                <div className="text-xs text-gray-500">
                  {category.count} produtos
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para busca rápida (header, etc.)
export function QuickSearch({
  onSearch,
  placeholder = "Buscar...",
  className
}: {
  onSearch: (term: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [term, setTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { suggestions, getSuggestions } = useSearch();
  
  useEffect(() => {
    if (term.length >= 2) {
      getSuggestions(term);
    }
  }, [term, getSuggestions]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      setIsOpen(false);
      onSearch(term.trim());
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setTerm(suggestion);
    setIsOpen(false);
    onSearch(suggestion);
  };
  
  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="pl-10 pr-4 h-9"
            />
          </form>
        </PopoverTrigger>
        
        {term.length >= 2 && suggestions.length > 0 && (
          <PopoverContent 
            className="w-[300px] p-0" 
            align="start"
            side="bottom"
          >
            <Command>
              <CommandList className="max-h-[200px]">
                <CommandGroup>
                  {suggestions.slice(0, 5).map((suggestion, index) => (
                    <CommandItem
                      key={index}
                      onSelect={() => handleSuggestionClick(suggestion.suggestion)}
                      className="cursor-pointer"
                    >
                      <Search className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{suggestion.suggestion}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {suggestion.category}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}