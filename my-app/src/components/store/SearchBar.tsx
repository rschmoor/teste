'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Clock, ArrowRight, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useQuickSearch } from '@/hooks/useProductSearch'

interface SearchHistory {
  id: string
  query: string
  timestamp: Date
}

interface SearchBarProps {
  className?: string
  placeholder?: string
  onSearch?: (query: string) => void
}

export default function SearchBar({ 
  className, 
  placeholder = "Buscar produtos...", 
  onSearch 
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [history, setHistory] = useState<SearchHistory[]>([])
  
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { suggestions, loading, searchSuggestions } = useQuickSearch()

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('boutique-search-history')
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory)
        const historyWithDates = parsedHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        setHistory(historyWithDates)
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de busca:', error)
    }
  }, [])

  // Salvar histórico no localStorage
  const saveToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    const newHistoryItem: SearchHistory = {
      id: Date.now().toString(),
      query: searchQuery.trim(),
      timestamp: new Date()
    }
    
    const updatedHistory = [newHistoryItem, ...history.filter(item => item.query !== searchQuery.trim())]
      .slice(0, 5) // Manter apenas os 5 mais recentes
    
    setHistory(updatedHistory)
    const historyForStorage = updatedHistory.map(item => ({
      ...item,
      timestamp: item.timestamp.toISOString()
    }))
    localStorage.setItem('boutique-search-history', JSON.stringify(historyForStorage))
  }

  // Buscar sugestões quando o usuário digita
  const handleInputChange = (value: string) => {
    setQuery(value)
    if (value.trim().length >= 2) {
      searchSuggestions(value)
    }
  }

  // Abrir dropdown quando há sugestões
  useEffect(() => {
    setIsOpen(suggestions.length > 0 && query.trim().length >= 2)
  }, [suggestions, query])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return
    
    saveToHistory(searchQuery)
    setIsOpen(false)
    setIsExpanded(false)
    onSearch?.(searchQuery)
    router.push(`/busca?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setIsExpanded(false)
      inputRef.current?.blur()
    }
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('boutique-search-history')
  }

  const removeFromHistory = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id)
    setHistory(updatedHistory)
    localStorage.setItem('boutique-search-history', JSON.stringify(updatedHistory))
  }

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      {/* Input de busca */}
      <div className={cn(
        "relative transition-all duration-300 ease-in-out",
        isExpanded ? "w-80" : "w-64"
      )}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            setIsExpanded(true)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 h-10 bg-background border-border focus:border-primary transition-colors"
        />
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Histórico de buscas */}
          {!query && history.length > 0 && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Buscas recentes
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </Button>
              </div>
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between group cursor-pointer hover:bg-muted rounded-md p-2"
                    onClick={() => {
                      setQuery(item.query)
                      handleSearch(item.query)
                    }}
                  >
                    <span className="text-sm text-foreground">{item.query}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromHistory(item.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultados da busca */}
          {query && (
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="px-3 py-4 text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin"></div>
                    Buscando produtos...
                  </div>
                </div>
              ) : suggestions.length > 0 ? (
                <>
                  <div className="p-2">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleSearch(suggestion)}
                      >
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Ver todos os resultados */}
                  <div className="border-t border-border p-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-between text-sm"
                      onClick={() => handleSearch()}
                    >
                      Ver todos os resultados para "{query}"
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhum resultado encontrado para "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}