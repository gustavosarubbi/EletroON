const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const adminEmail = 'admin@eletroon.com';
    const adminPassword = 'admin123';

    console.log('🔍 Verificando se o usuário admin já existe...');

    // Verificar se o usuário já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('⚠️  Usuário admin já existe!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   ID: ${existingAdmin.id}`);
      
      // Verificar se a senha está correta
      const isPasswordValid = await bcrypt.compare(adminPassword, existingAdmin.password);
      
      if (isPasswordValid) {
        console.log('✅ A senha já está correta!');
      } else {
        console.log('⚠️  A senha não corresponde. Atualizando senha...');
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await prisma.user.update({
          where: { email: adminEmail },
          data: {
            password: hashedPassword,
            role: 'ADMIN',
          },
        });
        console.log('✅ Senha atualizada com sucesso!');
      }
    } else {
      console.log('📝 Criando novo usuário admin...');
      
      // Criar hash da senha
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Criar usuário
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      console.log('✅ Usuário admin criado com sucesso!');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Criado em: ${admin.createdAt}`);
    }

    console.log('\n📋 Credenciais:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

