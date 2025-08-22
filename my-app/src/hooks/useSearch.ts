'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  SearchParams,
  SearchResponse,
  SearchResult,
  SuggestionResult,
  SearchTerm,
  SearchSuggestion,
  UserSearchHistory,
  SearchSettings,
  SearchAnalytics
} from '@/lib/supabase/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UseSearchReturn {
  // Estado da busca
  searchResults: SearchResult[];
  suggestions: SuggestionResult[];
  isSearching: boolean;
  isLoadingSuggestions: boolean;
  searchError: string | null;
  
  // Metadados da busca
  totalResults: number;
  currentPage: number;
  hasMore: boolean;
  
  // Funções de busca
  search: (params: SearchParams) => Promise<void>;
  loadMore: () => Promise<void>;
  clearSearch: () => void;
  
  // Sugestões
  getSuggestions: (term: string) => Promise<void>;
  clearSuggestions: () => void;
  
  // Histórico e análise
  registerSearch: (term: string, resultCount: number, clickedProductId?: string) => Promise<void>;
  getSearchHistory: () => Promise<UserSearchHistory[]>;
  getPopularSearches: (limit?: number) => Promise<SearchTerm[]>;
  clearSearchHistory: () => Promise<void>;
  
  // Configurações
  getSearchSettings: () => Promise<SearchSettings[]>;
  updateSearchSetting: (key: string, value: unknown) => Promise<void>;
  
  // Análise (admin)
  getSearchAnalytics: (days?: number) => Promise<SearchAnalytics>;
  
  // Gerenciamento de sugestões (admin)
  createSuggestion: (suggestion: Omit<SearchSuggestion, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSuggestion: (id: string, updates: Partial<SearchSuggestion>) => Promise<void>;
  deleteSuggestion: (id: string) => Promise<void>;
  getAllSuggestions: () => Promise<SearchSuggestion[]>;
}

