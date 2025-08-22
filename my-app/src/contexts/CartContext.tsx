'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import { CartItem, CartContextType, Coupon } from '@/types/cart'

interface CartState {
  items: CartItem[]
  isOpen: boolean
  coupon?: Coupon
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }
  | { type: 'APPLY_COUPON'; payload: Coupon }
  | { type: 'REMOVE_COUPON' }

const CartContext = createContext<CartContextType | undefined>(undefined)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId && 
                item.size === action.payload.size && 
                item.color === action.payload.color
      )

      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items]
        const existingItem = updatedItems[existingItemIndex]
        const newQuantity = existingItem.quantity + action.payload.quantity
        
        // Verificar se não excede o estoque
        if (newQuantity <= existingItem.stock) {
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity
          }
          return { ...state, items: updatedItems }
        } else {
          toast.error('Quantidade indisponível em estoque')
          return state
        }
      } else {
        return {
          ...state,
          items: [...state.items, action.payload]
        }
      }
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload
      
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== id)
        }
      }

      return {
        ...state,
        items: state.items.map(item => {
          if (item.id === id) {
            if (quantity <= item.stock) {
              return { ...item, quantity }
            } else {
              toast.error('Quantidade indisponível em estoque')
              return item
            }
          }
          return item
        })
      }
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        coupon: undefined
      }

    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen
      }

    case 'OPEN_CART':
      return {
        ...state,
        isOpen: true
      }

    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false
      }

    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload
      }

    case 'APPLY_COUPON':
      return {
        ...state,
        coupon: action.payload
      }

    case 'REMOVE_COUPON':
      return {
        ...state,
        coupon: undefined
      }

    default:
      return state
  }
}

const initialState: CartState = {
  items: [],
  isOpen: false,
  coupon: undefined
}

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  
  // Carregar carrinho do localStorage na inicialização
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('boutique-cart')
      const savedCoupon = localStorage.getItem('boutique-cart-coupon')
      
      if (savedCart) {
        const cartItems = JSON.parse(savedCart)
        dispatch({ type: 'LOAD_CART', payload: cartItems })
      }
      
      if (savedCoupon) {
        const coupon = JSON.parse(savedCoupon)
        dispatch({ type: 'APPLY_COUPON', payload: coupon })
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho do localStorage:', error)
    }
  }, [])
  
  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem('boutique-cart', JSON.stringify(state.items))
    } catch (error) {
      console.error('Erro ao salvar carrinho no localStorage:', error)
    }
  }, [state.items])

  // Salvar cupom no localStorage
  useEffect(() => {
    try {
      if (state.coupon) {
        localStorage.setItem('boutique-cart-coupon', JSON.stringify(state.coupon))
      } else {
        localStorage.removeItem('boutique-cart-coupon')
      }
    } catch (error) {
      console.error('Erro ao salvar cupom no localStorage:', error)
    }
  }, [state.coupon])

  // Calcular subtotal
  const subtotal = state.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0)

  // Calcular desconto
  const discount = state.coupon ? (
    state.coupon.type === 'percentage' 
      ? (subtotal * state.coupon.discount / 100)
      : state.coupon.discount
  ) : 0

  // Calcular total
  const total = Math.max(0, subtotal - discount)

  // Contar itens
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
  
  type MinimalProductForCart = {
    id: string
    sku?: string
    name: string
    price: number
    originalPrice?: number
    images?: string[]
    stock?: number
    category?: { name?: string } | string | null
    brand?: { name?: string } | string | null
  }
  
  const addItem = (product: MinimalProductForCart, size?: string, color?: string, quantity: number = 1) => {
    const cartItem: CartItem = {
      id: `${product.id}-${size || 'no-size'}-${color || 'no-color'}`,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images?.[0] || '/placeholder-product.jpg',
      size,
      color,
      quantity,
      stock: product.stock || 999,
      category: typeof product.category === 'object' ? product.category?.name : product.category ?? undefined,
      brand: typeof product.brand === 'object' ? product.brand?.name : product.brand ?? undefined
    }

    dispatch({ type: 'ADD_ITEM', payload: cartItem })
    toast.success('Produto adicionado ao carrinho!')
  }
  
  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
    toast.success('Produto removido do carrinho')
  }
  
  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  }
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
    toast.success('Carrinho limpo')
  }
  
  const openCart = () => {
    dispatch({ type: 'OPEN_CART' })
  }
  
  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' })
  }

  const applyCoupon = async (code: string): Promise<boolean> => {
    try {
      // Simular validação de cupom (substituir por API real)
      const validCoupons = [
        { id: '1', code: 'DESCONTO10', discount: 10, type: 'percentage' as const, isActive: true },
        { id: '2', code: 'FRETE50', discount: 50, type: 'fixed' as const, isActive: true },
        { id: '3', code: 'BEMVINDO', discount: 15, type: 'percentage' as const, isActive: true }
      ]

      const coupon = validCoupons.find(c => c.code.toLowerCase() === code.toLowerCase() && c.isActive)
      
      if (coupon) {
        dispatch({ type: 'APPLY_COUPON', payload: coupon })
        toast.success(`Cupom ${code} aplicado com sucesso!`)
        return true
      } else {
        toast.error('Cupom inválido ou expirado')
        return false
      }
    } catch {
      toast.error('Erro ao aplicar cupom')
      return false
    }
  }

  const removeCoupon = () => {
    dispatch({ type: 'REMOVE_COUPON' })
    toast.success('Cupom removido')
  }
  
  const value: CartContextType = {
    items: state.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    subtotal,
    itemCount,
    isOpen: state.isOpen,
    openCart,
    closeCart,
    applyCoupon,
    removeCoupon,
    coupon: state.coupon
  }
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider')
  }
  return context
}

export default CartContext