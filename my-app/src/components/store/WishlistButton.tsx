'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCustomerArea } from '@/hooks/useCustomerArea';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function WishlistButton() {
  const { user } = useAuth();
  const { wishlist, fetchWishlist } = useCustomerArea();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Carregar wishlist quando o usuário estiver logado
  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user, fetchWishlist]);

  const handleClick = () => {
    if (!user) {
      router.push('/auth/login?redirect=/conta?tab=wishlist');
      return;
    }
    
    router.push('/conta?tab=wishlist');
  };

  const wishlistCount = wishlist.length;

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleClick}
      className="relative"
      disabled={isLoading}
    >
      <Heart className={cn(
        "h-5 w-5 transition-colors",
        wishlistCount > 0 && user ? "text-red-500" : "text-current"
      )} />
      
      {user && wishlistCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {wishlistCount > 99 ? '99+' : wishlistCount}
        </Badge>
      )}
    </Button>
  );
}