'use client'

import { ArrowUpDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SortState } from '@/hooks/useFilters'

interface ProductSortProps {
  sort: SortState
  onChange: (sort: SortState) => void
  className?: string
}

const sortOptions = [
  {
    value: 'created_at:desc',
    label: 'Mais Recentes',
    field: 'created_at' as const,
    direction: 'desc' as const
  },
  {
    value: 'name:asc',
    label: 'Nome A-Z',
    field: 'name' as const,
    direction: 'asc' as const
  },
  {
    value: 'name:desc',
    label: 'Nome Z-A',
    field: 'name' as const,
    direction: 'desc' as const
  },
  {
    value: 'price:asc',
    label: 'Menor Preco',
    field: 'price' as const,
    direction: 'asc' as const
  },
  {
    value: 'price:desc',
    label: 'Maior Preco',
    field: 'price' as const,
    direction: 'desc' as const
  },
  {
    value: 'rating:desc',
    label: 'Melhor Avaliacao',
    field: 'rating' as const,
    direction: 'desc' as const
  },
  {
    value: 'sales_count:desc',
    label: 'Mais Vendidos',
    field: 'sales_count' as const,
    direction: 'desc' as const
  }
]

export function ProductSort({ sort, onChange, className }: ProductSortProps) {
  const currentValue = `${sort.field}:${sort.direction}`

  const handleSortChange = (value: string) => {
    const option = sortOptions.find(opt => opt.value === value)
    if (option) {
      onChange({
        field: option.field,
        direction: option.direction
      })
    }
  }

  return (
    <div className={className}>
      <Select value={currentValue} onValueChange={handleSortChange}>
        <SelectTrigger className="w-48">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}