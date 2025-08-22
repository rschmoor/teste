const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_KEY')
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function checkUsers() {
  try {
    console.log('Verificando usuários no banco...')
    
    // Listar usuários de autenticação
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Erro ao buscar usuários de auth:', authError)
      return
    }
    
    console.log(`\nEncontrados ${authUsers.users.length} usuários de autenticação:`)
    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, ID: ${user.id}, Criado em: ${user.created_at}`)
    })
    
    // Listar perfis de usuários
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
    
    if (profilesError) {
      console.error('Erro ao buscar perfis:', profilesError)
      return
    }
    
    console.log(`\nEncontrados ${profiles.length} perfis de usuário:`)
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. Email: ${profile.email}, Role: ${profile.role}, Nome: ${profile.full_name || 'N/A'}`)
    })
    
    // Verificar se existe admin
    const adminProfiles = profiles.filter(p => p.role === 'admin')
    console.log(`\nAdministradores encontrados: ${adminProfiles.length}`)
    
    if (adminProfiles.length === 0) {
      console.log('\n⚠️  AVISO: Nenhum administrador encontrado!')
      console.log('Para testar o middleware, você precisa:')
      console.log('1. Criar um usuário admin')
      console.log('2. Ou promover um usuário existente a admin')
    } else {
      console.log('\n✅ Administradores encontrados:')
      adminProfiles.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email} (${admin.full_name || 'Sem nome'})`)
      })
    }
    
  } catch (error) {
    console.error('Erro:', error)
  }
}

checkUsers()