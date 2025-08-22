'use client'

import Link from 'next/link'
import { Package, Plus, List } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ComponentErrorBoundary, AdminErrorFallback } from '@/providers/ErrorBoundaryProvider'

export default function AdminPage() {
  return (
    <ComponentErrorBoundary>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo ao sistema de gerenciamento de produtos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos
            </CardTitle>
            <CardDescription>
              Gerencie o catálogo de produtos da sua loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/produtos">
              <Button variant="outline" className="w-full justify-start">
                <List className="h-4 w-4 mr-2" />
                Ver Todos os Produtos
              </Button>
            </Link>
            <Link href="/admin/produtos/novo">
              <Button className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>
              Informações sobre o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Modo:</span>
                <span className="text-sm font-medium text-green-600">Teste</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Autenticação:</span>
                <span className="text-sm font-medium text-orange-600">Desabilitada</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Banco de Dados:</span>
                <span className="text-sm font-medium text-green-600">Conectado</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Ajuda */}
        <Card>
          <CardHeader>
            <CardTitle>Ajuda</CardTitle>
            <CardDescription>
              Informações úteis para testes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Use a navegação superior para acessar as páginas</p>
              <p>• Todos os dados são salvos no Supabase</p>
              <p>• O sistema está configurado para testes</p>
              <p>• Autenticação foi desabilitada temporariamente</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}