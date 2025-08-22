// Script para verificar a estrutura das tabelas
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkSchema() {
  console.log('🔍 Verificando estrutura das tabelas...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Verificar estrutura da tabela products
    console.log('\n📋 Estrutura da tabela products:')
    const { data: productsSchema, error: productsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'products' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })
    
    if (productsError) {
      console.log('❌ Erro ao verificar schema products:', productsError.message)
      
      // Tentar método alternativo
      console.log('\n🔄 Tentando método alternativo...')
      const { data: sampleProduct, error: sampleError } = await supabase
        .from('products')
        .select('*')
        .limit(1)
        .single()
      
      if (sampleError && sampleError.code !== 'PGRST116') {
        console.log('❌ Erro ao buscar produto de exemplo:', sampleError.message)
      } else if (sampleProduct) {
        console.log('✅ Colunas encontradas na tabela products:')
        Object.keys(sampleProduct).forEach(key => {
          console.log(`  - ${key}: ${typeof sampleProduct[key]}`)
        })
      } else {
        console.log('📝 Tabela products existe mas está vazia')
        
        // Tentar inserir um produto simples para descobrir as colunas
        const { error: insertError } = await supabase
          .from('products')
          .insert({
            name: 'Teste',
            price: 10.00
          })
        
        if (insertError) {
          console.log('❌ Erro ao inserir produto teste:', insertError.message)
          console.log('💡 Detalhes do erro:', insertError.details)
        }
      }
    } else {
      console.log('✅ Schema da tabela products:')
      productsSchema.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`)
      })
    }
    
    // Verificar estrutura da tabela categories
    console.log('\n📋 Estrutura da tabela categories:')
    const { data: sampleCategory } = await supabase
      .from('categories')
      .select('*')
      .limit(1)
      .single()
    
    if (sampleCategory) {
      console.log('✅ Colunas encontradas na tabela categories:')
      Object.keys(sampleCategory).forEach(key => {
        console.log(`  - ${key}: ${typeof sampleCategory[key]}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message)
  }
}

checkSchema()