// Script para criar a tabela product_categories usando SQL direto
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function createProductCategoriesTable() {
  console.log('🛠️ Criando tabela product_categories...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    console.log('\n📋 Executando comandos SQL...')
    
    // 1. Criar a tabela product_categories
    console.log('1. Criando tabela product_categories...')
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS product_categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(product_id, category_id)
        );
      `
    })
    
    if (createError) {
      console.log('⚠️ Erro ao criar tabela via RPC:', createError.message)
      console.log('\n💡 Tentando método alternativo...')
      
      // Método alternativo: usar uma query simples para verificar se a tabela existe
      const { error: testError } = await supabase
        .from('product_categories')
        .select('id')
        .limit(1)
      
      if (testError && testError.message.includes('does not exist')) {
        console.log('\n📝 Execute este SQL no Supabase SQL Editor:')
        console.log(`
-- Criar tabela product_categories
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, category_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);

-- Migrar dados existentes
INSERT INTO product_categories (product_id, category_id)
SELECT id, category_id 
FROM products 
WHERE category_id IS NOT NULL
ON CONFLICT (product_id, category_id) DO NOTHING;
        `)
        return
      }
    } else {
      console.log('✅ Tabela criada com sucesso!')
    }
    
    // 2. Criar índices
    console.log('2. Criando índices...')
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
        CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);
      `
    })
    
    if (indexError) {
      console.log('⚠️ Erro ao criar índices:', indexError.message)
    } else {
      console.log('✅ Índices criados!')
    }
    
    // 3. Migrar dados existentes
    console.log('3. Migrando dados existentes...')
    
    // Primeiro, verificar produtos com category_id
    const { data: productsWithCategory, error: pwcError } = await supabase
      .from('products')
      .select('id, category_id')
      .not('category_id', 'is', null)
    
    if (pwcError) {
      console.log('❌ Erro ao buscar produtos:', pwcError.message)
    } else if (productsWithCategory && productsWithCategory.length > 0) {
      console.log(`📊 Encontrados ${productsWithCategory.length} produtos para migrar`)
      
      // Inserir relacionamentos
      const insertData = productsWithCategory.map(p => ({
        product_id: p.id,
        category_id: p.category_id
      }))
      
      const { error: insertError } = await supabase
        .from('product_categories')
        .upsert(insertData, { onConflict: 'product_id,category_id' })
      
      if (insertError) {
        console.log('❌ Erro ao migrar dados:', insertError.message)
      } else {
        console.log('✅ Dados migrados com sucesso!')
      }
    } else {
      console.log('📝 Nenhum produto com category_id encontrado')
    }
    
    // 4. Testar relacionamento
    console.log('\n🔗 Testando relacionamento...')
    
    const { data: testData, error: testError } = await supabase
      .from('product_categories')
      .select('*')
      .limit(5)
    
    if (testError) {
      console.log('❌ Erro ao testar tabela:', testError.message)
    } else {
      console.log('✅ Tabela product_categories funcionando!')
      console.log(`📊 ${testData?.length || 0} relacionamentos encontrados`)
      
      // Testar join com products e categories
      const { data: joinTest, error: joinError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          product_categories!inner(
            category:categories(
              id,
              name
            )
          )
        `)
        .limit(3)
      
      if (joinError) {
        console.log('⚠️ Erro no join:', joinError.message)
        console.log('💡 Pode ser necessário aguardar a atualização do cache do schema')
      } else {
        console.log('✅ Join funcionando!')
        joinTest?.forEach(product => {
          const categories = product.product_categories?.map(pc => pc.category?.name).join(', ') || 'Sem categoria'
          console.log(`  - ${product.name}: ${categories}`)
        })
      }
    }
    
    console.log('\n🎉 Processo concluído!')
    
  } catch (error) {
    console.error('❌ Erro durante criação:', error.message)
  }
}

createProductCategoriesTable()