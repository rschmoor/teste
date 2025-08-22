// Script para verificar e corrigir relacionamentos entre tabelas
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function fixDatabaseRelationships() {
  console.log('🔧 Verificando e corrigindo relacionamentos do banco de dados...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // 1. Verificar se as tabelas existem
    console.log('\n📋 Verificando existência das tabelas...')
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, category_id')
      .limit(1)
    
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1)
    
    if (productsError) {
      console.log('❌ Tabela products não encontrada:', productsError.message)
      return
    }
    
    if (categoriesError) {
      console.log('❌ Tabela categories não encontrada:', categoriesError.message)
      return
    }
    
    console.log('✅ Tabelas products e categories encontradas')
    
    // 2. Verificar foreign key constraint
    console.log('\n🔗 Verificando foreign key constraint...')
    
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
          WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'products'
            AND kcu.column_name = 'category_id';
        `
      })
    
    if (constraintsError) {
      console.log('⚠️ Não foi possível verificar constraints via SQL:', constraintsError.message)
      console.log('🔄 Tentando método alternativo...')
      
      // Método alternativo: verificar se há produtos com category_id inválido
      const { data: invalidProducts, error: invalidError } = await supabase
        .from('products')
        .select(`
          id,
          category_id,
          categories!inner(id, name)
        `)
        .limit(5)
      
      if (invalidError) {
        console.log('❌ Erro ao verificar relacionamento:', invalidError.message)
        
        // Se der erro, pode ser que não há foreign key constraint
        console.log('\n🛠️ Criando foreign key constraint...')
        
        const createConstraintSQL = `
          -- Primeiro, verificar se há produtos com category_id inválido
          DELETE FROM products 
          WHERE category_id IS NOT NULL 
          AND category_id NOT IN (SELECT id FROM categories);
          
          -- Criar foreign key constraint
          ALTER TABLE products 
          ADD CONSTRAINT fk_products_category_id 
          FOREIGN KEY (category_id) 
          REFERENCES categories(id) 
          ON DELETE SET NULL;
        `
        
        console.log('SQL para executar no Supabase SQL Editor:')
        console.log(createConstraintSQL)
        
      } else {
        console.log('✅ Relacionamento entre products e categories está funcionando')
        console.log(`📊 Encontrados ${invalidProducts?.length || 0} produtos com categorias válidas`)
      }
    } else {
      console.log('✅ Foreign key constraint encontrada:', constraints)
    }
    
    // 3. Verificar dados órfãos
    console.log('\n🔍 Verificando produtos sem categoria válida...')
    
    const { data: orphanProducts, error: orphanError } = await supabase
      .from('products')
      .select('id, name, category_id')
      .not('category_id', 'is', null)
      .limit(10)
    
    if (!orphanError && orphanProducts) {
      console.log(`📊 Encontrados ${orphanProducts.length} produtos com category_id definido`)
      
      // Verificar se as categorias existem
      for (const product of orphanProducts.slice(0, 3)) {
        const { data: category, error: catError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('id', product.category_id)
          .single()
        
        if (catError || !category) {
          console.log(`⚠️ Produto "${product.name}" tem category_id inválido: ${product.category_id}`)
        } else {
          console.log(`✅ Produto "${product.name}" -> Categoria "${category.name}"`)
        }
      }
    }
    
    // 4. Verificar se há categorias
    console.log('\n📂 Verificando categorias disponíveis...')
    
    const { data: allCategories, error: allCatError } = await supabase
      .from('categories')
      .select('id, name, is_active')
      .order('name')
    
    if (!allCatError && allCategories) {
      console.log(`📊 Total de categorias: ${allCategories.length}`)
      allCategories.slice(0, 5).forEach(cat => {
        console.log(`  - ${cat.name} (${cat.is_active ? 'ativa' : 'inativa'})`)
      })
    }
    
    console.log('\n🎉 Verificação de relacionamentos concluída!')
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message)
  }
}

fixDatabaseRelationships()
  .then(() => {
    console.log('\n✅ Script executado com sucesso')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })