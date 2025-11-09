// Script para limpar o banco de dados e criar apenas o usuário admin
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@eletroon.com';
  const adminPassword = 'admin123';
  
  console.log('🧹 Limpando banco de dados...\n');
  
  try {
    // Deletar todas as leituras (readings)
    console.log('📊 Deletando todas as leituras...');
    const deletedReadings = await prisma.reading.deleteMany({});
    console.log(`✅ ${deletedReadings.count} leituras deletadas`);
    
    // Deletar todos os dispositivos (devices)
    console.log('📱 Deletando todos os dispositivos...');
    const deletedDevices = await prisma.device.deleteMany({});
    console.log(`✅ ${deletedDevices.count} dispositivos deletados`);
    
    // Deletar todos os usuários
    console.log('👥 Deletando todos os usuários...');
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`✅ ${deletedUsers.count} usuários deletados`);
    
    // Criar usuário admin
    console.log('\n🔐 Criando usuário administrador...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    
    console.log('\n📋 Credenciais de acesso:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}\n`);
    
    console.log('✨ Banco de dados limpo e resetado com sucesso!\n');
    
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

