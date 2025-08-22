'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateProduct, createProductSchema } from '@/lib/validations/product'
import { useProducts } from '@/hooks/useProducts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Form,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { BasicInfoTab } from '@/components/admin/ProductForm/BasicInfoTab'
import { StockTab } from '@/components/admin/ProductForm/StockTab'
import { ImagesTab } from '@/components/admin/ProductForm/ImagesTab'
import { ArrowLeft, Save, Package } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NovoProductPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const router = useRouter()
  const { createProduct } = useProducts()

  const form = useForm<CreateProduct>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      sku: '',
      manufacturerCode: '',
      name: '',
      brandId: undefined,
      categoryId: undefined,
      baseColor: '',
      salePrice: 0,
      costPrice: undefined,
      isOnPromotion: false,
      isInactive: false,
      stock: {
        productType: 'clothing',
        items: [],
        totalQuantity: 0,
      },
      images: [],
    },
  })

  const onSubmit = async (data: CreateProduct) => {
    try {
      setIsSubmitting(true)
      const newProduct = await createProduct(data)
      
      if (newProduct) {
        toast.success('Produto criado com sucesso!')
        router.push('/admin/produtos')
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      toast.error('Erro ao criar produto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/produtos')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/produtos">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Novo Produto
            </h1>
            <p className="text-muted-foreground">
              Preencha as informações do produto
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Produto</CardTitle>
              <CardDescription>
                Configure as informações básicas, imagens e detalhes do produto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="stock">Estoque e Tamanhos</TabsTrigger>
                  <TabsTrigger value="images">
                    Imagens
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-6">
                  <BasicInfoTab form={form} />
                </TabsContent>

                <TabsContent value="stock" className="mt-6">
                  <StockTab form={form} />
                </TabsContent>

                <TabsContent value="images" className="mt-6">
                  <ImagesTab form={form} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Produto
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}