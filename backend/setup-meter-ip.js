const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupMeterIp() {
  try {
    const meterId = 9;
    const ipAddress = '192.168.15.200';

    console.log(`Configurando medidor ID ${meterId} com IP ${ipAddress}...`);

    // Criar ou atualizar o dispositivo
    const device = await prisma.device.upsert({
      where: { meterId },
      update: {
        ipAddress,
        name: `Medidor ${meterId}`,
        status: 'OFFLINE',
        updatedAt: new Date(),
      },
      create: {
        meterId,
        name: `Medidor ${meterId}`,
        ipAddress,
        status: 'OFFLINE',
        location: null,
      },
    });

    console.log('✅ Dispositivo configurado com sucesso!');
    console.log(JSON.stringify(device, null, 2));
  } catch (error) {
    console.error('❌ Erro ao configurar dispositivo:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupMeterIp();

