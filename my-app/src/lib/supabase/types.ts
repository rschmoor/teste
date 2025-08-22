export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'customer'
          created_at: string
          updated_at: string
        }
      promotions: {
        Row: {
          id: string
          name: string
          description: string | null
          type: 'percentage' | 'fixed_amount' | 'coupon'
          value: number
          code: string | null
          min_order_value: number
          max_discount_amount: number | null
          usage_limit: number | null
          used_count: number
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          type: 'percentage' | 'fixed_amount' | 'coupon'
          value: number
          code?: string | null
          min_order_value?: number
          max_discount_amount?: number | null
          usage_limit?: number | null
          used_count?: number
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: 'percentage' | 'fixed_amount' | 'coupon'
          value?: number
          code?: string | null
          min_order_value?: number
          max_discount_amount?: number | null
          usage_limit?: number | null
          used_count?: number
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      promotion_products: {
        Row: {
          id: string
          promotion_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          promotion_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          promotion_id?: string
          product_id?: string
          created_at?: string
        }
      }
      promotion_categories: {
        Row: {
          id: string
          promotion_id: string
          category_id: string
          created_at: string
        }
        Insert: {
          id?: string
          promotion_id: string
          category_id: string
          created_at?: string
        }
        Update: {
          id?: string
          promotion_id?: string
          category_id?: string
          created_at?: string
        }
      }
      coupon_usage: {
        Row: {
          id: string
          user_id: string
          promotion_id: string
          coupon_code: string
          used_at: string
          order_id?: string
        }
        Insert: {
          id?: string
          user_id: string
          promotion_id: string
          coupon_code: string
          used_at?: string
          order_id?: string
        }
        Update: {
          id?: string
          user_id?: string
          promotion_id?: string
          coupon_code?: string
          used_at?: string
          order_id?: string
        }
      }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'customer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'customer'
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price: number
          compare_price: number | null
          cost_price: number | null
          sku: string | null
          barcode: string | null
          track_quantity: boolean
          quantity: number
          weight: number | null
          category_id: string | null
          brand: string | null
          tags: string[] | null
          images: string[] | null
          is_active: boolean
          is_featured: boolean
          meta_title: string | null
          meta_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price: number
          compare_price?: number | null
          cost_price?: number | null
          sku?: string | null
          barcode?: string | null
          track_quantity?: boolean
          quantity?: number
          weight?: number | null
          category_id?: string | null
          brand?: string | null
          tags?: string[] | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          price?: number
          compare_price?: number | null
          cost_price?: number | null
          sku?: string | null
          barcode?: string | null
          track_quantity?: boolean
          quantity?: number
          weight?: number | null
          category_id?: string | null
          brand?: string | null
          tags?: string[] | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          order_number: string
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total_amount: number
          subtotal: number
          tax_amount: number
          shipping_amount: number
          discount_amount: number
          coupon_code?: string
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
          payment_method?: string
          payment_id?: string
          shipping_address?: Json
          billing_address?: Json
          notes?: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_number?: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total_amount?: number
          subtotal?: number
          tax_amount?: number
          shipping_amount?: number
          discount_amount?: number
          coupon_code?: string
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
          payment_method?: string
          payment_id?: string
          shipping_address?: Json
          billing_address?: Json
          notes?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_number?: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total_amount?: number
          subtotal?: number
          tax_amount?: number
          shipping_amount?: number
          discount_amount?: number
          coupon_code?: string
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
          payment_method?: string
          payment_id?: string
          shipping_address?: Json
          billing_address?: Json
          notes?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          discount_amount: number
          product_snapshot?: Json
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          unit_price: number
          total_price: number
          discount_amount?: number
          product_snapshot?: Json
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          discount_amount?: number
          product_snapshot?: Json
          created_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          type: 'shipping' | 'billing' | 'both'
          label?: string
          recipient_name: string
          street: string
          number: string
          complement?: string
          neighborhood: string
          city: string
          state: string
          postal_code: string
          country: string
          phone?: string
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: 'shipping' | 'billing' | 'both'
          label?: string
          recipient_name: string
          street: string
          number: string
          complement?: string
          neighborhood: string
          city: string
          state: string
          postal_code: string
          country?: string
          phone?: string
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'shipping' | 'billing' | 'both'
          label?: string
          recipient_name?: string
          street?: string
          number?: string
          complement?: string
          neighborhood?: string
          city?: string
          state?: string
          postal_code?: string
          country?: string
          phone?: string
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      wishlist: {
        Row: {
          id: string
          user_id: string
          product_id: string
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          added_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          added_at?: string
        }
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          order_id?: string
          rating: number
          title?: string
          comment?: string
          is_verified_purchase: boolean
          is_approved: boolean
          helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          order_id?: string
          rating: number
          title?: string
          comment?: string
          is_verified_purchase?: boolean
          is_approved?: boolean
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          order_id?: string
          rating?: number
          title?: string
          comment?: string
          is_verified_purchase?: boolean
          is_approved?: boolean
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      product_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          group_type: 'category' | 'brand' | 'price_range' | 'style' | 'collection' | 'seasonal' | 'custom'
          criteria: Record<string, unknown>
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          group_type: 'category' | 'brand' | 'price_range' | 'style' | 'collection' | 'seasonal' | 'custom'
          criteria: Record<string, unknown>
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          group_type?: 'category' | 'brand' | 'price_range' | 'style' | 'collection' | 'seasonal' | 'custom'
          criteria?: Record<string, unknown>
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      product_group_items: {
        Row: {
          id: string
          product_id: string
          group_id: string
          position: number
          is_featured: boolean
          added_at: string
        }
        Insert: {
          id?: string
          product_id: string
          group_id: string
          position?: number
          is_featured?: boolean
          added_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          group_id?: string
          position?: number
          is_featured?: boolean
          added_at?: string
        }
      }
      grouping_rules: {
        Row: {
          id: string
          name: string
          description: string | null
          rule_type: 'category_match' | 'price_range' | 'brand_match' | 'tag_similarity' | 'attribute_match'
          conditions: Record<string, unknown>
          target_group_id: string | null
          auto_create_group: boolean
          is_active: boolean
          priority: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          rule_type: 'category_match' | 'price_range' | 'brand_match' | 'tag_similarity' | 'attribute_match'
          conditions: Record<string, unknown>
          target_group_id?: string | null
          auto_create_group?: boolean
          is_active?: boolean
          priority?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          rule_type?: 'category_match' | 'price_range' | 'brand_match' | 'tag_similarity' | 'attribute_match'
          conditions?: Record<string, unknown>
          target_group_id?: string | null
          auto_create_group?: boolean
          is_active?: boolean
          priority?: number
          created_at?: string
          updated_at?: string
        }
      }
      product_similarity: {
        Row: {
          id: string
          product_a_id: string
          product_b_id: string
          similarity_score: number
          similarity_factors: Record<string, unknown> | null
          calculated_at: string
        }
        Insert: {
          id?: string
          product_a_id: string
          product_b_id: string
          similarity_score: number
          similarity_factors?: Record<string, unknown> | null
          calculated_at?: string
        }
        Update: {
          id?: string
          product_a_id?: string
          product_b_id?: string
          similarity_score?: number
          similarity_factors?: Record<string, unknown> | null
          calculated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Reports types
export interface Report {
  id: string;
  name: string;
  description?: string;
  type: 'sales' | 'products' | 'customers' | 'inventory' | 'financial' | 'custom';
  config: Record<string, unknown>;
  filters?: Record<string, unknown>;
  chart_config?: Record<string, unknown>;
  is_public: boolean;
  is_scheduled: boolean;
  schedule_config?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportCache {
  id: string;
  report_id: string;
  cache_key: string;
  data: Record<string, unknown>;
  filters_hash: string;
  expires_at: string;
  created_at: string;
}

export interface ReportExecution {
  id: string;
  report_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  error_message?: string;
  execution_time_ms?: number;
  started_at: string;
  completed_at?: string;
}

export interface ReportSettings {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Report data types
export interface SalesReportData {
  period: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  total_items: number;
}

export interface TopProductsReportData {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

export interface CustomersReportData {
  total_customers: number;
  new_customers: number;
  active_customers: number;
  avg_orders_per_customer: number;
  avg_revenue_per_customer: number;
}

// Tipos para o sistema de busca
export interface SearchTerm {
  id: string;
  term: string;
  normalized_term: string;
  search_count: number;
  result_count: number;
  last_searched_at: string;
  created_at: string;
  updated_at: string;
}

export interface SearchSuggestion {
  id: string;
  suggestion: string;
  normalized_suggestion: string;
  category: 'product' | 'brand' | 'category' | 'tag' | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSearchHistory {
  id: string;
  user_id: string | null;
  search_term: string;
  normalized_term: string;
  result_count: number;
  clicked_product_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  searched_at: string;
}

export interface SearchCache {
  id: string;
  search_hash: string;
  search_term: string;
  filters: Record<string, unknown>;
  results: unknown;
  result_count: number;
  expires_at: string;
  created_at: string;
}

export interface SearchSettings {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Tipos para parâmetros de busca
export interface SearchParams {
  term?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'created_at';
  page?: number;
  limit?: number;
}

// Tipos para resultados de busca
export interface SearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price: number | null;
  image_url: string;
  category: string;
  brand: string;
  stock_quantity: number;
  tags: string[];
  relevance_score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  suggestions?: string[];
  filters?: {
    categories: string[];
    brands: string[];
    priceRange: { min: number; max: number };
  };
}

// Tipos para sugestões
export interface SuggestionResult {
  suggestion: string;
  category: string;
  priority: number;
}

// Tipos para análise de busca
export interface SearchAnalytics {
  total_searches: number;
  searches_today: number;
  unique_terms: number;
  new_terms_today: number;
  active_users: number;
  success_rate: number;
  popularTerms: Array<{
    term: string;
    count: number;
    result_count: number;
  }>;
  recentSearches: Array<{
    term: string;
    searched_at: string;
    result_count: number;
  }>;
  topCategories: Array<{
    category: string;
    search_count: number;
  }>;
  searchTrends: Array<{
    date: string;
    search_count: number;
    unique_terms: number;
  }>;
}