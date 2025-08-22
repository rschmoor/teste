'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { FilterState } from '@/hooks/useFilters'
import { cn } from '@/lib/utils'

interface ProductFiltersProps {
  filters: FilterState
  onChange: (filters: Partial<FilterState>) => void
  className?: string
}

// Mock data - em produção, estes dados viriam do backend
const categories = [
  { id: 'roupas', name: 'Roupas', count: 156 },
  { id: 'calcados', name: 'Calcados', count: 89 },
  { id: 'acessorios', name: 'Acessorios', count: 67 },
  { id: 'bolsas', name: 'Bolsas', count: 45 },
  { id: 'joias', name: 'Joias', count: 23 }
]

const brands = [
  { id: 'nike', name: 'Nike', count: 34 },
  { id: 'adidas', name: 'Adidas', count: 28 },
  { id: 'zara', name: 'Zara', count: 45 },
  { id: 'hm', name: 'H&M', count: 32 },
  { id: 'uniqlo', name: 'Uniqlo', count: 19 }
]

const colors = [
  { id: 'preto', name: 'Preto', hex: '#000000' },
  { id: 'branco', name: 'Branco', hex: '#FFFFFF' },
  { id: 'azul', name: 'Azul', hex: '#3B82F6' },
  { id: 'vermelho', name: 'Vermelho', hex: '#EF4444' },
  { id: 'verde', name: 'Verde', hex: '#10B981' },
  { id: 'rosa', name: 'Rosa', hex: '#EC4899' },
  { id: 'amarelo', name: 'Amarelo', hex: '#F59E0B' },
  { id: 'roxo', name: 'Roxo', hex: '#8B5CF6' }
]

const sizes = ['PP', 'P', 'M', 'G', 'GG', 'XG', '36', '38', '40', '42', '44', '46']

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="font-medium text-gray-900">{title}</h3>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

export function ProductFilters({ filters, onChange, className }: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>(filters.priceRange || [0, 1000])

  // Debounce price range changes
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ priceRange })
    }, 300)

    return () => clearTimeout(timer)
  }, [priceRange, onChange])

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      onChange({ category: categoryId })
    } else {
      onChange({ category: undefined })
    }
  }

  const handleBrandChange = (brandId: string, checked: boolean) => {
    if (checked) {
      onChange({ brand: brandId })
    } else {
      onChange({ brand: undefined })
    }
  }

  const handleColorChange = (colorId: string, checked: boolean) => {
    const currentColors = filters.colors || []
    if (checked) {
      onChange({ colors: [...currentColors, colorId] })
    } else {
      onChange({ colors: currentColors.filter(c => c !== colorId) })
    }
  }

  const handleSizeChange = (size: string, checked: boolean) => {
    const currentSizes = filters.sizes || []
    if (checked) {
      onChange({ sizes: [...currentSizes, size] })
    } else {
      onChange({ sizes: currentSizes.filter(s => s !== size) })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Categories */}
      <FilterSection title="Categorias">
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={category.id}
                  checked={filters.category === category.id}
                  onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                />
                <label htmlFor={category.id} className="text-sm cursor-pointer flex-1">
                  {category.name}
                </label>
              </div>
              <Badge variant="secondary" className="text-xs">
                {category.count}
              </Badge>
            </div>
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Brands */}
      <FilterSection title="Marcas">
        <div className="space-y-2">
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={brand.id}
                  checked={filters.brand === brand.id}
                  onCheckedChange={(checked) => handleBrandChange(brand.id, checked as boolean)}
                />
                <label htmlFor={brand.id} className="text-sm cursor-pointer flex-1">
                  {brand.name}
                </label>
              </div>
              <Badge variant="secondary" className="text-xs">
                {brand.count}
              </Badge>
            </div>
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Price Range */}
      <FilterSection title="Faixa de Preco">
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
          </div>
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            max={1000}
            min={0}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>R$ 0</span>
            <span>R$ 1.000+</span>
          </div>
        </div>
      </FilterSection>

      <Separator />

      {/* Colors */}
      <FilterSection title="Cores">
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => (
            <button
              key={color.id}
              onClick={() => handleColorChange(color.id, !filters.colors?.includes(color.id))}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all relative",
                filters.colors?.includes(color.id)
                  ? "border-gray-900 scale-110"
                  : "border-gray-300 hover:border-gray-400"
              )}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {filters.colors?.includes(color.id) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    color.hex === '#FFFFFF' ? "bg-gray-900" : "bg-white"
                  )} />
                </div>
              )}
            </button>
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Sizes */}
      <FilterSection title="Tamanhos">
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => handleSizeChange(size, !filters.sizes?.includes(size))}
              className={cn(
                "py-2 px-3 text-sm border rounded transition-colors",
                filters.sizes?.includes(size)
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      <Separator />

      {/* Additional Filters */}
      <FilterSection title="Outros Filtros">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inStock"
              checked={filters.inStock || false}
              onCheckedChange={(checked) => onChange({ inStock: checked as boolean })}
            />
            <label htmlFor="inStock" className="text-sm cursor-pointer">
              Apenas em estoque
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="onSale"
              checked={filters.onSale || false}
              onCheckedChange={(checked) => onChange({ onSale: checked as boolean })}
            />
            <label htmlFor="onSale" className="text-sm cursor-pointer">
              Em promocao
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={filters.featured || false}
              onCheckedChange={(checked) => onChange({ featured: checked as boolean })}
            />
            <label htmlFor="featured" className="text-sm cursor-pointer">
              Produtos em destaque
            </label>
          </div>
        </div>
      </FilterSection>
    </div>
  )
}