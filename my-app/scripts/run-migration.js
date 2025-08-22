const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

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

async function runMigration(migrationFile) {
  try {
    console.log(`\n📋 Preparando migração: ${migrationFile}`)
    
    const migrationPath = path.join(__dirname, '..', 'src', 'lib', 'supabase', 'migrations', migrationFile)
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('\n' + '='.repeat(80))
    console.log('🔧 SQL PARA EXECUÇÃO MANUAL NO PAINEL DO SUPABASE')
    console.log('='.repeat(80))
    console.log('\n📍 Acesse: https://supabase.com/dashboard/project/[seu-projeto]/sql')
    console.log('\n📝 Cole e execute o seguinte SQL:')
    console.log('\n' + '-'.repeat(80))
    console.log(sql)
    console.log('-'.repeat(80))
    
    console.log('\n✅ Instruções de migração exibidas com sucesso!')
    console.log('\n💡 Após executar o SQL no painel do Supabase, a tabela newsletter_subscriptions estará criada.')
  } catch (error) {
    console.error(`❌ Erro ao ler migração ${migrationFile}:`, error.message)
    throw error
  }
}

async function main() {
  const migrationFile = process.argv[2]
  
  if (!migrationFile) {
    console.error('Por favor, especifique o arquivo de migração:')
    console.error('node scripts/run-migration.js create_newsletter.sql')
    process.exit(1)
  }
  
  try {
    await runMigration(migrationFile)
    console.log('🎉 Todas as migrações foram executadas com sucesso!')
  } catch (error) {
    console.error('💥 Falha na execução das migrações:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { runMigration }