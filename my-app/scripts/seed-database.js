require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('🌱 Iniciando seed do banco de dados...');
  
  try {
    // 1. Verificar tabela profiles
    console.log('\n👤 Verificando tabela profiles...');
    
    const { data: existingProfiles, error: profilesTestError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesTestError && profilesTestError.message.includes('does not exist')) {
      console.log('❌ Tabela profiles não existe. Precisa ser criada manualmente no Supabase.');
      console.log('📋 SQL para criar a tabela profiles:');
      console.log(`
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'manager')),
          phone TEXT,
          address JSONB,
          preferences JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own profile" ON profiles
          FOR SELECT USING (auth.uid() = id);
        
        CREATE POLICY "Users can update own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id);
      `);
    } else {
      console.log('✅ Tabela profiles já existe');
    }
    
    // 2. Inserir categorias se não existirem
    console.log('\n📂 Inserindo categorias...');
    
    const categories = [
      {
        name: 'Roupas Femininas',
        slug: 'roupas-femininas',
        parent_id: null,
        icon: '👗',
        display_order: 1,
        is_active: true
      },
      {
        name: 'Roupas Masculinas',
        slug: 'roupas-masculinas',
        parent_id: null,
        icon: '👔',
        display_order: 2,
        is_active: true
      },
      {
        name: 'Acessórios',
        slug: 'acessorios',
        parent_id: null,
        icon: '👜',
        display_order: 3,
        is_active: true
      },
      {
        name: 'Calçados',
        slug: 'calcados',
        parent_id: null,
        icon: '👠',
        display_order: 4,
        is_active: true
      }
    ];
    
    for (const category of categories) {
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category.slug)
        .single();
      
      if (!existingCategory) {
        const { error } = await supabase
          .from('categories')
          .insert(category);
        
        if (error) {
          console.log(`❌ Erro ao inserir categoria ${category.name}:`, error.message);
        } else {
          console.log(`✅ Categoria ${category.name} inserida`);
        }
      } else {
        console.log(`⏭️ Categoria ${category.name} já existe`);
      }
    }
    
    // 3. Inserir produtos de exemplo (com sale_price obrigatório)
    console.log('\n🛍️ Inserindo produtos de exemplo...');
    
    // Primeiro, vamos descobrir quais categorias existem
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id, name')
      .limit(2);
    
    if (existingCategories && existingCategories.length > 0) {
      const products = [
        {
          sku: 'DRESS-001',
          name: 'Vestido Floral Elegante',
          sale_price: 189.90,
          category_id: existingCategories[0].id
        },
        {
          sku: 'SHIRT-001',
          name: 'Camisa Social Masculina',
          sale_price: 129.90,
          category_id: existingCategories[1]?.id || existingCategories[0].id
        },
        {
          sku: 'BAG-001',
          name: 'Bolsa de Couro Premium',
          sale_price: 299.90
        },
        {
          sku: 'SHOE-001',
          name: 'Sapato Social Clássico',
          sale_price: 249.90
        }
      ];
      
      for (const product of products) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('sku', product.sku)
          .single();
        
        if (!existingProduct) {
          const { error } = await supabase
            .from('products')
            .insert(product);
          
          if (error) {
            console.log(`❌ Erro ao inserir produto ${product.name}:`, error.message);
          } else {
            console.log(`✅ Produto ${product.name} inserido`);
          }
        } else {
          console.log(`⏭️ Produto ${product.name} já existe`);
        }
      }
    } else {
      console.log('❌ Nenhuma categoria encontrada para associar aos produtos');
    }
    
    // 4. Verificar dados inseridos
    console.log('\n📊 Verificando dados inseridos...');
    
    const { data: categoriesCount, error: catCountError } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true });
    
    const { data: productsCount, error: prodCountError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });
    
    if (!catCountError) {
      console.log(`📂 Total de categorias: ${categoriesCount?.length || 0}`);
    }
    
    if (!prodCountError) {
      console.log(`🛍️ Total de produtos: ${productsCount?.length || 0}`);
    }
    
    console.log('\n🎉 Seed do banco de dados concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error.message);
  }
}

seedDatabase();