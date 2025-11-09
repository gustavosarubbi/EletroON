const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listMeters() {
  try {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 LISTA DE MEDIDORES - ID, IP e NOME');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Query para buscar todos os medidores
    const devices = await prisma.device.findMany({
      select: {
        meterId: true,
        name: true,
        ipAddress: true,
        location: true,
        status: true,
      },
      orderBy: {
        meterId: 'asc',
      },
    });

    if (devices.length === 0) {
      console.log('❌ Nenhum medidor encontrado no banco de dados.\n');
    } else {
      // Cabeçalho da tabela
      console.log('ID\t| IP\t\t\t| Nome\t\t\t| Status\t| Localização');
      console.log('─────────────────────────────────────────────────────────────────────────────');
      
      // Listar cada medidor
      devices.forEach(device => {
        const id = device.meterId.toString().padEnd(4);
        // Limpar prefixo ::ffff: se existir (IPv6 mapeado para IPv4)
        let ip = device.ipAddress || 'N/A';
        if (ip.startsWith('::ffff:')) {
          ip = ip.replace('::ffff:', '');
        }
        ip = ip.padEnd(20);
        const name = (device.name || 'N/A').padEnd(20);
        const status = (device.status || 'N/A').padEnd(10);
        const location = device.location || 'N/A';
        
        console.log(`${id}\t| ${ip}\t| ${name}\t| ${status}\t| ${location}`);
      });
      
      console.log('\n═══════════════════════════════════════════════════════');
      console.log(`✅ Total: ${devices.length} medidor(es) encontrado(s)`);
      console.log('═══════════════════════════════════════════════════════\n');
      
      // Também exibir em formato JSON para fácil cópia
      console.log('📄 Formato JSON:');
      console.log(JSON.stringify(devices.map(d => {
        let ip = d.ipAddress || null;
        // Limpar prefixo ::ffff: se existir
        if (ip && ip.startsWith('::ffff:')) {
          ip = ip.replace('::ffff:', '');
        }
        return {
          id: d.meterId,
          ip: ip,
          nome: d.name
        };
      }), null, 2));
      console.log('');
    }
  } catch (error) {
    console.error('❌ Erro ao listar medidores:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listMeters();

