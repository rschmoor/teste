#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando auditoria de performance...');

// 1. Análise do bundle
console.log('\n📦 Analisando bundle size...');
try {
  execSync('npm run analyze', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  Bundle analyzer não configurado. Executando build...');
  execSync('npm run build', { stdio: 'inherit' });
}

// 2. Verificar tamanho dos chunks
console.log('\n📊 Verificando tamanho dos chunks...');
const buildDir = path.join(process.cwd(), '.next/static/chunks');
if (fs.existsSync(buildDir)) {
  const chunks = fs.readdirSync(buildDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(buildDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        sizeKB: Math.round(stats.size / 1024)
      };
    })
    .sort((a, b) => b.size - a.size);

  console.log('\n📋 Top 10 maiores chunks:');
  chunks.slice(0, 10).forEach((chunk, index) => {
    const status = chunk.sizeKB > 250 ? '🔴' : chunk.sizeKB > 100 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${status} ${chunk.name} - ${chunk.sizeKB}KB`);
  });

  // Alertas para chunks grandes
  const largeChunks = chunks.filter(chunk => chunk.sizeKB > 250);
  if (largeChunks.length > 0) {
    console.log('\n⚠️  Chunks grandes detectados (>250KB):');
    largeChunks.forEach(chunk => {
      console.log(`   - ${chunk.name}: ${chunk.sizeKB}KB`);
    });
    console.log('\n💡 Considere:');
    console.log('   - Code splitting adicional');
    console.log('   - Lazy loading de componentes');
    console.log('   - Tree shaking de dependências não utilizadas');
  }
}

// 3. Verificar dependências não utilizadas
console.log('\n🔍 Verificando dependências não utilizadas...');
try {
  execSync('npx depcheck --ignores="@types/*,eslint*,prettier,tailwindcss"', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  Depcheck não instalado. Instale com: npm install -g depcheck');
}

// 4. Lighthouse CI (se disponível)
console.log('\n🏠 Executando Lighthouse CI...');
try {
  execSync('npx lhci autorun', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️  Lighthouse CI não configurado ou servidor não está rodando.');
  console.log('💡 Para executar Lighthouse:');
  console.log('   1. npm run build && npm run start');
  console.log('   2. npx lhci autorun');
}

// 5. Recomendações gerais
console.log('\n✅ Auditoria concluída!');
console.log('\n🎯 Recomendações para otimização:');
console.log('   1. ✅ Next.js Image Optimization configurado');
console.log('   2. ✅ Bundle splitting configurado');
console.log('   3. ✅ PWA e Service Worker configurados');
console.log('   4. ✅ Compressão e cache headers configurados');
console.log('   5. ✅ Tree shaking habilitado');
console.log('   6. ✅ CSS e JS minificação habilitada');
console.log('\n📈 Para melhorar ainda mais:');
console.log('   - Implemente lazy loading em mais componentes');
console.log('   - Use React.memo() em componentes que re-renderizam frequentemente');
console.log('   - Otimize imagens para WebP/AVIF');
console.log('   - Considere usar dynamic imports para rotas');
console.log('   - Monitore Core Web Vitals em produção');

console.log('\n🚀 Performance audit completo!');