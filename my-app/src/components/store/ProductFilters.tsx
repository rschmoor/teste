'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp,
  Filter
} from 'lucide-react'

export interface FilterOption {
  id: string
  name: string
  count?: number
}

export interface ColorOption {
  id: string
  name: string
  hex: string
}

export interface Filters {
  search: string
  categories: string[]
  brands: string[]
  colors: string[]
  sizes: string[]
  priceRange: [number, number]
}

interface ProductFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  categories?: FilterOption[]
  brands?: FilterOption[]
  colors?: ColorOption[]
  sizes?: string[]
  priceRange?: [number, number]
  className?: string
  showSearch?: boolean
  collapsible?: boolean
}

const defaultCategories: FilterOption[] = [
  { id: 'vestidos', name: 'Vestidos', count: 24 },
  { id: 'blusas', name: 'Blusas', count: 18 },
  { id: 'saias', name: 'Saias', count: 12 },
  { id: 'conjuntos', name: 'Conjuntos', count: 8 },
  { id: 'calcas', name: 'Calças', count: 15 },
  { id: 'shorts', name: 'Shorts', count: 10 }
]

const defaultBrands: FilterOption[] = [
  { id: 'marca-a', name: 'Marca Premium', count: 32 },
  { id: 'marca-b', name: 'Elegance', count: 28 },
  { id: 'marca-c', name: 'Style Co.', count: 24 },
  { id: 'marca-d', name: 'Fashion House', count: 16 }
]

const defaultColors: ColorOption[] = [
  { id: 'black', name: 'Preto', hex: '#000000' },
  { id: 'white', name: 'Branco', hex: '#FFFFFF' },
  { id: 'red', name: 'Vermelho', hex: '#EF4444' },
  { id: 'blue', name: 'Azul', hex: '#3B82F6' },
  { id: 'green', name: 'Verde', hex: '#10B981' },
  { id: 'pink', name: 'Rosa', hex: '#EC4899' },
  { id: 'purple', name: 'Roxo', hex: '#8B5CF6' },
  { id: 'yellow', name: 'Amarelo', hex: '#F59E0B' },
  { id: 'gray', name: 'Cinza', hex: '#6B7280' },
  { id: 'brown', name: 'Marrom', hex: '#92400E' }
]

const defaultSizes = ['PP', 'P', 'M', 'G', 'GG', 'XG']

