// Script para verificar e criar a tabela product_categories
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkProductCategories() {
  console.log('🔍 Verificando tabela product_categories...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Verificar se a tabela product_categories existe
    console.log('\n📋 Verificando existência da tabela product_categories...')
    
    const { data: productCategories, error: pcError } = await supabase
      .from('product_categories')
      .select('*')
      .limit(1)
    
    if (pcError) {
      console.log('❌ Tabela product_categories não encontrada:', pcError.message)
      console.log('\n🛠️ Criando tabela product_categories...')
      
      const createTableSQL = `
        -- Criar tabela de relacionamento product_categories
        CREATE TABLE IF NOT EXISTS product_categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(product_id, category_id)
        );
        
        -- Criar índices para performance
        CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
        CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);
        
        -- Migrar dados existentes da coluna category_id da tabela products
        INSERT INTO product_categories (product_id, category_id)
        SELECT id, category_id 
        FROM products 
        WHERE category_id IS NOT NULL
        ON CONFLICT (product_id, category_id) DO NOTHING;
      `
      
      console.log('\n📝 SQL para executar no Supabase SQL Editor:')
      console.log(createTableSQL)
      
      // Tentar executar via RPC se disponível
      const { error: execError } = await supabase
        .rpc('exec_sql', { sql: createTableSQL })
      
      if (execError) {
        console.log('⚠️ Não foi possível executar via RPC:', execError.message)
        console.log('\n💡 Execute o SQL acima manualmente no Supabase SQL Editor')
      } else {
        console.log('✅ Tabela product_categories criada com sucesso!')
        
        // Verificar se os dados foram migrados
        const { data: migratedData, error: migratedError } = await supabase
          .from('product_categories')
          .select('*')
          .limit(5)
        
        if (!migratedError && migratedData) {
          console.log(`📊 ${migratedData.length} relacionamentos migrados`)
        }
      }
    } else {
      console.log('✅ Tabela product_categories encontrada')
      
      if (productCategories && productCategories.length > 0) {
        console.log('📊 Dados encontrados na tabela:')
        console.log('Colunas:', Object.keys(productCategories[0]))
        console.log(`Total de relacionamentos: ${productCategories.length}`)
      } else {
        console.log('📝 Tabela product_categories existe mas está vazia')
        
        // Verificar se há produtos com category_id para migrar
        const { data: productsWithCategory, error: pwcError } = await supabase
          .from('products')
          .select('id, category_id')
          .not('category_id', 'is', null)
          .limit(10)
        
        if (!pwcError && productsWithCategory && productsWithCategory.length > 0) {
          console.log(`\n🔄 Encontrados ${productsWithCategory.length} produtos com category_id para migrar`)
          
          // Migrar dados
          const insertData = productsWithCategory.map(p => ({
            product_id: p.id,
            category_id: p.category_id
          }))
          
          const { error: insertError } = await supabase
            .from('product_categories')
            .insert(insertData)
          
          if (insertError) {
            console.log('❌ Erro ao migrar dados:', insertError.message)
          } else {
            console.log('✅ Dados migrados com sucesso!')
          }
        }
      }
    }
    
    // Verificar relacionamentos
    console.log('\n🔗 Testando relacionamento...')
    
    const { data: testRelation, error: testError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        product_categories(
          category:categories(
            id,
            name
          )
        )
      `)
      .limit(3)
    
    if (testError) {
      console.log('❌ Erro ao testar relacionamento:', testError.message)
    } else {
      console.log('✅ Relacionamento funcionando!')
      testRelation?.forEach(product => {
        const categories = product.product_categories?.map(pc => pc.category?.name).join(', ') || 'Sem categoria'
        console.log(`  - ${product.name}: ${categories}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message)
  }
}

checkProductCategories()