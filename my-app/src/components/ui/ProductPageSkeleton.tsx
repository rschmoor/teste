import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function ProductPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery Skeleton */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
            <Skeleton className="w-full h-full" />
          </div>
          
          {/* Thumbnail images */}
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-20 h-20 relative overflow-hidden rounded-md bg-gray-100">
                <Skeleton className="w-full h-full" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Product Info Skeleton */}
        <div className="space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <span className="text-gray-400">/</span>
            <Skeleton className="h-4 w-20" />
            <span className="text-gray-400">/</span>
            <Skeleton className="h-4 w-24" />
          </div>
          
          {/* Product name */}
          <Skeleton className="h-8 w-3/4" />
          
          {/* Brand */}
          <Skeleton className="h-5 w-1/3" />
          
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-4 h-4" />
              ))}
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
          
          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          
          {/* Size selector */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-16" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-12 h-12 rounded-md" />
              ))}
            </div>
          </div>
          
          {/* Color selector */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-16" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-8 h-8 rounded-full" />
              ))}
            </div>
          </div>
          
          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="w-24 h-12 rounded-md" />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Skeleton className="flex-1 h-12 rounded-md" />
              <Skeleton className="w-12 h-12 rounded-md" />
            </div>
          </div>
          
          {/* Trust elements */}
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Related products */}
      <div className="mt-16 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                <Skeleton className="w-full h-full" />
              </div>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}