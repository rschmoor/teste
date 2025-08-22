'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Home, ArrowLeft, ShoppingBag, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function NotFound() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/produtos?search=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  const popularCategories = [
    { name: 'Vestidos', href: '/produtos?categoria=vestidos' },
    { name: 'Blusas', href: '/produtos?categoria=blusas' },
    { name: 'Calças', href: '/produtos?categoria=calcas' },
    { name: 'Acessórios', href: '/produtos?categoria=acessorios' },
  ]

  const featuredProducts = [
    { name: 'Vestido Floral', price: 'R$ 129,90', href: '/produtos/vestido-floral' },
    { name: 'Blusa Básica', price: 'R$ 59,90', href: '/produtos/blusa-basica' },
    { name: 'Jeans Premium', price: 'R$ 189,90', href: '/produtos/jeans-premium' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Animação do 404 */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative">
              <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                404
              </h1>
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-16 w-16 text-pink-400 opacity-60" />
              </motion.div>
            </div>
          </motion.div>

          {/* Conteúdo principal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="mb-8">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  Página não encontrada
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Ops! A página que você está procurando não existe ou foi movida.
                  Mas não se preocupe, temos muitas outras coisas incríveis para você descobrir!
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Busca */}
                <div className="max-w-md mx-auto">
                  <form onSubmit={handleSearch} className="flex space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button type="submit" disabled={!searchTerm.trim()}>
                      Buscar
                    </Button>
                  </form>
                </div>

                {/* Ações rápidas */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => router.back()} variant="outline" className="flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  
                  <Button asChild className="flex items-center">
                    <Link href="/">
                      <Home className="mr-2 h-4 w-4" />
                      Página inicial
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="flex items-center">
                    <Link href="/produtos">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Ver produtos
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Categorias populares */}
          <motion.div
            className="grid md:grid-cols-2 gap-8 mb-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Categorias populares
                </CardTitle>
                <CardDescription>
                  Explore nossas categorias mais procuradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {popularCategories.map((category) => (
                    <Button
                      key={category.name}
                      asChild
                      variant="outline"
                      className="h-auto p-4 text-left justify-start"
                    >
                      <Link href={category.href}>
                        {category.name}
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Produtos em destaque
                </CardTitle>
                <CardDescription>
                  Confira alguns dos nossos produtos mais populares
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {featuredProducts.map((product) => (
                    <Link
                      key={product.name}
                      href={product.href}
                      className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-green-600 font-semibold">{product.price}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ajuda adicional */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Precisa de ajuda?
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Nossa equipe está sempre pronta para ajudar você a encontrar o que procura.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                      <Link href="/contato">
                        Fale conosco
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                      <Link href="/faq">
                        Perguntas frequentes
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Note: Metadata for 404 pages is handled by Next.js automatically
// Custom metadata cannot be exported from client components