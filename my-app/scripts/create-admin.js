const { createClient } = require('@supabase/supabase-js')

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

async function createAdminUser() {
  try {
    console.log('Criando usuário admin...')
    
    // Criar usuário admin
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@boutique.com',
      password: 'admin123',
      email_confirm: true
    })

    if (userError) {
      console.error('Erro ao criar usuário:', userError)
      return
    }

    console.log('Usuário criado:', userData.user.email)

    // Criar perfil admin
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userData.user.id,
        email: userData.user.email,
        full_name: 'Administrador',
        role: 'admin'
      })
      .select()
      .single()

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError)
      return
    }

    console.log('Perfil admin criado com sucesso!')
    console.log('Email: admin@boutique.com')
    console.log('Senha: admin123')
    console.log('Role:', profileData.role)
    
  } catch (error) {
    console.error('Erro geral:', error)
  }
}

createAdminUser()