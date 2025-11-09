const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script para remover medidores que não têm IP identificado
 * Remove medidores 34 e 438692 e todas as suas leituras
 */

async function removeMetersWithoutIP() {
  const meterIds = [34, 438692];
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🗑️  REMOÇÃO DE MEDIDORES SEM IP IDENTIFICADO');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`⚠️  ATENÇÃO: Este script irá remover PERMANENTEMENTE:`);
  console.log(`   - Medidores: ${meterIds.join(', ')}`);
  console.log(`   - Todas as leituras desses medidores`);
  console.log(`   - Todos os dados relacionados\n`);

  try {
    for (const meterId of meterIds) {
      console.log(`\n📊 PROCESSANDO MEDIDOR ${meterId}:`);
      console.log('─────────────────────────────────────────────────────────────────────────────');
      
      // Verificar se o medidor existe
      const device = await prisma.device.findUnique({
        where: { meterId },
        include: {
          readings: {
            select: {
              id: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      if (!device) {
        console.log(`   ❌ Medidor ${meterId} não encontrado. Pulando...`);
        continue;
      }

      console.log(`   ✅ Medidor encontrado: ${device.name}`);
      console.log(`   📍 IP: ${device.ipAddress || 'NULL (não registrado)'}`);
      console.log(`   📈 Total de leituras: ${device.readings.length}`);
      console.log(`   👤 Usuário associado: ${device.user ? device.user.email : 'Nenhum'}`);

      // Contar leituras antes de remover
      const readingsCount = await prisma.reading.count({
        where: { meterId },
      });

      console.log(`\n   🗑️  Iniciando remoção...`);

      // Remover em transação para garantir consistência
      await prisma.$transaction(async (tx) => {
        // 1. Remover todas as leituras do medidor
        // (Isso deve ser feito primeiro devido à foreign key)
        const deletedReadings = await tx.reading.deleteMany({
          where: { meterId },
        });
        console.log(`   ✅ ${deletedReadings.count} leitura(s) removida(s)`);

        // 2. Remover o dispositivo
        // (Como há cascade, as leituras já foram removidas, mas garantimos)
        const deletedDevice = await tx.device.delete({
          where: { meterId },
        });
        console.log(`   ✅ Dispositivo removido: ${deletedDevice.name}`);
      });

      console.log(`   ✅ Medidor ${meterId} e todos os seus dados foram removidos com sucesso!`);
    }

    // Verificar se ainda há medidores sem IP
    console.log(`\n\n📊 VERIFICAÇÃO FINAL:`);
    console.log('─────────────────────────────────────────────────────────────────────────────');
    
    const devicesWithoutIP = await prisma.device.findMany({
      where: {
        ipAddress: null,
      },
      select: {
        meterId: true,
        name: true,
        status: true,
      },
    });

    if (devicesWithoutIP.length > 0) {
      console.log(`⚠️  Ainda existem ${devicesWithoutIP.length} medidor(es) sem IP:`);
      devicesWithoutIP.forEach(device => {
        console.log(`   - Medidor ${device.meterId} (${device.name}) - Status: ${device.status}`);
      });
      console.log(`\n   💡 Recomendação: Revise esses medidores e remova-os se necessário.`);
    } else {
      console.log(`✅ Nenhum medidor sem IP encontrado no banco de dados.`);
    }

    // Estatísticas finais
    const totalDevices = await prisma.device.count();
    const totalReadings = await prisma.reading.count();
    const devicesWithIP = await prisma.device.count({
      where: {
        ipAddress: { not: null },
      },
    });

    console.log(`\n\n📈 ESTATÍSTICAS FINAIS:`);
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`   Total de medidores: ${totalDevices}`);
    console.log(`   Medidores com IP: ${devicesWithIP}`);
    console.log(`   Medidores sem IP: ${totalDevices - devicesWithIP}`);
    console.log(`   Total de leituras: ${totalReadings}`);
    console.log(`\n✅ Processo concluído com sucesso!\n`);

  } catch (error) {
    console.error('\n❌ Erro ao remover medidores:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar remoção
removeMetersWithoutIP();

