// Tipos para o Dashboard Admin

export interface Device {
  meterId: number;
  name: string;
  location?: string;
  status: 'ONLINE' | 'OFFLINE';
  lastReadingAt?: string;
  associated: boolean;
  user?: {
    id: number;
    email: string;
  };
}

export interface Reading {
  id: number;
  timestamp: string;
  pa: number;
  pb: number;
  pc: number;
  pt: number;
  qa: number;
  qb: number;
  qc: number;
  qt: number;
  epa_c: number;
  epb_c: number;
  epc_c: number;
  ept_c: number;
  epa_g: number;
  epb_g: number;
  epc_g: number;
  ept_g: number;
  iarms: number;
  ibrms: number;
  icrms: number;
  uarms: number;
  ubrms: number;
  ucrms: number;
  pfa: number;
  pfb: number;
  pfc: number;
  pft: number;
  meterId: number;
}

export interface User {
  id: number;
  email: string;
  password?: string;
  role: string;
  createdAt: string;
  devices: Array<{
    meterId: number;
    name: string;
    location?: string;
    status: 'ONLINE' | 'OFFLINE';
    lastReadingAt?: string;
    lastReading?: {
      timestamp: string;
      qt: number;
    };
  }>;
}

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  availableDevices: number;
  totalUsers: number;
  totalReadings: number;
  lastUpdate?: string;
}

export type DataReliability = 'measured' | 'estimated' | 'no-data';

export interface ConsumptionSummary {
  hour: string;
  consumption: number;
  netConsumption: number;
  importConsumption: number;
  generation: number;
  reliability?: DataReliability;
}

export interface WeeklySummary {
  day: string;
  consumption: number;
  netConsumption: number;
  importConsumption: number;
  generation: number;
  count: number;
  reliability?: DataReliability;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
  }>;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  dateRange: {
    start: string;
    end: string;
  };
  devices: number[];
  metrics: string[];
}
