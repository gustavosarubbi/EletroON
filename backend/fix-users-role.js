// Script para corrigir roles inválidos no banco
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Corrigindo roles dos usuários...\n');
  
  try {
    // Buscar todos os usuários usando query raw para evitar erro de tipo
    const users = await prisma.$queryRaw`
      SELECT id, email, role FROM "User"
    `;
    
    console.log(`Encontrados ${users.length} usuários\n`);
    
    for (const user of users) {
      let newRole = user.role;
      
      // Converter role para string se necessário
      if (typeof user.role !== 'string') {
        newRole = String(user.role);
      }
      
      // Normalizar role
      if (newRole === 'ADMIN' || newRole === 'admin') {
        newRole = 'ADMIN';
      } else if (newRole === 'USER' || newRole === 'user') {
        newRole = 'USER';
      } else {
        // Se não for um valor válido, usar USER como padrão
        newRole = 'USER';
      }
      
      // Atualizar se necessário
      if (user.role !== newRole) {
        console.log(`Atualizando ${user.email}: "${user.role}" -> "${newRole}"`);
        await prisma.$executeRaw`
          UPDATE "User" SET role = ${newRole} WHERE id = ${user.id}
        `;
      } else {
        console.log(`✓ ${user.email}: role OK (${newRole})`);
      }
    }
    
    console.log('\n✅ Correção concluída!\n');
    
    // Agora criar/atualizar o admin
    console.log('🔐 Criando/atualizando usuário admin...\n');
    const bcrypt = require('bcrypt');
    const email = 'admin@eletroon.com';
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    
    // Verificar se existe usando query raw
    const existing = await prisma.$queryRaw`
      SELECT id, email, role FROM "User" WHERE email = ${email.toLowerCase()}
    `;
    
    if (existing && existing.length > 0) {
      console.log('✅ Usuário admin já existe, atualizando...');
      await prisma.$executeRaw`
        UPDATE "User" 
        SET password = ${hash}, role = 'ADMIN' 
        WHERE email = ${email.toLowerCase()}
      `;
      console.log('✅ Senha e role atualizados!');
    } else {
      console.log('📝 Criando novo usuário admin...');
      await prisma.$executeRaw`
        INSERT INTO "User" (email, password, role, "createdAt", "updatedAt")
        VALUES (${email.toLowerCase()}, ${hash}, 'ADMIN', NOW(), NOW())
      `;
      console.log('✅ Usuário admin criado!');
    }
    
    console.log('\n📋 Credenciais:');
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


