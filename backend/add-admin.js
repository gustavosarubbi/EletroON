// Script simples para adicionar usuário admin
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@eletroon.com';
  const password = 'admin123';
  
  console.log('🔐 Criando usuário administrador...\n');
  
  try {
    // Verificar se já existe
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existing) {
      console.log('⚠️  Usuário já existe!');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Role: ${existing.role}`);
      
      // Atualizar senha e role
      const hash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          password: hash,
          role: 'ADMIN'
        }
      });
      console.log('✅ Senha e role atualizados!');
    } else {
      // Criar novo
      const hash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hash,
          role: 'ADMIN'
        }
      });
      console.log('✅ Usuário criado com sucesso!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
    }
    
    console.log('\n📋 Credenciais de acesso:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${password}\n`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

