'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { CreateProduct } from '@/lib/validations/product'
import { useBrands } from '@/hooks/useBrands'
import { useCategories } from '@/hooks/useCategories'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddBrandModal } from '@/components/admin/Modals/AddBrandModal'
import { AddCategoryModal } from '@/components/admin/Modals/AddCategoryModal'
import { Plus } from 'lucide-react'

interface BasicInfoTabProps {
  form: UseFormReturn<CreateProduct>
}

export function BasicInfoTab({ form }: BasicInfoTabProps) {
  const [showAddBrandModal, setShowAddBrandModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  
  const { brands, loading: brandsLoading } = useBrands()
  const { categories, loading: categoriesLoading } = useCategories()

  const handleBrandAdded = (newBrand: any) => {
    form.setValue('brandId', newBrand.id)
  }

  const handleCategoryAdded = (newCategory: any) => {
    form.setValue('categoryId', newCategory.id)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Código do Produto (SKU) - Obrigatório */}
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código do Produto (SKU) *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: PROD-001"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Código do Fabricante */}
        <FormField
          control={form.control}
          name="manufacturerCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código do Fabricante</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: FAB-001"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Nome do Produto - Obrigatório */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Produto *</FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: Camiseta Básica Algodão"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Marca */}
        <FormField
          control={form.control}
          name="brandId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <div className="flex gap-2">
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={brandsLoading}
                >
                  <FormControl>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma marca" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id || ''}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAddBrandModal(true)}
                  disabled={brandsLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categoria */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <div className="flex gap-2">
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={categoriesLoading}
                >
                  <FormControl>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id || ''}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAddCategoryModal(true)}
                  disabled={categoriesLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cor Base */}
        <FormField
          control={form.control}
          name="baseColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor Base</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Azul, Vermelho"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preço de Venda - Obrigatório */}
        <FormField
          control={form.control}
          name="salePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço de Venda *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preço de Custo */}
        <FormField
          control={form.control}
          name="costPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço de Custo</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Checkboxes */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="isOnPromotion"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Produto em Promoção</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Marque se este produto está em promoção
                </p>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isInactive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Produto Inativo</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Marque se este produto não deve aparecer na loja
                </p>
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* Modais */}
      <AddBrandModal
        open={showAddBrandModal}
        onOpenChange={setShowAddBrandModal}
        onBrandAdded={handleBrandAdded}
      />

      <AddCategoryModal
        open={showAddCategoryModal}
        onOpenChange={setShowAddCategoryModal}
        onCategoryAdded={handleCategoryAdded}
      />
    </div>
  )
}