export default function ProductFilters({
  filters,
  onFiltersChange,
  categories = defaultCategories,
  brands = defaultBrands,
  colors = defaultColors,
  sizes = defaultSizes,
  priceRange = [0, 500],
  className = '',
  showSearch = true,
  collapsible = false
}: ProductFiltersProps) {
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: true,
    colors: true,
    sizes: true,
    price: true
  })

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleArrayFilter = (key: 'categories' | 'brands' | 'colors' | 'sizes', value: string) => {
    const currentArray = filters[key] || []
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    updateFilter(key, newArray)
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      categories: [],
      brands: [],
      colors: [],
      sizes: [],
      priceRange: [priceRange[0], priceRange[1]]
    })
  }

  const hasActiveFilters = 
    filters?.search ||
    (filters?.categories?.length || 0) > 0 ||
    (filters?.brands?.length || 0) > 0 ||
    (filters?.colors?.length || 0) > 0 ||
    (filters?.sizes?.length || 0) > 0 ||
    (filters?.priceRange?.[0] || 0) > priceRange[0] ||
    (filters?.priceRange?.[1] || priceRange[1]) < priceRange[1]

  const activeFiltersCount = 
    (filters?.search ? 1 : 0) +
    (filters?.categories?.length || 0) +
    (filters?.brands?.length || 0) +
    (filters?.colors?.length || 0) +
    (filters?.sizes?.length || 0) +
    ((filters?.priceRange?.[0] || 0) > priceRange[0] || (filters?.priceRange?.[1] || priceRange[1]) < priceRange[1] ? 1 : 0)

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const FilterSection = ({ 
    title, 
    sectionKey, 
    children 
  }: { 
    title: string
    sectionKey: keyof typeof openSections
    children: React.ReactNode 
  }) => {
    if (collapsible) {
      return (
        <Collapsible 
          open={openSections[sectionKey]} 
          onOpenChange={() => toggleSection(sectionKey)}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
            <span className="font-medium text-sm">{title}</span>
            {openSections[sectionKey] ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pb-4">
            {children}
          </CollapsibleContent>
        </Collapsible>
      )
    }

    return (
      <div>
        <h4 className="font-medium text-sm mb-3">{title}</h4>
        {children}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-semibold">Filtros</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs h-auto p-1"
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Search */}
      {showSearch && (
        <FilterSection title="Buscar" sectionKey="categories">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Nome do produto..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </FilterSection>
      )}

      {/* Categories */}
      <FilterSection title="Categorias" sectionKey="categories">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={filters.categories?.includes(category.id) || false}
                onCheckedChange={() => toggleArrayFilter('categories', category.id)}
              />
              <label 
                htmlFor={`category-${category.id}`} 
                className="text-sm cursor-pointer flex-1 flex items-center justify-between"
              >
                <span>{category.name}</span>
                {category.count && (
                  <span className="text-xs text-gray-500">({category.count})</span>
                )}
              </label>
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Brands */}
      <FilterSection title="Marcas" sectionKey="brands">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center space-x-2">
              <Checkbox
                id={`brand-${brand.id}`}
                checked={filters.brands?.includes(brand.id) || false}
                onCheckedChange={() => toggleArrayFilter('brands', brand.id)}
              />
              <label 
                htmlFor={`brand-${brand.id}`} 
                className="text-sm cursor-pointer flex-1 flex items-center justify-between"
              >
                <span>{brand.name}</span>
                {brand.count && (
                  <span className="text-xs text-gray-500">({brand.count})</span>
                )}
              </label>
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Colors */}
      <FilterSection title="Cores" sectionKey="colors">
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color) => (
            <button
              key={color.id}
              onClick={() => toggleArrayFilter('colors', color.id)}
              className={`relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                filters.colors?.includes(color.id)
                  ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-1'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {color.hex === '#FFFFFF' && (
                <div className="absolute inset-0.5 border border-gray-200 rounded-full" />
              )}
              {filters.colors?.includes(color.id) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-2 h-2 rounded-full ${
                    color.hex === '#FFFFFF' || color.hex === '#F59E0B' ? 'bg-gray-900' : 'bg-white'
                  }`} />
                </div>
              )}
            </button>
          ))}
        </div>
        {(filters?.colors?.length || 0) > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(filters?.colors || []).map((colorId) => {
              const color = colors.find(c => c.id === colorId)
              return color ? (
                <Badge
                  key={colorId}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  <div 
                    className="w-2 h-2 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.name}
                  <button
                    onClick={() => toggleArrayFilter('colors', colorId)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ) : null
            })}
          </div>
        )}
      </FilterSection>

      {/* Sizes */}
      <FilterSection title="Tamanhos" sectionKey="sizes">
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleArrayFilter('sizes', size)}
              className={`py-2 px-3 text-sm border rounded transition-colors ${
                filters.sizes?.includes(size)
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Preço" sectionKey="price">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>R$ {filters.priceRange[0]}</span>
            <span>R$ {filters.priceRange[1]}</span>
          </div>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
            max={priceRange[1]}
            min={priceRange[0]}
            step={10}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>R$ {priceRange[0]}</span>
            <span>R$ {priceRange[1]}</span>
          </div>
        </div>
      </FilterSection>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Filtros Ativos</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs h-auto p-1"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar Todos
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {filters.search && (
              <Badge variant="outline" className="text-xs">
                "{filters.search}"
                <button
                  onClick={() => updateFilter('search', '')}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            )}
            {filters.categories?.map((categoryId) => {
              const category = categories.find(c => c.id === categoryId)
              return category ? (
                <Badge key={categoryId} variant="outline" className="text-xs">
                  {category.name}
                  <button
                    onClick={() => toggleArrayFilter('categories', categoryId)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ) : null
            })}
            {filters.brands?.map((brandId) => {
              const brand = brands.find(b => b.id === brandId)
              return brand ? (
                <Badge key={brandId} variant="outline" className="text-xs">
                  {brand.name}
                  <button
                    onClick={() => toggleArrayFilter('brands', brandId)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ) : null
            })}
            {filters.sizes?.map((size) => (
              <Badge key={size} variant="outline" className="text-xs">
                {size}
                <button
                  onClick={() => toggleArrayFilter('sizes', size)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}