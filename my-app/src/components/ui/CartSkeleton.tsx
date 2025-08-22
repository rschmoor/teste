import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function CartItemSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4">
      {/* Product image */}
      <div className="w-20 h-20 relative overflow-hidden rounded-md bg-gray-100">
        <Skeleton className="w-full h-full" />
      </div>
      
      {/* Product info */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
      
      {/* Quantity controls */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded" />
        <Skeleton className="w-12 h-8" />
        <Skeleton className="w-8 h-8 rounded" />
      </div>
      
      {/* Price */}
      <div className="text-right space-y-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      
      {/* Remove button */}
      <Skeleton className="w-8 h-8 rounded" />
    </div>
  )
}

export function CartSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-8 w-48" />
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <CartItemSkeleton />
                    {i < 2 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Order summary */}
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Summary items */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-16" />
              </div>
              
              {/* Checkout button */}
              <Skeleton className="w-full h-12 rounded-md" />
              
              {/* Continue shopping */}
              <Skeleton className="w-full h-10 rounded-md" />
            </CardContent>
          </Card>
          
          {/* Shipping info */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-24" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function MiniCartSkeleton() {
  return (
    <div className="w-80 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="w-6 h-6" />
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
      
      <Separator />
      
      <div className="flex justify-between">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-16" />
      </div>
      
      <Skeleton className="w-full h-10 rounded-md" />
    </div>
  )
}