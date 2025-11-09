const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script para monitorar e descobrir IPs dos medidores 34 e 438692
 * 
 * Este script verifica periodicamente se os medidores enviaram dados
 * e mostra informações detalhadas sobre o IP quando encontrado.
 */

async function monitorMeterIPs() {
  const meterIds = [34, 438692];
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔍 MONITORAMENTO: IPs dos Medidores 34 e 438692');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📌 Este script verifica o estado atual dos medidores.');
  console.log('📌 Para descobrir os IPs, você precisa:');
  console.log('   1. Verificar os logs do servidor quando os medidores enviarem dados');
  console.log('   2. Verificar configurações de nginx/proxy');
  console.log('   3. Aguardar uma nova requisição e monitorar em tempo real\n');

  try {
    for (const meterId of meterIds) {
      console.log(`\n📊 VERIFICANDO MEDIDOR ${meterId}:`);
      console.log('─────────────────────────────────────────────────────────────────────────────');
      
      // Buscar dispositivo
      const device = await prisma.device.findUnique({
        where: { meterId },
        select: {
          meterId: true,
          name: true,
          ipAddress: true,
          status: true,
          updatedAt: true,
          createdAt: true,
        },
      });

      if (!device) {
        console.log(`❌ Medidor ${meterId} não encontrado.`);
        continue;
      }

      console.log(`✅ Medidor: ${device.name}`);
      console.log(`   Status: ${device.status}`);
      console.log(`   IP Atual: ${device.ipAddress || '❌ NÃO REGISTRADO'}`);
      console.log(`   Criado em: ${device.createdAt.toLocaleString('pt-BR')}`);
      console.log(`   Atualizado em: ${device.updatedAt.toLocaleString('pt-BR')}`);

      // Verificar leituras mais recentes
      const recentReadings = await prisma.reading.findMany({
        where: { meterId },
        orderBy: { timestamp: 'desc' },
        take: 3,
        select: {
          id: true,
          timestamp: true,
          createdAt: true,
        },
      });

      if (recentReadings.length > 0) {
        console.log(`\n   📈 Leituras recentes:`);
        recentReadings.forEach((reading, index) => {
          const timeAgo = Math.floor((Date.now() - reading.timestamp.getTime()) / (1000 * 60));
          console.log(`      ${index + 1}. ${reading.timestamp.toLocaleString('pt-BR')} (há ${timeAgo} minutos)`);
        });
      }

      // Calcular tempo desde última atualização
      const timeSinceUpdate = Date.now() - device.updatedAt.getTime();
      const hoursAgo = Math.floor(timeSinceUpdate / (1000 * 60 * 60));
      const minutesAgo = Math.floor((timeSinceUpdate % (1000 * 60 * 60)) / (1000 * 60));

      console.log(`\n   ⏰ Última atualização: há ${hoursAgo}h ${minutesAgo}min`);
      
      if (!device.ipAddress) {
        console.log(`\n   ⚠️ IP NÃO REGISTRADO - POSSÍVEIS CAUSAS:`);
        console.log(`      1. O IP não pôde ser extraído da requisição HTTP`);
        console.log(`      2. A requisição veio através de um proxy sem headers corretos`);
        console.log(`      3. O servidor não conseguiu determinar o IP de origem`);
        console.log(`      4. O IP estava como "unknown" e não foi salvo`);
      }
    }

    console.log(`\n\n💡 COMO DESCOBRIR OS IPs:`);
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`\n1. VERIFICAR LOGS DO SERVIDOR:`);
    console.log(`   - Os logs do NestJS devem conter: "IP do cliente: <IP>"`);
    console.log(`   - Procure por logs no momento em que os medidores enviaram dados`);
    console.log(`   - Procure por: "MeterId: 34" ou "MeterId: 438692"`);
    console.log(`   - Os logs devem mostrar o IP mesmo que seja "unknown"`);
    
    console.log(`\n2. VERIFICAR LOGS DO NGINX (se houver):`);
    console.log(`   - Verificar arquivo de acesso do nginx`);
    console.log(`   - Procurar por requisições POST para /api/eletroon/medidor`);
    console.log(`   - Verificar headers x-forwarded-for e x-real-ip`);
    
    console.log(`\n3. MONITORAR EM TEMPO REAL:`);
    console.log(`   - Quando os medidores enviarem dados novamente, o IP será capturado`);
    console.log(`   - O sistema salva o IP automaticamente quando não é "unknown"`);
    console.log(`   - Verifique os logs em tempo real quando os medidores enviarem dados`);
    
    console.log(`\n4. VERIFICAR CONFIGURAÇÃO DE REDE:`);
    console.log(`   - Verificar se os medidores estão configurados corretamente`);
    console.log(`   - Verificar se há proxy ou load balancer na frente do servidor`);
    console.log(`   - Verificar se o nginx está passando os headers corretos`);
    
    console.log(`\n5. CONSULTAR BANCO DE DADOS DIRETAMENTE:`);
    console.log(`   - Execute: SELECT * FROM "Device" WHERE "meterId" IN (34, 438692);`);
    console.log(`   - Verifique o campo ipAddress (pode ser NULL)`);
    
    console.log(`\n\n📋 PRÓXIMOS PASSOS:`);
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log(`1. Verificar os logs do servidor NestJS`);
    console.log(`2. Verificar se há nginx ou proxy configurado`);
    console.log(`3. Aguardar próxima requisição dos medidores e monitorar logs`);
    console.log(`4. Verificar configuração de rede dos medidores físicos`);
    console.log(`\n`);

  } catch (error) {
    console.error('❌ Erro ao monitorar medidores:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar uma vez
monitorMeterIPs();

// Se quiser monitorar continuamente (descomente):
// setInterval(monitorMeterIPs, 60000); // A cada 1 minuto

