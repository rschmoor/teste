const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function fixProfileRLS() {
  console.log('🔧 Corrigindo políticas RLS para criação de perfis...')
  
  try {
    // 1. Verificar se a tabela existe
    console.log('📋 Verificando tabela user_profiles...')
    
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    
    if (tableError && tableError.code === 'PGRST116') {
      console.log('❌ Tabela user_profiles não encontrada!')
      return
    }
    
    console.log('✅ Tabela user_profiles encontrada')
    
    // 2. Verificar políticas RLS atuais
    console.log('\n🔍 Verificando políticas RLS atuais...')
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
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
          WHERE tablename = 'user_profiles' AND schemaname = 'public';
        `
      })
    
    if (policiesError) {
      console.log('⚠️  Não foi possível verificar políticas via RPC, tentando método alternativo...')
      
      // Método alternativo: tentar criar um perfil de teste
      console.log('\n🧪 Testando criação de perfil...')
      
      // Primeiro, vamos verificar se há usuários
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.log('❌ Erro ao verificar usuários:', authError.message)
        return
      }
      
      if (authUsers.users.length === 0) {
        console.log('⚠️  Nenhum usuário encontrado para testar')
        return
      }
      
      const testUser = authUsers.users[0]
      console.log(`🧪 Testando com usuário: ${testUser.email}`)
      
      // Verificar se o perfil já existe
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUser.id)
        .single()
      
      if (existingProfile) {
        console.log('✅ Perfil já existe para este usuário')
        
        // Testar se conseguimos atualizar (simulando criação)
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', testUser.id)
        
        if (updateError) {
          console.log('❌ Erro ao atualizar perfil (indica problema de RLS):', updateError.message)
          await createFixSQL()
        } else {
          console.log('✅ Perfil pode ser atualizado normalmente')
        }
      } else {
        // Tentar criar perfil
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: testUser.id,
            email: testUser.email,
            full_name: testUser.user_metadata?.full_name || testUser.email?.split('@')[0],
            role: 'customer'
          })
        
        if (insertError) {
          console.log('❌ Erro ao criar perfil (confirma problema de RLS):', insertError.message)
          await createFixSQL()
        } else {
          console.log('✅ Perfil criado com sucesso!')
        }
      }
    } else {
      console.log('📊 Políticas encontradas:', policies)
      
      // Verificar se as políticas necessárias existem
      const hasInsertPolicy = policies.some(p => 
        p.policyname.includes('insert') || p.cmd === 'INSERT'
      )
      
      if (!hasInsertPolicy) {
        console.log('❌ Política de INSERT não encontrada!')
        await createFixSQL()
      } else {
        console.log('✅ Políticas parecem estar configuradas')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    await createFixSQL()
  }
}

async function createFixSQL() {
  console.log('\n📝 SQL para corrigir as políticas RLS:')
  console.log('Execute este código no Supabase SQL Editor:')
  console.log(`
-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.user_profiles;

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para permitir que usuários criem seu próprio perfil
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Política para admins verem todos os perfis
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para service role (importante para criação automática)
CREATE POLICY "Service role can manage profiles" ON public.user_profiles
  FOR ALL USING (current_setting('role') = 'service_role');

-- Verificar se a função handle_updated_at existe
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para updated_at
DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
`)
  
  console.log('\n⚠️  IMPORTANTE: Após executar o SQL acima, execute este script novamente para verificar se o problema foi resolvido.')
}

fixProfileRLS().catch(console.error)