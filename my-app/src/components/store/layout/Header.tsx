'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, User, ShoppingBag, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { CartDrawer } from '@/components/store/cart/CartDrawer'
import SearchBar from '@/components/store/SearchBar'
import { useWishlist } from '@/contexts/WishlistContext'
import Image from 'next/image'

interface HeaderProps {
  cartItemsCount?: number
}

export function Header({ cartItemsCount = 0 }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { items: wishlistItems } = useWishlist()

  const navigationItems = [
    { label: 'Feminino', href: '/produtos?categoria=feminino' },
    { label: 'Masculino', href: '/produtos?categoria=masculino' },
    { label: 'Calçados', href: '/produtos?categoria=calcados' },
    { label: 'Acessórios', href: '/produtos?categoria=acessorios' },
    { label: 'Promoções', href: '/promocoes' },
  ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Barra promocional superior */}
      <div className="bg-black text-white text-center py-2 text-sm">
        <p className="hidden md:block">
          Frete Grátis acima de R$ 199 | Parcele em até 12x sem juros
        </p>
        <p className="md:hidden">
          Frete Grátis acima de R$ 199
        </p>
      </div>

      {/* Header principal */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile: Menu hamburguer */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  {/* Busca mobile */}
                  <div className="mb-6">
                    <SearchBar />
                  </div>
                  
                  {/* Navegação */}
                  <nav>
                    <ul className="space-y-4">
                      {navigationItems.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="block py-2 text-lg font-medium hover:text-gray-600 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                      
                      {/* Links adicionais mobile */}
                      <li>
                        <Link
                          href="/favoritos"
                          className="flex items-center py-2 text-lg font-medium hover:text-gray-600 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Heart className="h-5 w-5 mr-2" />
                          Favoritos
                          {wishlistItems.length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {wishlistItems.length}
                            </Badge>
                          )}
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image 
                src="/images/logo-dark.svg" 
                alt="Boutique Style" 
                width={120}
                height={40}
                className="h-10 w-auto dark:hidden"
                priority
              />
              <Image 
                src="/images/logo-light.svg" 
                alt="Boutique Style" 
                width={120}
                height={40}
                className="h-10 w-auto hidden dark:block"
                priority
              />
            </Link>
          </div>

          {/* Desktop: Navegação central */}
          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-medium transition-colors relative group ${
                  item.label === 'Promoções' 
                    ? 'text-red-600 hover:text-red-700' 
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Ícones à direita */}
          <div className="flex items-center space-x-4">
            {/* Buscar - apenas desktop */}
            <div className="hidden md:block">
              <SearchBar />
            </div>

            {/* Favoritos - apenas desktop */}
            <Link href="/favoritos">
              <Button variant="ghost" size="icon" className="hidden md:flex relative">
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
                  >
                    {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Conta - apenas desktop */}
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <User className="h-5 w-5" />
            </Button>

            {/* Carrinho */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
                >
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Cart Drawer */}
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </header>
  )
}