export function useSearch(): UseSearchReturn {
  const { user } = useAuth();
  
  // Estado da busca
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Metadados da busca
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [currentParams, setCurrentParams] = useState<SearchParams>({});
  
  // Gerar hash para cache
  const generateSearchHash = useCallback((params: SearchParams): string => {
    return btoa(JSON.stringify(params)).replace(/[^a-zA-Z0-9]/g, '');
  }, []);
  
  // Buscar produtos
  const search = useCallback(async (params: SearchParams) => {
    try {
      setIsSearching(true);
      setSearchError(null);
      
      const searchParams = {
        term: params.term || '',
        category: params.category || null,
        brand: params.brand || null,
        minPrice: params.minPrice || null,
        maxPrice: params.maxPrice || null,
        inStockOnly: params.inStockOnly || false,
        sortBy: params.sortBy || 'relevance',
        page: params.page || 1,
        limit: params.limit || 20
      };
      
      // Verificar cache primeiro
      const searchHash = generateSearchHash(searchParams);
      const { data: cachedResult } = await supabase
        .from('search_cache')
        .select('*')
        .eq('search_hash', searchHash)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (cachedResult) {
        const response = cachedResult.results as SearchResponse;
        setSearchResults(response.results);
        setTotalResults(response.total);
        setCurrentPage(response.page);
        setHasMore(response.hasMore);
        setCurrentParams(searchParams);
        return;
      }
      
      // Buscar no banco
      const { data: results, error } = await supabase.rpc('search_products', {
        search_term: searchParams.term,
        category_filter: searchParams.category,
        brand_filter: searchParams.brand,
        min_price: searchParams.minPrice,
        max_price: searchParams.maxPrice,
        in_stock_only: searchParams.inStockOnly,
        sort_by: searchParams.sortBy,
        page_limit: searchParams.limit,
        page_offset: (searchParams.page - 1) * searchParams.limit
      });
      
      if (error) {
        throw error;
      }
      
      const searchResults = results || [];
      const total = searchResults.length;
      const hasMoreResults = total === searchParams.limit;
      
      const response: SearchResponse = {
        results: searchResults,
        total,
        page: searchParams.page,
        limit: searchParams.limit,
        hasMore: hasMoreResults
      };
      
      // Salvar no cache
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutos
      
      await supabase.from('search_cache').insert({
        search_hash: searchHash,
        search_term: searchParams.term,
        filters: {
          category: searchParams.category,
          brand: searchParams.brand,
          minPrice: searchParams.minPrice,
          maxPrice: searchParams.maxPrice,
          inStockOnly: searchParams.inStockOnly,
          sortBy: searchParams.sortBy
        },
        results: response,
        result_count: total,
        expires_at: expiresAt.toISOString()
      });
      
      setSearchResults(searchResults);
      setTotalResults(total);
      setCurrentPage(searchParams.page);
      setHasMore(hasMoreResults);
      setCurrentParams(searchParams);
      
      // Registrar busca
      if (searchParams.term) {
        await registerSearch(searchParams.term, total);
      }
      
    } catch (error) {
      console.error('Erro na busca:', error);
      setSearchError('Erro ao realizar busca');
      toast.error('Erro ao realizar busca');
    } finally {
      setIsSearching(false);
    }
  }, [generateSearchHash, registerSearch]);
  
  // Carregar mais resultados
  const loadMore = useCallback(async () => {
    if (!hasMore || isSearching) return;
    
    const nextPage = currentPage + 1;
    const params = { ...currentParams, page: nextPage };
    
    try {
      setIsSearching(true);
      
      const { data: results, error } = await supabase.rpc('search_products', {
        search_term: params.term,
        category_filter: params.category,
        brand_filter: params.brand,
        min_price: params.minPrice,
        max_price: params.maxPrice,
        in_stock_only: params.inStockOnly,
        sort_by: params.sortBy,
        page_limit: params.limit,
        page_offset: (nextPage - 1) * (params.limit || 20)
      });
      
      if (error) {
        throw error;
      }
      
      const newResults = results || [];
      setSearchResults(prev => [...prev, ...newResults]);
      setCurrentPage(nextPage);
      setHasMore(newResults.length === (params.limit || 20));
      
    } catch (error) {
      console.error('Erro ao carregar mais resultados:', error);
      toast.error('Erro ao carregar mais resultados');
    } finally {
      setIsSearching(false);
    }
  }, [hasMore, isSearching, currentPage, currentParams]);
  
  // Limpar busca
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setTotalResults(0);
    setCurrentPage(1);
    setHasMore(false);
    setCurrentParams({});
    setSearchError(null);
  }, []);
  
  // Obter sugestões
  const getSuggestions = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      setIsLoadingSuggestions(true);
      
      const { data: results, error } = await supabase.rpc('get_search_suggestions', {
        partial_term: term,
        suggestion_limit: 10
      });
      
      if (error) {
        throw error;
      }
      
      setSuggestions(results || []);
      
    } catch (error) {
      console.error('Erro ao obter sugestões:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);
  
  // Limpar sugestões
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);
  
  // Registrar busca
  const registerSearch = useCallback(async (
    term: string, 
    resultCount: number, 
    clickedProductId?: string
  ) => {
    try {
      const sessionId = sessionStorage.getItem('session_id') || 
        Math.random().toString(36).substring(2, 15);
      
      if (!sessionStorage.getItem('session_id')) {
        sessionStorage.setItem('session_id', sessionId);
      }
      
      await supabase.rpc('register_search', {
        search_term: term,
        user_id_param: user?.id || null,
        session_id_param: sessionId,
        result_count_param: resultCount,
        ip_address_param: null, // Será obtido no servidor
        user_agent_param: navigator.userAgent
      });
      
      // Se houve clique em produto e usuário logado, atualizar histórico
      if (clickedProductId && user?.id) {
        await supabase
          .from('user_search_history')
          .update({ clicked_product_id: clickedProductId })
          .eq('user_id', user.id)
          .eq('search_term', term)
          .order('searched_at', { ascending: false })
          .limit(1);
      }
      
    } catch (error) {
      console.error('Erro ao registrar busca:', error);
    }
  }, [user]);
  
  // Obter histórico de buscas
  const getSearchHistory = useCallback(async (): Promise<UserSearchHistory[]> => {
    try {
      // Se não há usuário logado, retornar histórico vazio
      if (!user?.id) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('user_search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('searched_at', { ascending: false })
        .limit(50);
      
      if (error) {
        throw error;
      }
      
      return data || [];
      
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      return [];
    }
  }, [user]);
  
  // Obter buscas populares
  const getPopularSearches = useCallback(async (limit = 20): Promise<SearchTerm[]> => {
    try {
      const { data, error } = await supabase
        .from('search_terms')
        .select('*')
        .order('search_count', { ascending: false })
        .limit(limit);
      
      if (error) {
        throw error;
      }
      
      return data || [];
      
    } catch (error) {
      console.error('Erro ao obter buscas populares:', error);
      return [];
    }
  }, []);

  // Limpar histórico de buscas
  const clearSearchHistory = useCallback(async (): Promise<void> => {
    try {
      if (!user?.id) {
        toast.error('Usuário não logado');
        return;
      }
      
      const { error } = await supabase
        .from('user_search_history')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Histórico de buscas limpo com sucesso');
      
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      toast.error('Erro ao limpar histórico de buscas');
    }
  }, [user]);
  
  // Obter configurações de busca
  const getSearchSettings = useCallback(async (): Promise<SearchSettings[]> => {
    try {
      const { data, error } = await supabase
        .from('search_settings')
        .select('*')
        .order('key');
      
      if (error) {
        throw error;
      }
      
      return data || [];
      
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      return [];
    }
  }, []);
  
  // Atualizar configuração
  const updateSearchSetting = useCallback(async (key: string, value: unknown) => {
    try {
      const { error } = await supabase
        .from('search_settings')
        .update({ value })
        .eq('key', key);
      
      if (error) {
        throw error;
      }
      
      toast.success('Configuração atualizada com sucesso');
      
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configuração');
    }
  }, []);
  
  // Obter análise de buscas (admin)
  const getSearchAnalytics = useCallback(async (days = 30): Promise<SearchAnalytics> => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Termos populares
      const { data: popularTerms } = await supabase
        .from('search_terms')
        .select('term, search_count, result_count')
        .gte('last_searched_at', startDate.toISOString())
        .order('search_count', { ascending: false })
        .limit(20);
      
      // Buscas recentes
      const { data: recentSearches } = await supabase
        .from('user_search_history')
        .select('search_term, searched_at, result_count')
        .gte('searched_at', startDate.toISOString())
        .order('searched_at', { ascending: false })
        .limit(50);
      
      return {
        popularTerms: popularTerms?.map(t => ({
          term: t.term,
          count: t.search_count,
          result_count: t.result_count
        })) || [],
        recentSearches: recentSearches?.map(s => ({
          term: s.search_term,
          searched_at: s.searched_at,
          result_count: s.result_count
        })) || [],
        topCategories: [], // Implementar se necessário
        searchTrends: [] // Implementar se necessário
      };
      
    } catch (error) {
      console.error('Erro ao obter análise:', error);
      return {
        popularTerms: [],
        recentSearches: [],
        topCategories: [],
        searchTrends: []
      };
    }
  }, []);
  
  // Criar sugestão (admin)
  const createSuggestion = useCallback(async (
    suggestion: Omit<SearchSuggestion, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { error } = await supabase
        .from('search_suggestions')
        .insert({
          ...suggestion,
          normalized_suggestion: suggestion.suggestion.toLowerCase().trim()
        });
      
      if (error) {
        throw error;
      }
      
      toast.success('Sugestão criada com sucesso');
      
    } catch (error) {
      console.error('Erro ao criar sugestão:', error);
      toast.error('Erro ao criar sugestão');
    }
  }, []);
  
  // Atualizar sugestão (admin)
  const updateSuggestion = useCallback(async (
    id: string, 
    updates: Partial<SearchSuggestion>
  ) => {
    try {
      const updateData = { ...updates };
      if (updates.suggestion) {
        updateData.normalized_suggestion = updates.suggestion.toLowerCase().trim();
      }
      
      const { error } = await supabase
        .from('search_suggestions')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Sugestão atualizada com sucesso');
      
    } catch (error) {
      console.error('Erro ao atualizar sugestão:', error);
      toast.error('Erro ao atualizar sugestão');
    }
  }, []);
  
  // Excluir sugestão (admin)
  const deleteSuggestion = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('search_suggestions')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Sugestão excluída com sucesso');
      
    } catch (error) {
      console.error('Erro ao excluir sugestão:', error);
      toast.error('Erro ao excluir sugestão');
    }
  }, []);
  
  // Obter todas as sugestões (admin)
  const getAllSuggestions = useCallback(async (): Promise<SearchSuggestion[]> => {
    try {
      const { data, error } = await supabase
        .from('search_suggestions')
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
      
    } catch (error) {
      console.error('Erro ao obter sugestões:', error);
      return [];
    }
  }, []);
  
  return {
    // Estado da busca
    searchResults,
    suggestions,
    isSearching,
    isLoadingSuggestions,
    searchError,
    
    // Metadados da busca
    totalResults,
    currentPage,
    hasMore,
    
    // Funções de busca
    search,
    loadMore,
    clearSearch,
    
    // Sugestões
    getSuggestions,
    clearSuggestions,
    
    // Histórico e análise
    registerSearch,
    getSearchHistory,
    getPopularSearches,
    clearSearchHistory,
    
    // Configurações
    getSearchSettings,
    updateSearchSetting,
    
    // Análise (admin)
    getSearchAnalytics,
    
    // Gerenciamento de sugestões (admin)
    createSuggestion,
    updateSuggestion,
    deleteSuggestion,
    getAllSuggestions
  };
}