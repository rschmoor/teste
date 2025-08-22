const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function fixRLSPolicies() {
  console.log('🔧 Configurando políticas RLS para user_profiles...')
  
  try {
    // 1. Verificar se a tabela user_profiles existe tentando fazer uma query
    console.log('📋 Verificando tabela user_profiles...')
    
    const { data: profiles, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    
    if (checkError && checkError.code === 'PGRST116') {
      console.log('⚠️  Tabela user_profiles não encontrada.')
      console.log('📝 Execute este SQL no Supabase SQL Editor:')
      console.log(`
-- Criar tabela user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Criar políticas RLS
CREATE POLICY "Users can view own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Criar função e trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON public.user_profiles;

CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
`)
      return
    }
    
    if (checkError) {
      console.log('❌ Erro ao verificar tabela:', checkError.message)
      return
    }
    
    console.log('✅ Tabela user_profiles encontrada')
    
    // 2. Verificar se há usuários para testar
    console.log('\n👥 Verificando usuários...')
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log('⚠️  Erro ao verificar usuários:', authError.message)
    } else {
      console.log(`📊 Encontrados ${authUsers.users.length} usuários`)
      
      if (authUsers.users.length > 0) {
        // Testar criação de perfil para o primeiro usuário
        const testUser = authUsers.users[0]
        console.log(`\n🧪 Testando com usuário: ${testUser.email}`)
        
        // Verificar se o perfil já existe
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', testUser.id)
          .single()
        
        if (!existingProfile) {
          console.log('📝 Criando perfil de teste...')
          
          // Tentar criar perfil usando service role
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: testUser.id,
              email: testUser.email,
              full_name: testUser.user_metadata?.full_name || testUser.email?.split('@')[0],
              role: 'customer'
            })
            .select()
            .single()
          
          if (insertError) {
            console.log('❌ Erro ao criar perfil de teste:', insertError.message)
            console.log('\n📝 Isso indica que as políticas RLS precisam ser configuradas.')
            console.log('Execute este SQL no Supabase SQL Editor:')
            console.log(`
-- Habilitar RLS (se não estiver habilitado)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Criar políticas RLS
CREATE POLICY "Users can view own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
`)
          } else {
            console.log('✅ Perfil de teste criado com sucesso:', newProfile)
          }
        } else {
          console.log('✅ Perfil já existe para o usuário de teste')
        }
      }
    }
    
    // 3. Verificar contagem de perfis
    const { count, error: countError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.log('⚠️  Erro ao contar perfis:', countError.message)
    } else {
      console.log(`\n📊 Total de perfis na tabela: ${count}`)
    }
    
    console.log('\n🎉 Verificação de RLS concluída!')
    console.log('\n💡 Se ainda houver erros de RLS, execute o SQL fornecido acima no Supabase SQL Editor.')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

fixRLSPolicies()
  .then(() => {
    console.log('\n✅ Script executado com sucesso')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  })