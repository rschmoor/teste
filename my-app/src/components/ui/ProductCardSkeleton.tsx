import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Skeleton className="w-full h-full" />
        
        {/* Heart icon skeleton */}
        <div className="absolute top-3 right-3">
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        
        {/* Sale badge skeleton */}
        <div className="absolute top-3 left-3">
          <Skeleton className="w-12 h-6 rounded-full" />
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        {/* Product name */}
        <Skeleton className="h-5 w-3/4" />
        
        {/* Brand */}
        <Skeleton className="h-4 w-1/2" />
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        
        {/* Colors */}
        <div className="flex gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-4 h-4 rounded-full" />
        </div>
        
        {/* Add to cart button */}
        <Skeleton className="w-full h-10 rounded-md" />
      </CardContent>
    </Card>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}