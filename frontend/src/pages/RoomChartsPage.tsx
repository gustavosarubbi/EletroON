import React, { useState, useEffect, useMemo } from 'react';
import LoginParticles from '../components/ui/LoginParticles';
import Sidebar from '../components/dashboard/Sidebar';
import Chart from '../components/dashboard/Chart';
import { dashboardService } from '../services/dashboardService';
import { Device, Reading } from '../types/dashboard';
import {
  Zap,
  TrendingUp,
  Calendar,
  Clock,
  Wifi,
  WifiOff,
  Gauge,
  Database,
  AlertCircle,
  Loader2,
  Maximize2,
  Minimize2,
  Download,
  CheckSquare,
  Square,
  Building2,
  LayoutDashboard,
  ChevronRight,
  FileText,
  FileJson,
  Search,
  X
} from 'lucide-react';
import '../styles/components/RoomCharts.css';
import '../styles/components/Dashboard.css';
import DateTimePicker from '../components/ui/DateTimePicker';

interface MetricConfig {
  key: string;
  label: string;
  keys: string[];
  colors: string[];
  unit: string;
  icon: any;
}

interface AggregatedData {
  timestamp: string;
  [key: string]: number | string;
}

const RoomChartsPage: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  // Estados principais
  const [devices, setDevices] = useState<Device[]>([]);
  const [allRooms, setAllRooms] = useState<string[]>([]); // Todas as salas do sistema
  const [selectedRoom, setSelectedRoom] = useState<string>(''); // Nome da sala selecionada
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [aggregatedReadings, setAggregatedReadings] = useState<AggregatedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Busca de salas
  const [roomSearchTerm, setRoomSearchTerm] = useState<string>('');
  
  // Busca de medidores
  const [meterSearchTerm, setMeterSearchTerm] = useState<string>('');
  
  // Filtro de status dos medidores
  const [meterStatusFilter, setMeterStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  
  // Ver todas as salas
  const [showAllRooms, setShowAllRooms] = useState<boolean>(false);
  
  // Filtros de tempo
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | 'custom'>('24h');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // Visualização
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [selectedMetrics] = useState<string[]>(['pt', 'gasto_total', 'import_consumption', 'generation_total']);

  // Configurações de métricas
  const metricsConfig: MetricConfig[] = [
    {
      key: 'pt',
      label: 'Potência Total',
      keys: ['pt', 'pa', 'pb', 'pc'],
      colors: ['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.6)', 'rgba(34, 197, 94, 0.6)', 'rgba(251, 191, 36, 0.6)'],
      unit: 'kW',
      icon: Zap
    },
    {
      key: 'gasto_total',
      label: 'Consumo Líquido',
      keys: ['gasto_total'],
      colors: ['rgba(59, 130, 246, 0.8)'],
      unit: 'kWh',
      icon: TrendingUp
    },
    {
      key: 'import_consumption',
      label: 'Consumo da Rede',
      keys: ['import_consumption'],
      colors: ['rgba(34, 197, 94, 0.8)'],
      unit: 'kWh',
      icon: Database
    },
    {
      key: 'generation_total',
      label: 'Geração Própria',
      keys: ['generation_total'],
      colors: ['rgba(249, 115, 22, 0.85)'],
      unit: 'kWh',
      icon: Zap
    },
    {
      key: 'ept_c',
      label: 'Total Acumulado',
      keys: ['ept_c', 'epa_c', 'epb_c', 'epc_c'],
      colors: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.6)', 'rgba(34, 197, 94, 0.6)', 'rgba(251, 191, 36, 0.6)'],
      unit: 'kWh',
      icon: Database
    },
    {
      key: 'iarms',
      label: 'Corrente RMS',
      keys: ['iarms', 'ibrms', 'icrms'],
      colors: ['rgba(251, 191, 36, 0.8)', 'rgba(239, 68, 68, 0.6)', 'rgba(34, 197, 94, 0.6)'],
      unit: 'A',
      icon: Gauge
    },
    {
      key: 'uarms',
      label: 'Tensão RMS',
      keys: ['uarms', 'ubrms', 'ucrms'],
      colors: ['rgba(236, 72, 153, 0.8)', 'rgba(239, 68, 68, 0.6)', 'rgba(34, 197, 94, 0.6)'],
      unit: 'V',
      icon: Gauge
    },
    {
      key: 'pft',
      label: 'Fator de Potência',
      keys: ['pft', 'pfa', 'pfb', 'pfc'],
      colors: ['rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.6)', 'rgba(34, 197, 94, 0.6)', 'rgba(251, 191, 36, 0.6)'],
      unit: '',
      icon: TrendingUp
    }
  ];

  // Agrupar dispositivos por sala do usuário
  // A sala vem do usuário associado ao medidor (device.user), não do location do device
  const roomsMap = useMemo(() => {
    const map = new Map<string, Device[]>();
    devices.forEach(device => {
      // A sala é definida pelo usuário associado ao medidor
      // Se o medidor está associado a um usuário com sala, usar a primeira sala do array
      // Caso contrário, pular (medidores sem usuário ou usuários sem sala não aparecem)
      if (!device.user || !device.user.rooms || device.user.rooms.length === 0) {
        return; // Medidores sem usuário ou usuários sem sala não são exibidos
      }
      
      // Pegar a primeira sala do array de salas
      const room = device.user.rooms[0];
      
      if (!map.has(room)) {
        map.set(room, []);
      }
      map.get(room)!.push(device);
    });
    return map;
  }, [devices]);

  // Lista de salas: usar todas as salas do sistema, não apenas as que têm dispositivos
  const roomsList = useMemo(() => {
    // Combinar salas do sistema com salas que têm dispositivos
    const roomsWithDevices = Array.from(roomsMap.keys());
    const allRoomsSet = new Set([...allRooms, ...roomsWithDevices]);
    return Array.from(allRoomsSet).sort();
  }, [roomsMap, allRooms]);

  // Filtrar salas baseado no termo de busca
  const filteredRoomsList = useMemo(() => {
    if (!roomSearchTerm.trim()) {
      return roomsList;
    }
    const searchLower = roomSearchTerm.toLowerCase().trim();
    return roomsList.filter(room => 
      room.toLowerCase().includes(searchLower)
    );
  }, [roomsList, roomSearchTerm]);

  const devicesByRoom = useMemo(() => {
    // Se mostrar todas as salas, retornar todos os dispositivos
    if (showAllRooms) {
      return Array.from(roomsMap.values()).flat();
    }
    // Se há uma sala selecionada, retornar dispositivos da sala
    if (selectedRoom) {
      return roomsMap.get(selectedRoom) || [];
    }
    // Se não há sala selecionada, mostrar TODOS os medidores
    return devices;
  }, [selectedRoom, roomsMap, showAllRooms, devices]);

  // Filtrar medidores baseado no termo de busca e status
  const filteredDevicesByRoom = useMemo(() => {
    let filtered = devicesByRoom;
    
    // Filtro por status
    if (meterStatusFilter !== 'all') {
      filtered = filtered.filter(device => 
        meterStatusFilter === 'online' 
          ? device.status === 'ONLINE' 
          : device.status === 'OFFLINE'
      );
    }
    
    // Filtro por busca
    if (meterSearchTerm.trim()) {
      const searchLower = meterSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(device => 
        device.name.toLowerCase().includes(searchLower) ||
        device.meterId.toString().includes(searchLower) ||
        (device.location && device.location.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }, [devicesByRoom, meterSearchTerm, meterStatusFilter]);

  // Carregar salas e dispositivos
  useEffect(() => {
    loadRooms();
    loadDevices();
  }, []);

  const loadRooms = async () => {
    try {
      const roomsData = await dashboardService.getRooms();
      const roomNames = roomsData.map(room => room.name);
      setAllRooms(roomNames);
    } catch (err: any) {
      console.error('Erro ao carregar salas:', err);
      // Não definir erro aqui para não bloquear a página se houver problema ao buscar salas
    }
  };

  // Não selecionar sala por padrão - deixar o usuário escolher

  // Atualizar medidores selecionados quando mudar a sala ou mostrar todas
  useEffect(() => {
    if (showAllRooms) {
      // Se mostrar todas as salas, selecionar todos os dispositivos
      const allDevices = Array.from(roomsMap.values()).flat();
      if (allDevices.length > 0) {
        setSelectedDeviceIds(allDevices.map(d => d.meterId));
      } else {
        setSelectedDeviceIds([]);
      }
    } else if (selectedRoom) {
      // Se há sala selecionada, selecionar todos os medidores da sala
      const roomDevices = roomsMap.get(selectedRoom) || [];
      if (roomDevices.length > 0) {
        setSelectedDeviceIds(roomDevices.map(d => d.meterId));
      } else {
        setSelectedDeviceIds([]);
      }
    }
    // Se não há sala selecionada, não alterar a seleção de medidores
    // Deixar o usuário escolher manualmente
  }, [selectedRoom, roomsMap, showAllRooms]);

  // Carregar leituras quando dispositivos ou período mudarem
  useEffect(() => {
    if (selectedDeviceIds.length > 0) {
      loadReadings();
    } else {
      setReadings([]);
      setAggregatedReadings([]);
    }
  }, [selectedDeviceIds, timeRange, customStartDate, customEndDate]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const devicesData = await dashboardService.getDevices();
      setDevices(devicesData);
    } catch (err: any) {
      console.error('Erro ao carregar dispositivos:', err);
      
      // Mensagem de erro mais específica
      if (err?.message) {
        setError(err.message);
      } else if (err?.response?.status === 401) {
        setError('Sessão expirada. Por favor, faça login novamente.');
      } else if (err?.response?.status === 404) {
        setError('Endpoint não encontrado. Verifique se o backend está configurado corretamente.');
      } else if (err?.request) {
        setError('Não foi possível conectar à API. Verifique se o backend está rodando e acessível.');
      } else {
        setError('Erro ao carregar dispositivos. Verifique a conexão com a API.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReadings = async () => {
    if (selectedDeviceIds.length === 0) return;

    try {
      setLoadingReadings(true);
      setError(null);

      let endDate = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case '1h':
          startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
          }
          break;
      }

      const readingsData = await dashboardService.getMultipleDevicesReadingsByPeriod(
        selectedDeviceIds,
        startDate,
        endDate,
        2000
      );

      // Debug: Log dos dados recebidos
      console.log('🔍 DEBUG - Carregamento de dados:');
      console.log('  Período selecionado:', timeRange);
      console.log('  Data início:', startDate.toISOString());
      console.log('  Data fim:', endDate.toISOString());
      console.log('  Dispositivos selecionados:', selectedDeviceIds);
      console.log('  Total de leituras retornadas:', readingsData.length);

      if (readingsData.length > 0) {
        console.log('  Primeira leitura:', {
          timestamp: readingsData[0].timestamp,
          ept_c: readingsData[0].ept_c,
          pt: readingsData[0].pt,
          meterId: readingsData[0].meterId
        });
        console.log('  Última leitura:', {
          timestamp: readingsData[readingsData.length - 1].timestamp,
          ept_c: readingsData[readingsData.length - 1].ept_c,
          pt: readingsData[readingsData.length - 1].pt,
          meterId: readingsData[readingsData.length - 1].meterId
        });
        
        // Verificar se há variação nos valores
        const eptCValues = readingsData.map(r => r.ept_c);
        const uniqueEptC = [...new Set(eptCValues)];
        console.log('  Valores únicos de ept_c:', uniqueEptC.length, 'de', readingsData.length);
        console.log('  Primeiro ept_c:', eptCValues[0]);
        console.log('  Último ept_c:', eptCValues[eptCValues.length - 1]);
        console.log('  Diferença:', eptCValues[eptCValues.length - 1] - eptCValues[0]);
        
        // Verificar timestamps
        const timestamps = readingsData.map(r => new Date(r.timestamp));
        const timeSpan = timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime();
        const hours = timeSpan / (1000 * 60 * 60);
        console.log('  Intervalo de tempo (horas):', hours.toFixed(2));
        
        if (hours < 1) {
          console.warn('  ⚠️ ATENÇÃO: Dados têm menos de 1 hora de histórico!');
          console.warn('  Por isso, os valores de 1h e 24h serão iguais.');
        }
      } else {
        console.warn('  ⚠️ Nenhuma leitura encontrada no período!');
      }

      setReadings(readingsData);
      aggregateReadings(readingsData);
    } catch (err) {
      console.error('Erro ao carregar leituras:', err);
      setError('Erro ao carregar dados do gráfico.');
    } finally {
      setLoadingReadings(false);
    }
  };

  const aggregateReadings = (readingsData: Reading[]) => {
    if (readingsData.length === 0) {
      setAggregatedReadings([]);
      return;
    }

    // Agrupar leituras por dispositivo (meterId) primeiro
    const readingsByDevice: { [meterId: number]: Reading[] } = {};
    readingsData.forEach(reading => {
      if (!readingsByDevice[reading.meterId]) {
        readingsByDevice[reading.meterId] = [];
      }
      readingsByDevice[reading.meterId].push(reading);
    });

    // Ordenar leituras de cada dispositivo por timestamp
    Object.keys(readingsByDevice).forEach(meterId => {
      readingsByDevice[Number(meterId)].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });

    // Agrupar por timestamp para agregação final
    const groupedByTimestamp: { [key: string]: Reading[] } = {};
    readingsData.forEach(reading => {
      const timestamp = new Date(reading.timestamp).toISOString();
      if (!groupedByTimestamp[timestamp]) {
        groupedByTimestamp[timestamp] = [];
      }
      groupedByTimestamp[timestamp].push(reading);
    });

    // Calcular o primeiro valor de ept_c para cada dispositivo (valor base do período)
    const firstEptCByDevice: { [meterId: number]: number } = {};
    const firstEptGByDevice: { [meterId: number]: number } = {};
    Object.keys(readingsByDevice).forEach(meterId => {
      const deviceReadings = readingsByDevice[Number(meterId)];
      if (deviceReadings.length > 0) {
        // Pegar o primeiro valor de ept_c deste dispositivo no período
        firstEptCByDevice[Number(meterId)] = deviceReadings[0].ept_c ?? 0;
        firstEptGByDevice[Number(meterId)] = deviceReadings[0].ept_g ?? 0;
      }
    });

    // Campos que nunca devem ser negativos
    const nonNegativeFields = [
      'epa_c', 'epb_c', 'epc_c', 'ept_c',
      'epa_g', 'epb_g', 'epc_g', 'ept_g',
      'iarms', 'ibrms', 'icrms',
      'uarms', 'ubrms', 'ucrms',
      'import_consumption', 'generation_total'
    ];

    // Criar um mapa de última leitura conhecida por dispositivo até cada timestamp
    const timestamps = Object.keys(groupedByTimestamp).sort();
    const lastReadingByDeviceUntilTimestamp: { [timestamp: string]: { [meterId: number]: Reading } } = {};
    
    // Para cada timestamp, encontrar a última leitura conhecida de cada dispositivo
    timestamps.forEach((timestamp) => {
      const currentTime = new Date(timestamp).getTime();
      lastReadingByDeviceUntilTimestamp[timestamp] = {};
      
      Object.keys(readingsByDevice).forEach(meterIdStr => {
        const meterId = Number(meterIdStr);
        const deviceReadings = readingsByDevice[meterId];
        
        // Encontrar a última leitura deste dispositivo até este timestamp (inclusive)
        let lastReading: Reading | null = null;
        for (const reading of deviceReadings) {
          const readingTime = new Date(reading.timestamp).getTime();
          if (readingTime <= currentTime) {
            lastReading = reading;
          } else {
            break;
          }
        }
        
        if (lastReading) {
          lastReadingByDeviceUntilTimestamp[timestamp][meterId] = lastReading;
        }
      });
    });

    const aggregated: AggregatedData[] = timestamps.map((timestamp, timestampIndex) => {
      const readingsAtTime = groupedByTimestamp[timestamp];
      const aggregated: AggregatedData = { timestamp };
      const lastReadingsMap = lastReadingByDeviceUntilTimestamp[timestamp];
      
      const energyTotals = (() => {
        if (timestampIndex === 0) {
          return {
            import: 0,
            generation: 0,
            net: 0,
          };
        }

        let totalImport = 0;
        let totalGeneration = 0;

        Object.keys(lastReadingsMap).forEach(meterIdStr => {
          const meterId = Number(meterIdStr);
          const lastReading = lastReadingsMap[meterId];
          const firstImport = firstEptCByDevice[meterId];
          const firstGeneration = firstEptGByDevice[meterId] ?? 0;

          if (firstImport === undefined || !lastReading) {
            return;
          }

          const currentImport = lastReading.ept_c ?? firstImport;
          const currentGeneration = lastReading.ept_g ?? firstGeneration;

          let importDelta = currentImport - firstImport;
          let generationDelta = currentGeneration - firstGeneration;

          const hasGenerationEvidence =
            generationDelta > 0 || (lastReading.pt ?? 0) < 0;

          const importReset =
            firstImport > 0 &&
            currentImport >= 0 &&
            currentImport < firstImport * 0.1;

          const generationReset =
            firstGeneration > 0 &&
            currentGeneration >= 0 &&
            currentGeneration < firstGeneration * 0.1;

          if (importDelta < 0) {
            if (importReset && !hasGenerationEvidence) {
              importDelta = 0;
            } else if (!hasGenerationEvidence) {
              importDelta = 0;
            } else {
              importDelta = 0;
            }
          }

          if (generationDelta < 0) {
            if (generationReset) {
              generationDelta = 0;
            } else {
              generationDelta = 0;
            }
          }

          totalImport += Math.max(0, importDelta);
          totalGeneration += Math.max(0, generationDelta);
        });

        return {
          import: totalImport,
          generation: totalGeneration,
          net: totalImport - totalGeneration,
        };
      })();

      aggregated['gasto_total'] = energyTotals.net;
      aggregated['import_consumption'] = energyTotals.import;
      aggregated['generation_total'] = energyTotals.generation;

      metricsConfig.forEach(metric => {
        if (['gasto_total', 'import_consumption', 'generation_total'].includes(metric.key)) {
          return;
        }

        metric.keys.forEach(key => {
          const actualKey = key;

          const sum = readingsAtTime.reduce((acc, r) => {
            const value = (r as any)[actualKey] || 0;
            if ((nonNegativeFields.includes(key) || nonNegativeFields.includes(actualKey)) && value < 0) {
              console.warn(`Valor negativo detectado para ${key}: ${value}. Corrigindo para 0.`);
              return acc + 0;
            }
            return acc + value;
          }, 0);

          aggregated[key] =
            nonNegativeFields.includes(key) || nonNegativeFields.includes(actualKey)
              ? Math.max(0, sum)
              : sum;
        });
      });

      return aggregated;
    });

    setAggregatedReadings(aggregated);
  };

  const handleDeviceToggle = (meterId: number) => {
    setSelectedDeviceIds(prev => {
      if (prev.includes(meterId)) {
        return prev.filter(id => id !== meterId);
      } else {
        return [...prev, meterId];
      }
    });
  };

  const handleSelectAllDevices = () => {
    if (selectedDeviceIds.length === filteredDevicesByRoom.length && filteredDevicesByRoom.length > 0) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(filteredDevicesByRoom.map(d => d.meterId));
    }
  };

  const handleToggleShowAllRooms = () => {
    setShowAllRooms(!showAllRooms);
    if (!showAllRooms) {
      // Ao ativar "todas as salas", limpar seleção de sala
      setSelectedRoom('');
    }
    // Não limpar busca de medidores para manter a experiência do usuário
  };

  const handleExportReport = async (format: 'csv' | 'json' = 'csv') => {
    if (selectedDeviceIds.length === 0) {
      setError('Selecione pelo menos um dispositivo para exportar.');
      return;
    }

    try {
      setExporting(true);
      setError(null);

      let endDate = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case '1h':
          startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
          }
          break;
      }

      const blob = await dashboardService.exportReport(
        selectedDeviceIds,
        startDate,
        endDate,
        format
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_energia_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erro ao exportar relatório:', err);
      setError('Erro ao exportar relatório.');
    } finally {
      setExporting(false);
    }
  };

  const formatDateShort = (date: Date | string | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const prepareChartData = (metric: MetricConfig) => {
    const dataSource = selectedDeviceIds.length > 1 ? aggregatedReadings : readings;
    
    if (!dataSource || dataSource.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Campos que nunca devem ser negativos
    const nonNegativeFields = [
      'epa_c', 'epb_c', 'epc_c', 'ept_c',
      'epa_g', 'epb_g', 'epc_g', 'ept_g',
      'iarms', 'ibrms', 'icrms',
      'uarms', 'ubrms', 'ucrms',
      'import_consumption', 'generation_total'
    ];

    const labels = dataSource.map(r => formatDateShort(r.timestamp));
    const datasets = metric.keys.map((key, index) => {
      let data: number[];
      
      // Se a métrica for 'gasto_total', calcular consumo incremental (sempre começando em 0)
      // Nota: metric.key é 'gasto_total', mas metric.keys é ['ept_c'], então verificamos metric.key
      if (metric.key === 'gasto_total') {
        if (dataSource.length === 0) {
          data = [];
        } else if (selectedDeviceIds.length > 1) {
          data = dataSource.map((r, idx) => (idx === 0 ? 0 : ((r as any).gasto_total ?? 0)));
        } else {
          const firstImport = Number(dataSource[0]?.ept_c ?? 0);
          const firstGeneration = Number(dataSource[0]?.ept_g ?? 0);

          data = dataSource.map((r, idx) => {
            if (idx === 0) return 0;

            const currentImport = Number(r.ept_c ?? firstImport);
            const currentGeneration = Number(r.ept_g ?? firstGeneration);
            let importDelta = currentImport - firstImport;
            let generationDelta = currentGeneration - firstGeneration;

            const hasGenerationEvidence =
              generationDelta > 0 || (Number(r.pt ?? 0)) < 0;

            const importReset =
              firstImport > 0 &&
              currentImport >= 0 &&
              currentImport < firstImport * 0.1;

            const generationReset =
              firstGeneration > 0 &&
              currentGeneration >= 0 &&
              currentGeneration < firstGeneration * 0.1;

            if (importDelta < 0 && (!hasGenerationEvidence || importReset)) {
              importDelta = 0;
            }

            if (generationDelta < 0 && generationReset) {
              generationDelta = 0;
            }

            importDelta = Math.max(0, importDelta);
            generationDelta = Math.max(0, generationDelta);

            return importDelta - generationDelta;
          });
        }
      } else if (metric.key === 'import_consumption') {
        if (dataSource.length === 0) {
          data = [];
        } else if (selectedDeviceIds.length > 1) {
          data = dataSource.map((r, idx) => (idx === 0 ? 0 : Math.max(0, (r as any).import_consumption ?? 0)));
        } else {
          const firstImport = Number(dataSource[0]?.ept_c ?? 0);

          data = dataSource.map((r, idx) => {
            if (idx === 0) return 0;

            const currentImport = Number(r.ept_c ?? firstImport);
            let importDelta = currentImport - firstImport;

            const importReset =
              firstImport > 0 &&
              currentImport >= 0 &&
              currentImport < firstImport * 0.1;

            if (importDelta < 0 && importReset) {
              importDelta = 0;
            }

            return Math.max(0, importDelta);
          });
        }
      } else if (metric.key === 'generation_total') {
        if (dataSource.length === 0) {
          data = [];
        } else if (selectedDeviceIds.length > 1) {
          data = dataSource.map((r, idx) => (idx === 0 ? 0 : Math.max(0, (r as any).generation_total ?? 0)));
        } else {
          const firstGeneration = Number(dataSource[0]?.ept_g ?? 0);

          data = dataSource.map((r, idx) => {
            if (idx === 0) return 0;

            const currentGeneration = Number(r.ept_g ?? firstGeneration);
            let generationDelta = currentGeneration - firstGeneration;

            const generationReset =
              firstGeneration > 0 &&
              currentGeneration >= 0 &&
              currentGeneration < firstGeneration * 0.1;

            if (generationDelta < 0 && generationReset) {
              generationDelta = 0;
            }

            return Math.max(0, generationDelta);
          });
        }
      } else {
        // Para outras métricas, usar valores diretos
        const actualKey = key;
        data = dataSource.map(r => {
          const value = (r as any)[actualKey] || 0;
          // Garantir que valores de energia, corrente e tensão nunca sejam negativos
          if (nonNegativeFields.includes(key) || nonNegativeFields.includes(actualKey)) {
            const correctedValue = Math.max(0, value);
            if (value < 0) {
              console.warn(`Valor negativo corrigido no gráfico para ${key}: ${value} -> ${correctedValue}`);
            }
            return correctedValue;
          }
          return value;
        });
      }
      
      // Usar o label da métrica se for 'gasto_total', senão usar o nome do campo
      const label = metric.key === 'gasto_total' 
        ? metric.label
        : selectedDeviceIds.length > 1 
          ? `${key.toUpperCase()}` 
          : metric.keys.length > 1 
            ? key.toUpperCase() 
            : metric.label;

      return {
        label,
        data,
        borderColor: metric.colors[index] || metric.colors[0],
        backgroundColor: metric.colors[index]?.replace('0.8', '0.1') || metric.colors[0],
        fill: index === 0,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 4
      };
    });

    return { labels, datasets };
  };

  const getCurrentValue = (key: string, metricKey?: string): number => {
    const dataSource = selectedDeviceIds.length > 1 ? aggregatedReadings : readings;
    if (!dataSource || dataSource.length === 0) return 0;
    
    // Consumo líquido agregado
    if (metricKey === 'gasto_total' || key === 'gasto_total') {
      if (selectedDeviceIds.length > 1) {
        const lastReading = aggregatedReadings[aggregatedReadings.length - 1];
        return (lastReading as any)?.gasto_total ?? 0;
      }

      if (readings.length < 2) {
        return 0;
      }

      const firstImport = Number(readings[0]?.ept_c ?? 0);
      const firstGeneration = Number(readings[0]?.ept_g ?? 0);
      const lastReading = readings[readings.length - 1];
      const currentImport = Number(lastReading?.ept_c ?? firstImport);
      const currentGeneration = Number(lastReading?.ept_g ?? firstGeneration);

      let importDelta = currentImport - firstImport;
      let generationDelta = currentGeneration - firstGeneration;

      const hasGenerationEvidence =
        generationDelta > 0 || (Number(lastReading?.pt ?? 0)) < 0;

      const importReset =
        firstImport > 0 &&
        currentImport >= 0 &&
        currentImport < firstImport * 0.1;

      const generationReset =
        firstGeneration > 0 &&
        currentGeneration >= 0 &&
        currentGeneration < firstGeneration * 0.1;

      if (importDelta < 0 && (!hasGenerationEvidence || importReset)) {
        importDelta = 0;
      }

      if (generationDelta < 0 && generationReset) {
        generationDelta = 0;
      }

      importDelta = Math.max(0, importDelta);
      generationDelta = Math.max(0, generationDelta);

      return importDelta - generationDelta;
    }

    if (metricKey === 'import_consumption' || key === 'import_consumption') {
      if (selectedDeviceIds.length > 1) {
        const lastReading = aggregatedReadings[aggregatedReadings.length - 1];
        return Math.max(0, (lastReading as any)?.import_consumption ?? 0);
      }

      if (readings.length < 2) {
        return 0;
      }

      const firstImport = Number(readings[0]?.ept_c ?? 0);
      const lastReading = readings[readings.length - 1];
      const currentImport = Number(lastReading?.ept_c ?? firstImport);

      let importDelta = currentImport - firstImport;
      const importReset =
        firstImport > 0 &&
        currentImport >= 0 &&
        currentImport < firstImport * 0.1;

      if (importDelta < 0 && importReset) {
        importDelta = 0;
      }

      return Math.max(0, importDelta);
    }

    if (metricKey === 'generation_total' || key === 'generation_total') {
      if (selectedDeviceIds.length > 1) {
        const lastReading = aggregatedReadings[aggregatedReadings.length - 1];
        return Math.max(0, (lastReading as any)?.generation_total ?? 0);
      }

      if (readings.length < 2) {
        return 0;
      }

      const firstGeneration = Number(readings[0]?.ept_g ?? 0);
      const lastReading = readings[readings.length - 1];
      const currentGeneration = Number(lastReading?.ept_g ?? firstGeneration);

      let generationDelta = currentGeneration - firstGeneration;
      const generationReset =
        firstGeneration > 0 &&
        currentGeneration >= 0 &&
        currentGeneration < firstGeneration * 0.1;

      if (generationDelta < 0 && generationReset) {
        generationDelta = 0;
      }

      return Math.max(0, generationDelta);
    }
    
    // Para outras métricas, usar o valor atual
    const lastReading = dataSource[dataSource.length - 1];
    const actualKey = key;
    const value = (lastReading as any)[actualKey] || 0;
    
    // Campos que nunca devem ser negativos
    const nonNegativeFields = [
      'epa_c', 'epb_c', 'epc_c', 'ept_c',
      'epa_g', 'epb_g', 'epc_g', 'ept_g',
      'iarms', 'ibrms', 'icrms',
      'uarms', 'ubrms', 'ucrms'
    ];
    
    // Garantir que valores de energia, corrente e tensão nunca sejam negativos
    if (nonNegativeFields.includes(key) || nonNegativeFields.includes(actualKey)) {
      return Math.max(0, value);
    }
    
    return value;
  };

  const getStatCard = (metric: MetricConfig) => {
    const value = getCurrentValue(metric.keys[0], metric.key);
    const Icon = metric.icon;
    
    return (
      <div className="room-stat-card" key={metric.key}>
        <div className="stat-card-icon">
          <Icon size={24} />
        </div>
        <div className="stat-card-content">
          <div className="stat-card-label">
            {metric.label}
          </div>
          <div className="stat-card-value">
            {value.toFixed(2)} <span className="stat-card-unit">{metric.unit}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderChart = (metric: MetricConfig) => {
    const chartData = prepareChartData(metric);
    const isExpanded = expandedChart === metric.key;
    const Icon = metric.icon;

    return (
      <div 
        key={metric.key}
        className={`room-chart-card ${isExpanded ? 'expanded' : ''}`}
      >
        <div className="chart-card-header">
          <div className="chart-card-title">
            <Icon size={20} />
            <h3>
              {metric.label}
            </h3>
          </div>
          <div className="chart-card-actions">
            <button
              className="chart-action-btn"
              onClick={() => setExpandedChart(isExpanded ? null : metric.key)}
              title={isExpanded ? 'Minimizar' : 'Expandir'}
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>
        
        <div className="chart-card-body">
          {loadingReadings ? (
            <div className="chart-loading">
              <Loader2 className="spinner" size={32} />
              <p>Carregando dados...</p>
            </div>
          ) : (selectedDeviceIds.length > 1 ? aggregatedReadings : readings).length === 0 ? (
            <div className="chart-empty">
              <AlertCircle size={48} />
              <p>Nenhum dado disponível para este período</p>
            </div>
          ) : (
            <Chart
              data={chartData}
              title=""
              height={isExpanded ? 450 : 300}
              type="line"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-page-container">
      {/* Partículas animadas de fundo */}
      <LoginParticles />

      {/* Botão de Menu - Visível apenas quando sidebar está fechado */}
      {!sidebarVisible && (
        <button 
          className="dashboard-menu-toggle"
          onClick={() => setSidebarVisible(!sidebarVisible)}
          title="Abrir menu"
          aria-label="Toggle sidebar"
        >
          <svg width="56" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="0" width="24" height="6" rx="3" fill="white"/>
            <rect y="10" width="24" height="6" rx="3" fill="white"/>
            <rect y="20" width="24" height="6" rx="3" fill="white"/>
          </svg>
        </button>
      )}
      
      {/* Título com Breadcrumb */}
      <div className="dashboard-title-section">
        <div className="dashboard-title-header">
          <div className="dashboard-breadcrumb">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
            <ChevronRight size={18} />
            <span className="breadcrumb-active">Gráficos das Salas</span>
          </div>
        </div>
        <h1 className="dashboard-main-title">Gráficos das Salas</h1>
        <p className="dashboard-subtitle">Visualize métricas detalhadas de consumo e desempenho energético</p>
      </div>

      {/* Sidebar */}
      <Sidebar 
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      {/* Main Content */}
      <div className="dashboard-page-content">
        {/* Controles Principais - Reorganizados com melhor UX */}
        <div className="room-controls-container">
          {/* Seção: Seleção de Salas e Medidores - Redesenhada */}
          <div className="controls-section selection-section">
            <h2 className="section-title-enhanced">
              <Building2 size={20} />
              Salas e Medidores
            </h2>
            
            {/* Container Principal com Layout em Duas Colunas */}
            <div className="room-selection-container">
              {/* Painel de Salas */}
              <div className="rooms-panel">
                <div className="rooms-panel-header">
                  <h3 className="panel-title">
                    <Building2 size={18} />
                    Selecionar Sala
                  </h3>
                  <div className="rooms-count-badge">
                    {roomsList.length} sala{roomsList.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {/* Opção Ver Todas as Salas */}
                {roomsList.length > 0 && (
                  <div className="rooms-view-all-wrapper">
                    <button
                      className={`rooms-view-all-btn ${showAllRooms ? 'active' : ''}`}
                      onClick={handleToggleShowAllRooms}
                      disabled={loading}
                      type="button"
                    >
                      <Database size={16} />
                      <span>Ver Todas as Salas</span>
                      {showAllRooms && (
                        <CheckSquare size={16} />
                      )}
                    </button>
                  </div>
                )}
                
                {/* Barra de Busca de Salas - Sempre Visível */}
                <div className="rooms-search-wrapper">
                  <div className="rooms-search-input-wrapper">
                    <Search size={16} className="rooms-search-icon" />
                    <input
                      type="text"
                      className="rooms-search-input"
                      placeholder={roomsList.length > 0 ? (roomsList.length > 5 ? "Buscar sala..." : "Filtrar salas...") : "Buscar sala..."}
                      value={roomSearchTerm}
                      onChange={(e) => setRoomSearchTerm(e.target.value)}
                      disabled={loading}
                    />
                    {roomSearchTerm && (
                      <button
                        className="rooms-search-clear"
                        onClick={() => setRoomSearchTerm('')}
                        type="button"
                        title="Limpar busca"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {roomSearchTerm && (
                    <div className="rooms-search-results">
                      {filteredRoomsList.length > 0 ? (
                        <span className="rooms-search-results-text">
                          {filteredRoomsList.length} sala{filteredRoomsList.length !== 1 ? 's' : ''} encontrada{filteredRoomsList.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="rooms-search-results-text no-results">
                          Nenhuma sala encontrada
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="rooms-grid">
                  {/* Cards de Salas - Filtradas pela busca */}
                  {showAllRooms ? (
                    <div className="rooms-all-active">
                      <Database size={32} />
                      <p>Todas as salas selecionadas</p>
                      <small>{devicesByRoom.length} medidor{devicesByRoom.length !== 1 ? 'es' : ''} de todas as salas</small>
                    </div>
                  ) : filteredRoomsList.length > 0 ? (
                    filteredRoomsList.map(room => {
                      const roomDevices = roomsMap.get(room) || [];
                      const isSelected = selectedRoom === room;
                      const selectedCount = roomDevices.filter(d => selectedDeviceIds.includes(d.meterId)).length;
                      
                      return (
                        <button
                          key={room}
                          className={`room-card ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedRoom(room);
                            setShowAllRooms(false);
                          }}
                          disabled={loading}
                        >
                          <div className="room-card-icon">
                            <LayoutDashboard size={24} />
                          </div>
                          <div className="room-card-content">
                            <div className="room-card-name">{room}</div>
                            <div className="room-card-meta">
                              <span className="room-card-devices-count">
                                {roomDevices.length} medidor{roomDevices.length !== 1 ? 'es' : ''}
                              </span>
                              {isSelected && selectedCount > 0 && (
                                <span className="room-card-selected-count">
                                  {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="room-card-check">
                              <CheckSquare size={20} />
                            </div>
                          )}
                        </button>
                      );
                    })
                  ) : roomSearchTerm ? (
                    <div className="rooms-empty-search">
                      <Search size={32} />
                      <p>Nenhuma sala encontrada para "{roomSearchTerm}"</p>
                      <button
                        className="rooms-clear-search-btn"
                        onClick={() => setRoomSearchTerm('')}
                      >
                        Limpar busca
                      </button>
                    </div>
                  ) : (
                    <div className="rooms-empty-search">
                      <Building2 size={32} />
                      <p>Nenhuma sala disponível</p>
                      <small>Associe usuários a medidores para criar salas</small>
                    </div>
                  )}
                </div>
              </div>

              {/* Painel de Medidores */}
              <div className="meters-panel">
                <div className="meters-panel-header">
                  <div className="meters-panel-title-group">
                    <h3 className="panel-title">
                      <Gauge size={18} />
                      {showAllRooms ? 'Todos os Medidores' : selectedRoom ? 'Medidores da Sala' : 'Todos os Medidores'}
                    </h3>
                    {showAllRooms ? (
                      <span className="selected-room-name">Todas as Salas</span>
                    ) : selectedRoom ? (
                      <span className="selected-room-name">{selectedRoom}</span>
                    ) : (
                      <span className="selected-room-name">Nenhuma sala selecionada</span>
                    )}
                  </div>
                  <div className="meters-panel-actions">
                    <button
                      className="meters-select-all-btn"
                      onClick={handleSelectAllDevices}
                      disabled={filteredDevicesByRoom.length === 0 || loading}
                    >
                      {selectedDeviceIds.length === filteredDevicesByRoom.length && filteredDevicesByRoom.length > 0 ? (
                        <>
                          <CheckSquare size={16} />
                          Desmarcar Todos
                        </>
                      ) : (
                        <>
                          <Square size={16} />
                          Selecionar Todos
                        </>
                      )}
                    </button>
                    {selectedDeviceIds.length > 0 && (
                      <div className="meters-selection-badge">
                        {selectedDeviceIds.length} selecionado{selectedDeviceIds.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Barra de Busca e Filtros - Sempre Visível */}
                <div className="meters-filters-section">
                  <div className="meters-search-wrapper">
                    <div className="meters-search-input-wrapper">
                      <Search size={16} className="meters-search-icon" />
                      <input
                        type="text"
                        className="meters-search-input"
                        placeholder="Buscar medidor por nome, ID ou localização..."
                        value={meterSearchTerm}
                        onChange={(e) => setMeterSearchTerm(e.target.value)}
                        disabled={loading}
                      />
                      {meterSearchTerm && (
                        <button
                          className="meters-search-clear"
                          onClick={() => setMeterSearchTerm('')}
                          type="button"
                          title="Limpar busca"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filtros de Status */}
                  <div className="meters-status-filters">
                    <button
                      className={`status-filter-btn ${meterStatusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setMeterStatusFilter('all')}
                      type="button"
                    >
                      <Database size={14} />
                      Todos
                    </button>
                    <button
                      className={`status-filter-btn online ${meterStatusFilter === 'online' ? 'active' : ''}`}
                      onClick={() => setMeterStatusFilter('online')}
                      type="button"
                    >
                      <Wifi size={14} />
                      Online
                    </button>
                    <button
                      className={`status-filter-btn offline ${meterStatusFilter === 'offline' ? 'active' : ''}`}
                      onClick={() => setMeterStatusFilter('offline')}
                      type="button"
                    >
                      <WifiOff size={14} />
                      Offline
                    </button>
                  </div>

                  {/* Contador de Resultados */}
                  {devicesByRoom.length > 0 && (
                    <div className="meters-results-count">
                      <span>
                        {filteredDevicesByRoom.length} de {devicesByRoom.length} medidor{devicesByRoom.length !== 1 ? 'es' : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="meters-grid">
                  {filteredDevicesByRoom.length === 0 ? (
                    <div className="meters-empty-state">
                      <Database size={48} />
                      <h4>Nenhum medidor encontrado</h4>
                      <p>
                        {meterSearchTerm
                          ? `Nenhum medidor encontrado para "${meterSearchTerm}".`
                          : showAllRooms
                          ? 'Não há medidores disponíveis.'
                          : selectedRoom 
                          ? `Não há medidores associados à sala "${selectedRoom}".`
                          : 'Nenhum medidor disponível no momento.'}
                      </p>
                      {meterSearchTerm && (
                        <button
                          className="meters-clear-search-btn"
                          onClick={() => setMeterSearchTerm('')}
                        >
                          Limpar busca
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredDevicesByRoom.map(device => {
                      const isSelected = selectedDeviceIds.includes(device.meterId);
                      const isOnline = device.status === 'ONLINE';
                      // Pegar a primeira sala do array de salas do usuário
                      const deviceRoom = device.user?.rooms?.[0] || 'Sem sala';
                      
                      return (
                        <div
                          key={device.meterId}
                          className={`meter-card ${isSelected ? 'selected' : ''} ${!isOnline ? 'offline' : ''}`}
                          onClick={() => handleDeviceToggle(device.meterId)}
                        >
                          <div className="meter-card-checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleDeviceToggle(device.meterId)}
                              disabled={loading}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="meter-card-content">
                            <div className="meter-card-header">
                              <div className="meter-card-name-group">
                                <div className="meter-card-name">{device.name || `Medidor ${device.meterId}`}</div>
                                <span className="meter-card-id">ID: {device.meterId}</span>
                              </div>
                              <div className={`meter-card-status-badge ${isOnline ? 'online' : 'offline'}`}>
                                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                                <span>{device.status}</span>
                              </div>
                            </div>
                            {(showAllRooms || !selectedRoom) && deviceRoom !== 'Sem sala' && (
                              <div className="meter-card-footer">
                                <span className="meter-card-room">
                                  <Building2 size={10} />
                                  {deviceRoom}
                                </span>
                                {device.location && (
                                  <span className="meter-card-location">{device.location}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Período e Exportação */}
          <div className="controls-section filters-section">
            <h2 className="section-title-enhanced">
              <Calendar size={20} />
              Período e Exportação
            </h2>
            
            <div className="controls-grid">
              {/* Card: Período */}
              <div className="control-card period-card">
                <label className="control-card-label">
                  <Clock size={16} />
                  Período de Análise
                </label>
                <div className="period-buttons-row">
                  {(['1h', '24h', '7d', '30d'] as const).map(range => {
                    const icons = {
                      '1h': Clock,
                      '24h': Clock,
                      '7d': Calendar,
                      '30d': Calendar
                    };
                    const Icon = icons[range];
                    return (
                      <button
                        key={range}
                        className={`period-btn ${timeRange === range ? 'active' : ''}`}
                        onClick={() => setTimeRange(range)}
                      >
                        <Icon size={14} />
                        {range === '1h' ? '1 hora' : range === '24h' ? '24 horas' : range === '7d' ? '7 dias' : '30 dias'}
                      </button>
                    );
                  })}
                  <button
                    className={`period-btn custom ${timeRange === 'custom' ? 'active' : ''}`}
                    onClick={() => setTimeRange('custom')}
                  >
                    <Clock size={14} />
                    Personalizado
                  </button>
                </div>
                
                <div className={`period-custom-inputs ${timeRange !== 'custom' ? 'hidden' : ''}`}>
                  <div className="period-custom-wrapper">
                    <DateTimePicker
                      value={customStartDate}
                      onChange={(value) => setCustomStartDate(value)}
                      placeholder="Data inicial"
                    />
                    <div className="period-divider"></div>
                    <DateTimePicker
                      value={customEndDate}
                      onChange={(value) => setCustomEndDate(value)}
                      placeholder="Data final"
                    />
                  </div>
                </div>
              </div>

              {/* Card: Exportação - Compacto */}
              <div className="control-card export-card-compact">
                <label className="control-card-label">
                  <Download size={16} />
                  Exportar Relatório
                </label>
                <div className="export-actions-row">
                  <button
                    className="export-action-btn-compact csv"
                    onClick={() => handleExportReport('csv')}
                    disabled={exporting || selectedDeviceIds.length === 0}
                    title="Exportar como CSV"
                  >
                    <FileText size={16} />
                    {exporting ? 'Exportando...' : 'CSV'}
                  </button>
                  <button
                    className="export-action-btn-compact json"
                    onClick={() => handleExportReport('json')}
                    disabled={exporting || selectedDeviceIds.length === 0}
                    title="Exportar como JSON"
                  >
                    <FileJson size={16} />
                    {exporting ? 'Exportando...' : 'JSON'}
                  </button>
                </div>
                {selectedDeviceIds.length === 0 && (
                  <p className="export-hint">Selecione pelo menos um medidor</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="room-charts-error">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button
              className="error-retry-btn"
              onClick={loadDevices}
              disabled={loading}
              title="Tentar novamente"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="room-charts-loading">
            <Loader2 className="spinner" size={48} />
            <p>Carregando dispositivos...</p>
          </div>
        )}

        {/* Content */}
        {!loading && selectedDeviceIds.length > 0 && (
          <>
            {/* Device Info Card */}
            <div className="device-info-card">
              <div className="device-info-header">
                <div className="device-info-main">
                  <div className="device-selection-summary">
                    <h3>
                      {selectedRoom 
                        ? `${selectedRoom} - ${selectedDeviceIds.length} Medidor${selectedDeviceIds.length > 1 ? 'es' : ''}`
                        : 'Nenhuma sala selecionada'}
                    </h3>
                    <p>
                      {selectedRoom 
                        ? `Medidores da sala: ${selectedDeviceIds.join(', ')}`
                        : 'Selecione uma sala para visualizar os medidores'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="room-stats-grid">
              {metricsConfig
                .filter(metric => selectedMetrics.includes(metric.key))
                .map(metric => getStatCard(metric))}
            </div>

            {/* Charts */}
            <div className="room-charts-grid">
              {metricsConfig
                .filter(metric => selectedMetrics.includes(metric.key))
                .map(metric => renderChart(metric))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && selectedDeviceIds.length === 0 && devices.length > 0 && (
          <div className="room-charts-empty">
            <Database size={64} />
            <h3>Nenhum medidor selecionado</h3>
            <p>Selecione uma sala e escolha os medidores para visualizar os gráficos.</p>
          </div>
        )}

        {!loading && devices.length === 0 && (
          <div className="room-charts-empty">
            <Database size={64} />
            <h3>Nenhum dispositivo encontrado</h3>
            <p>Não há salas ou medidores cadastrados no sistema.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomChartsPage;