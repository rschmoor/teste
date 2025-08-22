require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function discoverTableStructure() {
  console.log('🔍 Descobrindo estrutura das tabelas...');
  
  // Testar estrutura da tabela products
  console.log('\n📋 Testando estrutura da tabela products:');
  
  // Teste 1: Inserir apenas sku
  let { error } = await supabase
    .from('products')
    .insert({ sku: 'TEST-001' });
  
  if (error) {
    console.log('❌ Erro com apenas SKU:', error.message);
  } else {
    console.log('✅ SKU é suficiente');
    // Limpar o teste
    await supabase.from('products').delete().eq('sku', 'TEST-001');
  }
  
  // Teste 2: Tentar com campos comuns
  ({ error } = await supabase
    .from('products')
    .insert({ 
      sku: 'TEST-002',
      name: 'Produto Teste',
      price: 99.99
    }));
  
  if (error) {
    console.log('❌ Erro com SKU+name+price:', error.message);
  } else {
    console.log('✅ SKU+name+price funcionou');
    // Limpar o teste
    await supabase.from('products').delete().eq('sku', 'TEST-002');
  }
  
  // Teste 3: Tentar com mais campos
  ({ error } = await supabase
    .from('products')
    .insert({ 
      sku: 'TEST-003',
      name: 'Produto Teste',
      description: 'Descrição teste',
      price: 99.99,
      category_id: null
    }));
  
  if (error) {
    console.log('❌ Erro com campos estendidos:', error.message);
  } else {
    console.log('✅ Campos estendidos funcionaram');
    // Limpar o teste
    await supabase.from('products').delete().eq('sku', 'TEST-003');
  }
  
  // Verificar dados existentes para entender estrutura
  console.log('\n📊 Verificando dados existentes:');
  
  const { data: products, error: selectError } = await supabase
    .from('products')
    .select('*')
    .limit(1);
  
  if (selectError) {
    console.log('❌ Erro ao buscar produtos:', selectError.message);
  } else if (products && products.length > 0) {
    console.log('✅ Estrutura descoberta pelos dados existentes:');
    console.log('Colunas encontradas:', Object.keys(products[0]));
  } else {
    console.log('📝 Tabela products existe mas está vazia');
  }
  
  // Verificar categories
  console.log('\n📋 Verificando tabela categories:');
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .limit(1);
  
  if (catError) {
    console.log('❌ Erro ao buscar categories:', catError.message);
  } else if (categories && categories.length > 0) {
    console.log('✅ Estrutura da tabela categories:');
    console.log('Colunas:', Object.keys(categories[0]));
  } else {
    console.log('📝 Tabela categories existe mas está vazia');
  }
}

discoverTableStructure();