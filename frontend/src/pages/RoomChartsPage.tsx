import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginParticles from '../components/ui/LoginParticles';
import Sidebar from '../components/dashboard/Sidebar';
import Chart from '../components/dashboard/Chart';
import { dashboardService } from '../services/dashboardService';
import { Device, Reading } from '../types/dashboard';
import {
  LineChart,
  Zap,
  TrendingUp,
  Calendar,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
  Activity,
  Gauge,
  Database,
  AlertCircle,
  Loader2,
  Maximize2,
  Minimize2,
  Download,
  CheckSquare,
  Square,
  X,
  Building2,
  ChevronDown,
  Filter,
  LayoutDashboard,
  ChevronRight,
  BarChart3
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
  const { user } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  // Estados principais
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('all'); // 'all' ou nome da sala
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [aggregatedReadings, setAggregatedReadings] = useState<AggregatedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros de tempo
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | 'custom'>('24h');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // Visualização
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [selectedMetrics] = useState<string[]>(['pt', 'qt', 'ept_c', 'iarms']);

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
      key: 'qt',
      label: 'Energia Reativa Total',
      keys: ['qt', 'qa', 'qb', 'qc'],
      colors: ['rgba(139, 92, 246, 0.8)', 'rgba(239, 68, 68, 0.6)', 'rgba(34, 197, 94, 0.6)', 'rgba(251, 191, 36, 0.6)'],
      unit: 'kVAR',
      icon: Activity
    },
    {
      key: 'ept_c',
      label: 'Energia Ativa Acumulada',
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

  // Agrupar dispositivos por sala
  const roomsMap = useMemo(() => {
    const map = new Map<string, Device[]>();
    devices.forEach(device => {
      const room = device.location || 'Sem Localização';
      if (!map.has(room)) {
        map.set(room, []);
      }
      map.get(room)!.push(device);
    });
    return map;
  }, [devices]);

  const roomsList = useMemo(() => {
    return Array.from(roomsMap.keys()).sort();
  }, [roomsMap]);

  const devicesByRoom = useMemo(() => {
    if (selectedRoom === 'all') {
      return devices;
    }
    return roomsMap.get(selectedRoom) || [];
  }, [selectedRoom, roomsMap, devices]);

  // Carregar dispositivos
  useEffect(() => {
    loadDevices();
  }, []);

  // Atualizar medidores selecionados quando mudar a sala
  useEffect(() => {
    if (selectedRoom === 'all') {
      // Se selecionar "Todas as Salas", selecionar todos os dispositivos
      if (devices.length > 0) {
        setSelectedDeviceIds(devices.map(d => d.meterId));
      }
    } else {
      // Se selecionar uma sala específica, selecionar todos os medidores daquela sala
      const roomDevices = roomsMap.get(selectedRoom) || [];
      if (roomDevices.length > 0) {
        setSelectedDeviceIds(roomDevices.map(d => d.meterId));
      } else {
        setSelectedDeviceIds([]);
      }
    }
  }, [selectedRoom, devices, roomsMap]);

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
      
      // Selecionar "Todas as Salas" por padrão
      if (devicesData.length > 0) {
        setSelectedRoom('all');
      }
    } catch (err) {
      console.error('Erro ao carregar dispositivos:', err);
      setError('Erro ao carregar dispositivos. Verifique a conexão com a API.');
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
    const groupedByTimestamp: { [key: string]: Reading[] } = {};
    
    readingsData.forEach(reading => {
      const timestamp = new Date(reading.timestamp).toISOString();
      if (!groupedByTimestamp[timestamp]) {
        groupedByTimestamp[timestamp] = [];
      }
      groupedByTimestamp[timestamp].push(reading);
    });

    const aggregated: AggregatedData[] = Object.keys(groupedByTimestamp)
      .sort()
      .map(timestamp => {
        const readingsAtTime = groupedByTimestamp[timestamp];
        const aggregated: AggregatedData = { timestamp };
        
        metricsConfig.forEach(metric => {
          metric.keys.forEach(key => {
            aggregated[key] = readingsAtTime.reduce((sum, r) => {
              return sum + ((r as any)[key] || 0);
            }, 0);
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
    if (selectedDeviceIds.length === devicesByRoom.length) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(devicesByRoom.map(d => d.meterId));
    }
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

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'Nunca';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

    const labels = dataSource.map(r => formatDateShort(r.timestamp));
    const datasets = metric.keys.map((key, index) => {
      const data = dataSource.map(r => (r as any)[key] || 0);
      const label = selectedDeviceIds.length > 1 
        ? `${key.toUpperCase()} (Total)` 
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

  const getCurrentValue = (key: string): number => {
    const dataSource = selectedDeviceIds.length > 1 ? aggregatedReadings : readings;
    if (!dataSource || dataSource.length === 0) return 0;
    const lastReading = dataSource[dataSource.length - 1];
    return (lastReading as any)[key] || 0;
  };

  const getStatCard = (metric: MetricConfig) => {
    const value = getCurrentValue(metric.keys[0]);
    const Icon = metric.icon;
    
    return (
      <div className="room-stat-card" key={metric.key}>
        <div className="stat-card-icon">
          <Icon size={24} />
        </div>
        <div className="stat-card-content">
          <div className="stat-card-label">
            {metric.label} {selectedDeviceIds.length > 1 ? '(Total)' : ''}
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
              {metric.label} {selectedDeviceIds.length > 1 ? '(Total Agregado)' : ''}
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

  const selectedDevices = devices.filter(d => selectedDeviceIds.includes(d.meterId));

  return (
    <div className="room-charts-page-container">
      <LoginParticles />
      
      {/* Botão de Menu */}
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
      
      <Sidebar 
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      <div className="room-charts-content">
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

        {/* Header com Ações */}
        <div className="room-charts-header">
          <div className="header-actions">
            <button
              className="action-btn refresh"
              onClick={loadReadings}
              disabled={loadingReadings || selectedDeviceIds.length === 0}
              title="Atualizar dados"
            >
              <RefreshCw size={18} className={loadingReadings ? 'spinning' : ''} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Toolbar de Seleção */}
        <div className="selection-toolbar">
          {/* Seleção de Sala */}
          <div className="toolbar-section room-selection">
            <label className="toolbar-label">
              <Building2 size={18} />
              Selecionar Sala
            </label>
            <select
              className="room-select"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              disabled={loading}
            >
              <option value="all">Todas as Salas</option>
              {roomsList.map(room => (
                <option key={room} value={room}>
                  {room} ({roomsMap.get(room)?.length || 0} medidores)
                </option>
              ))}
            </select>
          </div>

          {/* Seleção de Medidores */}
          {selectedRoom && (
            <div className="toolbar-section device-selection">
              <label className="toolbar-label">
                <Database size={18} />
                Medidores {selectedRoom !== 'all' && `da Sala`}
                {selectedDeviceIds.length > 0 && (
                  <span className="selection-count">({selectedDeviceIds.length} selecionados)</span>
                )}
              </label>
              <div className="device-list-container">
                <div className="device-list-header">
                  <button
                    className="select-all-devices-btn"
                    onClick={handleSelectAllDevices}
                    disabled={devicesByRoom.length === 0}
                  >
                    {selectedDeviceIds.length === devicesByRoom.length ? (
                      <>
                        <CheckSquare size={16} />
                        Desmarcar Todos
                      </>
                    ) : (
                      <>
                        <Square size={16} />
                        Selecionar Todos ({devicesByRoom.length})
                      </>
                    )}
                  </button>
                </div>
                <div className="device-list">
                  {devicesByRoom.length === 0 ? (
                    <div className="no-devices">
                      <Database size={32} />
                      <p>Nenhum medidor encontrado</p>
                    </div>
                  ) : (
                    devicesByRoom.map(device => (
                      <label key={device.meterId} className="device-item">
                        <input
                          type="checkbox"
                          checked={selectedDeviceIds.includes(device.meterId)}
                          onChange={() => handleDeviceToggle(device.meterId)}
                          disabled={loading}
                        />
                        <div className="device-item-info">
                          <span className="device-item-name">{device.name}</span>
                          <div className="device-item-meta">
                            <span className={`device-item-status ${device.status === 'ONLINE' ? 'online' : 'offline'}`}>
                              {device.status === 'ONLINE' ? <Wifi size={12} /> : <WifiOff size={12} />}
                              {device.status}
                            </span>
                            <span className="device-item-id">ID: {device.meterId}</span>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filtros de Período e Exportação */}
        <div className="filters-toolbar">
          <div className="filters-section time-filters">
            <label className="toolbar-label">
              <Calendar size={18} />
              Período
            </label>
            <div className="time-range-buttons">
              {(['1h', '24h', '7d', '30d'] as const).map(range => (
                <button
                  key={range}
                  className={`time-range-btn ${timeRange === range ? 'active' : ''}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range === '1h' ? '1 hora' : range === '24h' ? '24 horas' : range === '7d' ? '7 dias' : '30 dias'}
                </button>
              ))}
              <button
                className={`time-range-btn ${timeRange === 'custom' ? 'active' : ''}`}
                onClick={() => setTimeRange('custom')}
              >
                <Clock size={16} />
                Personalizado
              </button>
            </div>
            
            <div className={`custom-date-inputs ${timeRange !== 'custom' ? 'hidden' : ''}`}>
              <DateTimePicker
                value={customStartDate}
                onChange={(value) => setCustomStartDate(value)}
                placeholder="Data inicial"
              />
              <div className="date-divider"></div>
              <DateTimePicker
                value={customEndDate}
                onChange={(value) => setCustomEndDate(value)}
                placeholder="Data final"
              />
            </div>
          </div>

          <div className="filters-section export-section">
            <div className="export-section-content">
              <label className="toolbar-label">
                <Download size={18} />
                Exportar Relatório
              </label>
              <div className="export-buttons">
                <button
                  className="export-btn csv"
                  onClick={() => handleExportReport('csv')}
                  disabled={exporting || selectedDeviceIds.length === 0}
                  title="Exportar como CSV"
                >
                  <Download size={16} />
                  {exporting ? 'Exportando...' : 'CSV'}
                </button>
                <button
                  className="export-btn json"
                  onClick={() => handleExportReport('json')}
                  disabled={exporting || selectedDeviceIds.length === 0}
                  title="Exportar como JSON"
                >
                  <Download size={16} />
                  {exporting ? 'Exportando...' : 'JSON'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="room-charts-error">
            <AlertCircle size={20} />
            <span>{error}</span>
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
                      {selectedRoom === 'all' 
                        ? `Todas as Salas - ${selectedDeviceIds.length} Medidores`
                        : `${selectedRoom} - ${selectedDeviceIds.length} Medidor${selectedDeviceIds.length > 1 ? 'es' : ''}`}
                    </h3>
                    <p>
                      {selectedRoom === 'all' 
                        ? `Visualizando todos os medidores do sistema`
                        : `Medidores selecionados: ${selectedDeviceIds.join(', ')}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="room-stats-grid">
              {metricsConfig.map(metric => getStatCard(metric))}
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