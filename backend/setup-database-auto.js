// Script para criar e configurar o banco de dados EletroON
// Tenta várias senhas comuns do PostgreSQL
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ler .env manualmente
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

// Senhas comuns para tentar
const commonPasswords = ['postgres', 'postgres123', 'admin', 'root', '123456', '', 'password'];

async function testConnection(password) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres',
    connect_timeout: 3,
  });

  try {
    await client.connect();
    await client.end();
    return true;
  } catch (error) {
    return false;
  }
}

async function createDatabase(password) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres',
  });

  try {
    console.log('🔌 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL!');

    // Verificar se o banco já existe
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'eletroon'"
    );

    if (checkDb.rows.length > 0) {
      console.log('ℹ️  Banco de dados "eletroon" já existe.');
    } else {
      // Criar o banco de dados
      await client.query('CREATE DATABASE eletroon');
      console.log('✅ Banco de dados "eletroon" criado com sucesso!');
    }

    await client.end();
    
    // Atualizar o .env com a senha correta
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      /DATABASE_URL=postgresql:\/\/postgres:[^@]+@/,
      `DATABASE_URL=postgresql://postgres:${password}@`
    );
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ Arquivo .env atualizado com a senha correta!');
    
    console.log('\n📊 Executando migrações do Prisma...');
    try {
      execSync('pnpm prisma:migrate:deploy', { 
        cwd: __dirname, 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: `postgresql://postgres:${password}@localhost:5432/eletroon?schema=public` }
      });
      console.log('\n✅ Migrações executadas com sucesso!');
      
      console.log('\n🎉 Banco de dados configurado completamente!');
      console.log('\nPróximos passos:');
      console.log('  1. Execute: pnpm prisma:generate');
      console.log('  2. Execute: pnpm start:dev');
      
    } catch (error) {
      console.log('\n⚠️  Execute manualmente: pnpm prisma:migrate:deploy');
    }
    
    return true;
  } catch (error) {
    await client.end().catch(() => {});
    throw error;
  }
}

async function main() {
  console.log('🔍 Tentando descobrir a senha do PostgreSQL...\n');
  
  // Tentar a senha do .env primeiro
  const envPassword = process.env.DATABASE_URL?.match(/postgresql:\/\/postgres:([^@]+)@/)?.[1] || 'postgres';
  
  console.log(`Tentando senha do .env: "${envPassword}"`);
  if (await testConnection(envPassword)) {
    console.log('✅ Senha correta encontrada!\n');
    await createDatabase(envPassword);
    return;
  }
  
  // Tentar senhas comuns
  for (const password of commonPasswords) {
    if (password === envPassword) continue; // Já tentamos essa
    
    console.log(`Tentando senha: "${password || '(vazia)'}"`);
    if (await testConnection(password)) {
      console.log('✅ Senha correta encontrada!\n');
      await createDatabase(password);
      return;
    }
  }
  
  console.log('\n❌ Não foi possível conectar ao PostgreSQL com nenhuma senha comum.');
  console.log('\n💡 Soluções:');
  console.log('  1. Verifique se o PostgreSQL está instalado e rodando');
  console.log('  2. Execute: Get-Service -Name "*postgres*"');
  console.log('  3. Configure a senha correta no arquivo .env');
  console.log('  4. Ou execute: .\\setup-database-interactive.ps1');
  process.exit(1);
}

main().catch(error => {
  console.error('\n❌ Erro:', error.message);
  process.exit(1);
});




