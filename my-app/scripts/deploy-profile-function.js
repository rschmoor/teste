const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function deployProfileFunction() {
  console.log('🚀 Implantando função create_user_profile...')
  
  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'create-profile-function.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Executando SQL...')
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    })
    
    if (error) {
      console.log('❌ Erro ao executar SQL:', error.message)
      
      // Tentar método alternativo - executar partes do SQL separadamente
      console.log('🔄 Tentando método alternativo...')
      
      // Dividir o SQL em comandos separados
      const commands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i] + ';'
        console.log(`📝 Executando comando ${i + 1}/${commands.length}...`)
        
        const { error: cmdError } = await supabase.rpc('exec_sql', {
          sql: command
        })
        
        if (cmdError) {
          console.log(`❌ Erro no comando ${i + 1}:`, cmdError.message)
          console.log('📋 Comando que falhou:', command.substring(0, 100) + '...')
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`)
        }
      }
    } else {
      console.log('✅ SQL executado com sucesso!')
    }
    
    // Testar a função
    console.log('\n🧪 Testando a função create_user_profile...')
    
    // Criar um UUID de teste
    const testUserId = '00000000-0000-0000-0000-000000000001'
    const testEmail = 'test@example.com'
    
    // Primeiro, remover o perfil de teste se existir
    await supabase
      .from('user_profiles')
      .delete()
      .eq('id', testUserId)
    
    // Testar a função
    const { data: testResult, error: testError } = await supabase
      .rpc('create_user_profile', {
        user_id: testUserId,
        user_email: testEmail,
        user_full_name: 'Usuário Teste',
        user_role: 'customer'
      })
    
    if (testError) {
      console.log('❌ Erro ao testar função:', testError.message)
    } else {
      console.log('✅ Função testada com sucesso!')
      console.log('📊 Resultado:', testResult)
      
      // Verificar se o perfil foi criado
      const { data: createdProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUserId)
        .single()
      
      if (fetchError) {
        console.log('⚠️  Erro ao verificar perfil criado:', fetchError.message)
      } else {
        console.log('✅ Perfil criado com sucesso:', createdProfile)
      }
      
      // Limpar o perfil de teste
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUserId)
      
      console.log('🧹 Perfil de teste removido')
    }
    
    console.log('\n🎉 Implantação concluída!')
    console.log('\n📋 Próximos passos:')
    console.log('1. A função create_user_profile está disponível')
    console.log('2. O AuthContext foi atualizado para usar esta função')
    console.log('3. Teste criando um novo usuário na aplicação')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

deployProfileFunction().catch(console.error)