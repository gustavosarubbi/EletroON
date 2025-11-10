const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuários no banco de dados...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados.');
      console.log('\n💡 Crie usuários através da API ou interface administrativa.');
    } else {
      console.log(`✅ Encontrados ${users.length} usuário(s) no banco:\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Criado em: ${user.createdAt.toISOString()}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

