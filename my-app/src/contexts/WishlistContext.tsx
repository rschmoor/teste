'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { WishlistItem, WishlistContextType } from '@/types/wishlist'
import { toast } from 'sonner'

type WishlistAction =
  | { type: 'ADD_ITEM'; payload: Omit<WishlistItem, 'addedAt'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_WISHLIST' }
  | { type: 'LOAD_WISHLIST'; payload: WishlistItem[] }

interface WishlistState {
  items: WishlistItem[]
}

const initialState: WishlistState = {
  items: []
}

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const newItem: WishlistItem = {
        ...action.payload,
        addedAt: new Date()
      }
      return {
        ...state,
        items: [...state.items, newItem]
      }
    }
    
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      }
    }
    
    case 'CLEAR_WISHLIST': {
      return {
        ...state,
        items: []
      }
    }
    
    case 'LOAD_WISHLIST': {
      return {
        ...state,
        items: action.payload
      }
    }
    
    default:
      return state
  }
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, initialState)

  // Carregar wishlist do localStorage na inicialização
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('boutique-wishlist')
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist) as Array<Omit<WishlistItem, 'addedAt'> & { addedAt: string }>
        // Converter strings de data de volta para objetos Date
        const wishlistWithDates: WishlistItem[] = parsedWishlist.map((item) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }))
        dispatch({ type: 'LOAD_WISHLIST', payload: wishlistWithDates })
      }
    } catch (error) {
      console.error('Erro ao carregar wishlist do localStorage:', error)
    }
  }, [])

  // Salvar wishlist no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem('boutique-wishlist', JSON.stringify(state.items))
    } catch (error) {
      console.error('Erro ao salvar wishlist no localStorage:', error)
    }
  }, [state.items])

  const addItem = (item: Omit<WishlistItem, 'addedAt'>) => {
    // Verificar se o item já está na wishlist
    if (state.items.some(wishlistItem => wishlistItem.id === item.id)) {
      toast.error('Este produto já está nos seus favoritos!')
      return
    }

    dispatch({ type: 'ADD_ITEM', payload: item })
    toast.success('Produto adicionado aos favoritos! ❤️')
  }

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
    toast.success('Produto removido dos favoritos')
  }

  const clearWishlist = () => {
    dispatch({ type: 'CLEAR_WISHLIST' })
    toast.success('Lista de favoritos limpa')
  }

  const isInWishlist = (id: string): boolean => {
    return state.items.some(item => item.id === id)
  }

  const toggleItem = (item: Omit<WishlistItem, 'addedAt'>) => {
    if (isInWishlist(item.id)) {
      removeItem(item.id)
    } else {
      addItem(item)
    }
  }

  const value: WishlistContextType = {
    items: state.items,
    itemCount: state.items.length,
    addItem,
    removeItem,
    clearWishlist,
    isInWishlist,
    toggleItem
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist deve ser usado dentro de um WishlistProvider')
  }
  return context
}

export default WishlistContext