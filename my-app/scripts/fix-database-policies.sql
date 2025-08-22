-- ============================================
-- SCRIPT COMPLETO DE CORREÇÃO
-- ============================================

-- 1. Verificar estrutura atual
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('products', 'categories', 'brands', 'product_images', 'product_stock')
ORDER BY tablename, policyname;

-- 2. Desabilitar RLS temporariamente para tabelas públicas
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions DISABLE ROW LEVEL SECURITY;

-- 3. Re-habilitar com políticas corretas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas públicas de leitura
CREATE POLICY "public_read" ON public.products FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.brands FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.product_stock FOR SELECT USING (true);
CREATE POLICY "public_read" ON public.promotions FOR SELECT USING (is_active = true);

-- 5. Criar políticas admin para escrita
CREATE POLICY "admin_all" ON public.products FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'developer', 'staff'));
CREATE POLICY "admin_all" ON public.categories FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'developer', 'staff'));
CREATE POLICY "admin_all" ON public.brands FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'developer', 'staff'));
CREATE POLICY "admin_all" ON public.product_images FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'developer', 'staff'));
CREATE POLICY "admin_all" ON public.product_stock FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'developer', 'staff'));

-- 6. Verificar se product_categories existe e remover
DROP TABLE IF EXISTS public.product_categories CASCADE;

-- 7. Confirmar que category_id existe em products
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'products'
AND column_name = 'category_id';

-- 8. Teste - deve retornar produtos sem necessidade de autenticação
SELECT
    p.id,
    p.name,
    p.sale_price,
    c.name as category_name,
    b.name as brand_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.is_inactive = false
LIMIT 5;