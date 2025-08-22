import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag, Search, Filter, Heart, ShoppingCart } from "lucide-react"
import Link from "next/link"

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <div className="text-gray-400">
            {icon}
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-md">
          {description}
        </p>
        
        {action && (
          action.href ? (
            <Button asChild>
              <Link href={action.href}>
                {action.label}
              </Link>
            </Button>
          ) : (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )
        )}
      </CardContent>
    </Card>
  )
}

export function EmptyCart() {
  return (
    <EmptyState
      icon={<ShoppingCart className="w-8 h-8" />}
      title="Seu carrinho está vazio"
      description="Adicione alguns produtos incríveis ao seu carrinho e comece a comprar!"
      action={{
        label: "Continuar Comprando",
        href: "/produtos"
      }}
    />
  )
}

export function EmptySearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={<Search className="w-8 h-8" />}
      title="Nenhum resultado encontrado"
      description={`Não encontramos produtos para "${query}". Tente buscar por outros termos ou explore nossas categorias.`}
      action={{
        label: "Ver Todos os Produtos",
        href: "/produtos"
      }}
    />
  )
}

export function EmptyFilterResults() {
  return (
    <EmptyState
      icon={<Filter className="w-8 h-8" />}
      title="Nenhum produto encontrado"
      description="Não há produtos que correspondam aos filtros selecionados. Tente ajustar os filtros ou limpar a seleção."
      action={{
        label: "Limpar Filtros",
        onClick: () => window.location.reload()
      }}
    />
  )
}

export function EmptyWishlist() {
  return (
    <EmptyState
      icon={<Heart className="w-8 h-8" />}
      title="Sua lista de desejos está vazia"
      description="Salve seus produtos favoritos aqui para não perdê-los de vista!"
      action={{
        label: "Descobrir Produtos",
        href: "/produtos"
      }}
    />
  )
}

export function EmptyCategory() {
  return (
    <EmptyState
      icon={<ShoppingBag className="w-8 h-8" />}
      title="Categoria em breve"
      description="Estamos trabalhando para trazer produtos incríveis para esta categoria. Volte em breve!"
      action={{
        label: "Ver Outras Categorias",
        href: "/produtos"
      }}
    />
  )
}

// Generic empty state for custom use cases
export function CustomEmptyState(props: EmptyStateProps) {
  return <EmptyState {...props} />
}