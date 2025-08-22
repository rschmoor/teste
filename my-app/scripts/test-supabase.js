// Script para testar conexão com Supabase
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não encontradas')
    return
  }
  
  console.log('📡 URL:', supabaseUrl)
  console.log('🔑 Service Key:', supabaseKey.substring(0, 20) + '...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Testar conexão básica
    console.log('\n🔍 Verificando tabelas existentes...')
    
    // Verificar tabela profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.log('❌ Erro ao acessar tabela profiles:', profilesError.message)
    } else {
      console.log('✅ Tabela profiles acessível')
      console.log('📊 Exemplo de profile:', profiles[0] || 'Nenhum registro encontrado')
    }
    
    // Verificar tabela products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1)
    
    if (productsError) {
      console.log('❌ Erro ao acessar tabela products:', productsError.message)
    } else {
      console.log('✅ Tabela products acessível')
      console.log('📊 Exemplo de produto:', products[0] || 'Nenhum registro encontrado')
    }
    
    // Verificar tabela categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(1)
    
    if (categoriesError) {
      console.log('❌ Erro ao acessar tabela categories:', categoriesError.message)
    } else {
      console.log('✅ Tabela categories acessível')
      console.log('📊 Exemplo de categoria:', categories[0] || 'Nenhum registro encontrado')
    }
    
    // Verificar tabela orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1)
    
    if (ordersError) {
      console.log('❌ Erro ao acessar tabela orders:', ordersError.message)
    } else {
      console.log('✅ Tabela orders acessível')
      console.log('📊 Exemplo de pedido:', orders[0] || 'Nenhum registro encontrado')
    }
    
    console.log('\n✅ Teste de conexão concluído!')
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  }
}

testSupabaseConnection()