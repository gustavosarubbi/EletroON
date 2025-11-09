const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateMeterIPs() {
  try {
    const meterIds = [34, 438692];
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔍 INVESTIGAÇÃO: IPs dos Medidores 34 e 438692');
    console.log('═══════════════════════════════════════════════════════\n');

    for (const meterId of meterIds) {
      console.log(`\n📊 MEDIDOR ${meterId}:`);
      console.log('─────────────────────────────────────────────────────────────────────────────');
      
      // Buscar informações do dispositivo
      const device = await prisma.device.findUnique({
        where: { meterId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          readings: {
            orderBy: { timestamp: 'desc' },
            take: 5,
            select: {
              id: true,
              timestamp: true,
              createdAt: true,
            },
          },
        },
      });

      if (!device) {
        console.log(`❌ Medidor ${meterId} não encontrado no banco de dados.`);
        continue;
      }

      console.log(`✅ Medidor encontrado:`);
      console.log(`   Nome: ${device.name}`);
      console.log(`   IP Atual: ${device.ipAddress || 'NULL (não registrado)'}`);
      console.log(`   Status: ${device.status}`);
      console.log(`   Localização: ${device.location || 'N/A'}`);
      console.log(`   Criado em: ${device.createdAt.toLocaleString('pt-BR')}`);
      console.log(`   Atualizado em: ${device.updatedAt.toLocaleString('pt-BR')}`);
      
      if (device.user) {
        console.log(`   Usuário associado: ${device.user.email} (ID: ${device.user.id})`);
      } else {
        console.log(`   Usuário associado: Nenhum`);
      }

      // Buscar total de leituras
      const totalReadings = await prisma.reading.count({
        where: { meterId },
      });

      console.log(`\n📈 Leituras:`);
      console.log(`   Total de leituras: ${totalReadings}`);

      if (device.readings.length > 0) {
        console.log(`   Primeira leitura: ${device.readings[device.readings.length - 1].timestamp.toLocaleString('pt-BR')}`);
        console.log(`   Última leitura: ${device.readings[0].timestamp.toLocaleString('pt-BR')}`);
        console.log(`   Últimas 5 leituras:`);
        device.readings.forEach((reading, index) => {
          console.log(`     ${index + 1}. ${reading.timestamp.toLocaleString('pt-BR')} (ID: ${reading.id})`);
        });
      } else {
        console.log(`   ⚠️ Nenhuma leitura encontrada para este medidor.`);
      }

      // Verificar se há algum log ou histórico que possa indicar o IP
      // Vamos verificar quando o dispositivo foi atualizado pela última vez
      const timeSinceUpdate = new Date() - device.updatedAt;
      const hoursSinceUpdate = Math.floor(timeSinceUpdate / (1000 * 60 * 60));
      const daysSinceUpdate = Math.floor(hoursSinceUpdate / 24);

      console.log(`\n⏰ Tempo desde última atualização:`);
      console.log(`   ${hoursSinceUpdate} horas (${daysSinceUpdate} dias)`);

      // Verificar se há leituras muito recentes mas o IP não foi atualizado
      if (device.readings.length > 0 && !device.ipAddress) {
        const lastReading = device.readings[0];
        const timeSinceLastReading = new Date() - lastReading.timestamp;
        const hoursSinceLastReading = Math.floor(timeSinceLastReading / (1000 * 60 * 60));
        
        console.log(`\n⚠️ ALERTA:`);
        console.log(`   O medidor enviou dados há ${hoursSinceLastReading} horas, mas o IP não foi capturado.`);
        console.log(`   Possíveis causas:`);
        console.log(`   1. O IP não pôde ser extraído da requisição`);
        console.log(`   2. A requisição veio através de um proxy que não passou os headers corretos`);
        console.log(`   3. O medidor pode estar usando um método de envio que não expõe o IP`);
      }
    }

    // Verificar se há outros medidores sem IP para comparação
    console.log(`\n\n📊 COMPARAÇÃO: Outros medidores sem IP`);
    console.log('─────────────────────────────────────────────────────────────────────────────');
    
    const devicesWithoutIP = await prisma.device.findMany({
      where: {
        ipAddress: null,
      },
      select: {
        meterId: true,
        name: true,
        status: true,
        updatedAt: true,
      },
      orderBy: {
        meterId: 'asc',
      },
    });

    if (devicesWithoutIP.length > 0) {
      console.log(`Total de medidores sem IP: ${devicesWithoutIP.length}`);
      devicesWithoutIP.forEach(device => {
        const timeSinceUpdate = new Date() - device.updatedAt;
        const hoursSinceUpdate = Math.floor(timeSinceUpdate / (1000 * 60 * 60));
        console.log(`   - Medidor ${device.meterId} (${device.name}): atualizado há ${hoursSinceUpdate} horas`);
      });
    } else {
      console.log(`✅ Todos os outros medidores têm IP registrado.`);
    }

    // Sugestões para descobrir o IP
    console.log(`\n\n💡 SUGESTÕES PARA DESCOBRIR OS IPs:`);
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`1. Verificar os logs do servidor no momento em que os medidores enviaram dados`);
    console.log(`2. Verificar configurações de proxy/nginx que podem estar ocultando o IP`);
    console.log(`3. Verificar se os medidores estão configurados para enviar dados diretamente`);
    console.log(`4. Aguardar uma nova requisição dos medidores e verificar os logs em tempo real`);
    console.log(`5. Verificar a configuração de rede dos medidores físicos`);
    console.log(`\n`);

  } catch (error) {
    console.error('❌ Erro ao investigar medidores:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

investigateMeterIPs();

