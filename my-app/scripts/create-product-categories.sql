-- Script SQL para criar a tabela product_categories
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela de relacionamento product_categories
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, category_id)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);

-- 3. Migrar dados existentes da coluna category_id da tabela products
INSERT INTO product_categories (product_id, category_id)
SELECT id, category_id 
FROM products 
WHERE category_id IS NOT NULL
ON CONFLICT (product_id, category_id) DO NOTHING;

-- 4. Verificar se os dados foram migrados corretamente
SELECT 
  p.name as product_name,
  c.name as category_name
FROM product_categories pc
JOIN products p ON p.id = pc.product_id
JOIN categories c ON c.id = pc.category_id
LIMIT 10;

-- 5. Contar relacionamentos criados
SELECT COUNT(*) as total_relationships FROM product_categories;