// Script para corrigir RLS diretamente no Supabase
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function fixRLSPolicies() {
  console.log('🔧 Corrigindo políticas RLS...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não encontradas')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    console.log('\n1. Desabilitando RLS temporariamente...')
    
    const disableRLS = [
      'ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.product_stock DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.promotions DISABLE ROW LEVEL SECURITY;'
    ]
    
    for (const sql of disableRLS) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      if (error) {
        console.log('⚠️ Aviso ao desabilitar RLS:', error.message)
      }
    }
    
    console.log('\n2. Removendo políticas existentes...')
    
    const dropPolicies = [
      'DROP POLICY IF EXISTS "public_read" ON public.products;',
      'DROP POLICY IF EXISTS "public_read" ON public.categories;',
      'DROP POLICY IF EXISTS "public_read" ON public.brands;',
      'DROP POLICY IF EXISTS "public_read" ON public.product_images;',
      'DROP POLICY IF EXISTS "public_read" ON public.product_stock;',
      'DROP POLICY IF EXISTS "public_read" ON public.promotions;',
      'DROP POLICY IF EXISTS "admin_all" ON public.products;',
      'DROP POLICY IF EXISTS "admin_all" ON public.categories;',
      'DROP POLICY IF EXISTS "admin_all" ON public.brands;',
      'DROP POLICY IF EXISTS "admin_all" ON public.product_images;',
      'DROP POLICY IF EXISTS "admin_all" ON public.product_stock;',
      'DROP POLICY IF EXISTS "admin_all" ON public.promotions;'
    ]
    
    for (const sql of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      if (error) {
        console.log('⚠️ Aviso ao remover política:', error.message)
      }
    }
    
    console.log('\n3. Re-habilitando RLS...')
    
    const enableRLS = [
      'ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;'
    ]
    
    for (const sql of enableRLS) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      if (error) {
        console.log('❌ Erro ao habilitar RLS:', error.message)
      } else {
        console.log('✅ RLS habilitado para tabela')
      }
    }
    
    console.log('\n4. Criando políticas públicas de leitura...')
    
    const createReadPolicies = [
      'CREATE POLICY "public_read" ON public.products FOR SELECT USING (true);',
      'CREATE POLICY "public_read" ON public.categories FOR SELECT USING (true);',
      'CREATE POLICY "public_read" ON public.brands FOR SELECT USING (true);',
      'CREATE POLICY "public_read" ON public.product_images FOR SELECT USING (true);',
      'CREATE POLICY "public_read" ON public.product_stock FOR SELECT USING (true);',
      'CREATE POLICY "public_read" ON public.promotions FOR SELECT USING (is_active = true);'
    ]
    
    for (const sql of createReadPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      if (error) {
        console.log('❌ Erro ao criar política de leitura:', error.message)
      } else {
        console.log('✅ Política de leitura criada')
      }
    }
    
    console.log('\n5. Testando acesso aos produtos...')
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1)
    
    if (productsError) {
      console.log('❌ Erro ao acessar produtos:', productsError.message)
    } else {
      console.log('✅ Acesso aos produtos funcionando!')
      console.log('📊 Produtos encontrados:', products?.length || 0)
    }
    
    console.log('\n🎉 Correção de RLS concluída!')
    
  } catch (error) {
    console.error('💥 Erro durante correção:', error)
  }
}

fixRLSPolicies()