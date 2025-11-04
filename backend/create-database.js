// Script para criar o banco de dados EletroON
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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

async function createDatabase() {
  // Extrair credenciais da DATABASE_URL
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/eletroon';
  const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  
  if (!urlMatch) {
    console.error('❌ DATABASE_URL inválida no arquivo .env');
    process.exit(1);
  }

  const [, user, password, host, port, database] = urlMatch;
  
  // Conectar ao banco padrão 'postgres' primeiro
  const adminClient = new Client({
    host: host,
    port: parseInt(port),
    user: user,
    password: password,
    database: 'postgres',
  });

  try {
    console.log('🔌 Conectando ao PostgreSQL...');
    await adminClient.connect();
    console.log('✅ Conectado ao PostgreSQL!');

    // Verificar se o banco já existe
    const checkDb = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'eletroon'"
    );

    if (checkDb.rows.length > 0) {
      console.log('ℹ️  Banco de dados "eletroon" já existe.');
    } else {
      // Criar o banco de dados
      await adminClient.query('CREATE DATABASE eletroon');
      console.log('✅ Banco de dados "eletroon" criado com sucesso!');
    }

    await adminClient.end();
    
    console.log('\n📊 Executando migrações do Prisma...');
    console.log('Execute: pnpm prisma:migrate:deploy');
    
  } catch (error) {
    console.error('❌ Erro ao criar banco de dados:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Soluções possíveis:');
      console.log('   1. Verifique se o PostgreSQL está instalado');
      console.log('   2. Verifique se o serviço PostgreSQL está rodando');
      console.log('   3. Verifique se a senha no .env está correta');
      console.log('   4. Tente iniciar o PostgreSQL manualmente');
    } else if (error.code === '28P01') {
      console.log('\n💡 Senha incorreta! Verifique a senha no arquivo .env');
    }
    
    process.exit(1);
  }
}

createDatabase();

