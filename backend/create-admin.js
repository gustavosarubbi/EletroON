// Script para criar/atualizar usuário admin
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@eletroon.com';
  const password = 'admin123';
  
  console.log('🔐 Criando/atualizando usuário administrador...\n');
  
  try {
    // Verificar se já existe
    let existing = null;
    try {
      existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
    } catch (error) {
      console.log('⚠️  Erro ao buscar usuário, tentando corrigir...');
    }
    
    const hash = await bcrypt.hash(password, 10);
    
    if (existing) {
      console.log('✅ Usuário já existe, atualizando...');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Role atual: ${existing.role}`);
      
      // Atualizar senha e garantir que role seja ADMIN
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          password: hash,
          role: 'ADMIN'  // Garantir que seja string
        }
      });
      console.log('✅ Usuário atualizado com sucesso!');
    } else {
      console.log('📝 Criando novo usuário admin...');
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hash,
          role: 'ADMIN'  // Garantir que seja string
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
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

