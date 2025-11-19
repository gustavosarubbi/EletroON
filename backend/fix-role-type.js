// Script para verificar e corrigir o tipo do campo role no banco
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando tipo do campo role no banco...\n');
  
  try {
    // Verificar tipo do campo role
    const columnInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'role'
    `;
    
    console.log('Informações da coluna role:');
    console.log(JSON.stringify(columnInfo, null, 2));
    console.log('');
    
    // Verificar se é um ENUM
    const enumInfo = await prisma.$queryRaw`
      SELECT t.typname, e.enumlabel
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname LIKE '%role%' OR e.enumlabel IN ('ADMIN', 'USER')
      ORDER BY t.typname, e.enumsortorder
    `;
    
    if (enumInfo && enumInfo.length > 0) {
      console.log('⚠️  ENUM encontrado no banco!');
      console.log(JSON.stringify(enumInfo, null, 2));
      console.log('');
      console.log('Convertendo ENUM para VARCHAR...');
      
      // Converter ENUM para VARCHAR
      await prisma.$executeRaw`
        ALTER TABLE "User" 
        ALTER COLUMN role TYPE VARCHAR(50) 
        USING role::text
      `;
      
      console.log('✅ Campo role convertido para VARCHAR!');
    }
    
    // Verificar dados atuais
    const users = await prisma.$queryRaw`
      SELECT id, email, role FROM "User"
    `;
    
    console.log('\nUsuários encontrados:');
    users.forEach(u => {
      console.log(`  ${u.email}: role = ${u.role} (tipo: ${typeof u.role})`);
    });
    
    // Garantir que todos os roles sejam strings válidas
    console.log('\n🔧 Corrigindo roles...');
    for (const user of users) {
      let roleValue = user.role;
      
      // Se for um objeto ou algo estranho, converter
      if (typeof roleValue !== 'string') {
        roleValue = String(roleValue);
      }
      
      // Normalizar
      if (roleValue === 'ADMIN' || roleValue === 'admin') {
        roleValue = 'ADMIN';
      } else if (roleValue === 'USER' || roleValue === 'user') {
        roleValue = 'USER';
      } else {
        roleValue = 'USER';
      }
      
      // Atualizar usando query raw
      await prisma.$executeRaw`
        UPDATE "User" SET role = ${roleValue} WHERE id = ${user.id}
      `;
      console.log(`  ✓ ${user.email}: role atualizado para "${roleValue}"`);
    }
    
    // Criar/atualizar admin
    console.log('\n🔐 Criando/atualizando usuário admin...');
    const bcrypt = require('bcrypt');
    const email = 'admin@eletroon.com';
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    
    const existing = await prisma.$queryRaw`
      SELECT id FROM "User" WHERE email = ${email.toLowerCase()}
    `;
    
    if (existing && existing.length > 0) {
      await prisma.$executeRaw`
        UPDATE "User" 
        SET password = ${hash}, role = 'ADMIN' 
        WHERE email = ${email.toLowerCase()}
      `;
      console.log('✅ Usuário admin atualizado!');
    } else {
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


