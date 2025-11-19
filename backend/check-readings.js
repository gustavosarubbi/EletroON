// Script para verificar dados de leituras no banco de dados
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkReadings() {
  try {
    console.log('🔍 Verificando dados no banco...\n');
    
    // Contar total de leituras
    const totalReadings = await prisma.reading.count();
    console.log(`📊 Total de leituras no banco: ${totalReadings}`);
    
    if (totalReadings === 0) {
      console.log('❌ Nenhuma leitura encontrada no banco!');
      return;
    }
    
    // Buscar dispositivos
    const devices = await prisma.device.findMany({
      include: {
        _count: {
          select: { readings: true }
        }
      }
    });
    
    console.log(`\n📱 Dispositivos encontrados: ${devices.length}`);
    devices.forEach(device => {
      console.log(`   - ${device.name} (ID: ${device.meterId}): ${device._count.readings} leituras`);
    });
    
    // Verificar leituras mais recentes
    const recentReadings = await prisma.reading.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: {
        id: true,
        timestamp: true,
        meterId: true,
        ept_c: true,
        pt: true
      }
    });
    
    console.log('\n📅 Últimas 5 leituras:');
    recentReadings.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.timestamp.toISOString()} | Medidor ${r.meterId} | ept_c: ${r.ept_c} | pt: ${r.pt}`);
    });
    
    // Verificar leituras mais antigas
    const oldestReadings = await prisma.reading.findMany({
      orderBy: { timestamp: 'asc' },
      take: 5,
      select: {
        id: true,
        timestamp: true,
        meterId: true,
        ept_c: true,
        pt: true
      }
    });
    
    console.log('\n📅 Primeiras 5 leituras:');
    oldestReadings.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.timestamp.toISOString()} | Medidor ${r.meterId} | ept_c: ${r.ept_c} | pt: ${r.pt}`);
    });
    
    // Calcular intervalo de tempo
    if (oldestReadings.length > 0 && recentReadings.length > 0) {
      const timeSpan = recentReadings[0].timestamp.getTime() - oldestReadings[0].timestamp.getTime();
      const hours = timeSpan / (1000 * 60 * 60);
      const days = hours / 24;
      console.log(`\n⏱️  Intervalo de dados: ${hours.toFixed(2)} horas (${days.toFixed(2)} dias)`);
    }
    
    // Verificar valores únicos de ept_c
    const allReadings = await prisma.reading.findMany({
      select: { ept_c: true }
    });
    const uniqueEptC = [...new Set(allReadings.map(r => r.ept_c))];
    console.log(`\n🔢 Valores únicos de ept_c: ${uniqueEptC.length} de ${allReadings.length}`);
    
    if (uniqueEptC.length === 1) {
      console.log(`⚠️  PROBLEMA: Todos os valores de ept_c são iguais (${uniqueEptC[0]})!`);
      console.log('   Isso significa que não há histórico de consumo, apenas valores acumulados constantes.');
    } else {
      const sortedEptC = uniqueEptC.sort((a, b) => a - b);
      console.log(`   Primeiro valor: ${sortedEptC[0]}`);
      console.log(`   Último valor: ${sortedEptC[sortedEptC.length - 1]}`);
      console.log(`   Diferença: ${sortedEptC[sortedEptC.length - 1] - sortedEptC[0]}`);
    }
    
    // Verificar leituras por período
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const readings1h = await prisma.reading.count({
      where: {
        timestamp: {
          gte: oneHourAgo,
          lte: now
        }
      }
    });
    
    const readings24h = await prisma.reading.count({
      where: {
        timestamp: {
          gte: oneDayAgo,
          lte: now
        }
      }
    });
    
    const readings7d = await prisma.reading.count({
      where: {
        timestamp: {
          gte: sevenDaysAgo,
          lte: now
        }
      }
    });
    
    console.log(`\n📈 Leituras por período:`);
    console.log(`   Última 1h: ${readings1h}`);
    console.log(`   Últimas 24h: ${readings24h}`);
    console.log(`   Últimos 7 dias: ${readings7d}`);
    
    // Verificar se há variação de ept_c por período
    if (readings24h > 0) {
      const readings24hData = await prisma.reading.findMany({
        where: {
          timestamp: {
            gte: oneDayAgo,
            lte: now
          }
        },
        orderBy: { timestamp: 'asc' },
        select: {
          timestamp: true,
          ept_c: true,
          meterId: true
        }
      });
      
      if (readings24hData.length > 0) {
        const firstEptC = readings24hData[0].ept_c;
        const lastEptC = readings24hData[readings24hData.length - 1].ept_c;
        const diff24h = lastEptC - firstEptC;
        
        console.log(`\n📊 Análise das últimas 24h:`);
        console.log(`   Primeiro ept_c: ${firstEptC}`);
        console.log(`   Último ept_c: ${lastEptC}`);
        console.log(`   Diferença (consumo): ${diff24h.toFixed(2)} kWh`);
        
        if (diff24h === 0) {
          console.log(`   ⚠️  PROBLEMA: Não há variação de consumo nas últimas 24h!`);
        }
      }
    }
    
    // Verificar por dispositivo
    console.log(`\n📱 Análise por dispositivo:`);
    for (const device of devices) {
      if (device._count.readings === 0) continue;
      
      const deviceReadings = await prisma.reading.findMany({
        where: { meterId: device.meterId },
        orderBy: { timestamp: 'asc' },
        select: {
          timestamp: true,
          ept_c: true,
          pt: true
        }
      });
      
      if (deviceReadings.length > 0) {
        const first = deviceReadings[0];
        const last = deviceReadings[deviceReadings.length - 1];
        const totalConsumption = last.ept_c - first.ept_c;
        const timeSpan = last.timestamp.getTime() - first.timestamp.getTime();
        const hours = timeSpan / (1000 * 60 * 60);
        
        console.log(`\n   ${device.name} (ID: ${device.meterId}):`);
        console.log(`      Total de leituras: ${deviceReadings.length}`);
        console.log(`      Primeira leitura: ${first.timestamp.toISOString()} - ept_c: ${first.ept_c}`);
        console.log(`      Última leitura: ${last.timestamp.toISOString()} - ept_c: ${last.ept_c}`);
        console.log(`      Consumo total: ${totalConsumption.toFixed(2)} kWh`);
        console.log(`      Período: ${hours.toFixed(2)} horas`);
        
        if (totalConsumption === 0) {
          console.log(`      ⚠️  PROBLEMA: Não há variação de consumo para este dispositivo!`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkReadings();


