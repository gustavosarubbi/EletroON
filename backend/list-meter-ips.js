const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listMeterIPs() {
  try {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🌐 IPs DE ORIGEM DOS MEDIDORES');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📌 Os IPs abaixo são os IPs de origem das requisições HTTP');
    console.log('   que os medidores fazem ao servidor quando enviam dados.\n');
    
    // Query para buscar todos os medidores com informações de IP
    const devices = await prisma.device.findMany({
      select: {
        meterId: true,
        name: true,
        ipAddress: true,
        status: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: {
        meterId: 'asc',
      },
    });

    // Buscar última leitura de cada medidor para ver quando foi a última comunicação
    const readings = await prisma.reading.groupBy({
      by: ['meterId'],
      _max: {
        timestamp: true,
      },
    });

    const lastReadingsMap = new Map();
    readings.forEach(r => {
      lastReadingsMap.set(r.meterId, r._max.timestamp);
    });

    if (devices.length === 0) {
      console.log('❌ Nenhum medidor encontrado no banco de dados.\n');
    } else {
      // Agrupar por IP para ver quantos medidores vêm do mesmo IP
      const ipGroups = {};
      devices.forEach(device => {
        let ip = device.ipAddress || 'N/A';
        // Limpar prefixo ::ffff: se existir
        if (ip.startsWith('::ffff:')) {
          ip = ip.replace('::ffff:', '');
        }
        
        if (!ipGroups[ip]) {
          ipGroups[ip] = [];
        }
        ipGroups[ip].push(device);
      });

      // Cabeçalho da tabela
      console.log('ID\t| IP de Origem\t\t| Nome\t\t\t| Última Atualização\t| Última Leitura');
      console.log('─────────────────────────────────────────────────────────────────────────────────────────────────────');
      
      // Listar cada medidor
      devices.forEach(device => {
        const id = device.meterId.toString().padEnd(4);
        let ip = device.ipAddress || 'N/A';
        // Limpar prefixo ::ffff: se existir
        if (ip.startsWith('::ffff:')) {
          ip = ip.replace('::ffff:', '');
        }
        ip = ip.padEnd(20);
        const name = (device.name || 'N/A').padEnd(20);
        const lastUpdate = device.updatedAt 
          ? new Date(device.updatedAt).toLocaleString('pt-BR')
          : 'N/A';
        const lastReading = lastReadingsMap.get(device.meterId);
        const lastReadingStr = lastReading 
          ? new Date(lastReading).toLocaleString('pt-BR')
          : 'Nunca';
        
        console.log(`${id}\t| ${ip}\t| ${name}\t| ${lastUpdate.padEnd(20)}\t| ${lastReadingStr}`);
      });
      
      console.log('\n═══════════════════════════════════════════════════════');
      console.log(`✅ Total: ${devices.length} medidor(es) encontrado(s)`);
      console.log(`🌐 IPs únicos: ${Object.keys(ipGroups).length}`);
      console.log('═══════════════════════════════════════════════════════\n');

      // Mostrar agrupamento por IP
      console.log('📊 AGRUPAMENTO POR IP DE ORIGEM:');
      console.log('─────────────────────────────────────────────────────────────────────────────');
      Object.keys(ipGroups).sort().forEach(ip => {
        const meters = ipGroups[ip];
        console.log(`\n🌐 IP: ${ip}`);
        console.log(`   Medidores (${meters.length}): ${meters.map(m => m.meterId).join(', ')}`);
        if (ip !== 'N/A') {
          const lastReading = meters
            .map(m => lastReadingsMap.get(m.meterId))
            .filter(t => t)
            .sort((a, b) => b - a)[0];
          if (lastReading) {
            console.log(`   Última comunicação: ${new Date(lastReading).toLocaleString('pt-BR')}`);
          }
        }
      });
      console.log('\n');

      // Resumo em formato JSON
      console.log('📄 Formato JSON (IP de Origem):');
      console.log(JSON.stringify(devices.map(d => {
        let ip = d.ipAddress || null;
        if (ip && ip.startsWith('::ffff:')) {
          ip = ip.replace('::ffff:', '');
        }
        return {
          id: d.meterId,
          nome: d.name,
          ipOrigem: ip,
          ultimaAtualizacao: d.updatedAt,
          ultimaLeitura: lastReadingsMap.get(d.meterId) || null
        };
      }), null, 2));
      console.log('');
    }
  } catch (error) {
    console.error('❌ Erro ao listar IPs dos medidores:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listMeterIPs();

