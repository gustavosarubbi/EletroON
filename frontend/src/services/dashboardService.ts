import axios from 'axios';
import { Device, Reading, User, DashboardStats, ExportOptions } from '../types/dashboard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Configuração do Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const dashboardService = {
  // Estatísticas do dashboard
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  },

  // Listar todos os dispositivos
  async getDevices(): Promise<Device[]> {
    try {
      const response = await api.get('/admin/devices');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dispositivos:', error);
      throw error;
    }
  },

  // Listar todos os usuários
  async getUsers(): Promise<User[]> {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },

  // Buscar leituras de um dispositivo
  async getDeviceReadings(meterId: number, limit = 100): Promise<Reading[]> {
    try {
      const response = await api.get(`/eletroon/${meterId}?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar leituras:', error);
      throw error;
    }
  },

  // Buscar leituras de um dispositivo por período
  async getDeviceReadingsByPeriod(
    meterId: number,
    startDate?: Date,
    endDate?: Date,
    limit = 1000
  ): Promise<Reading[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (limit) params.append('limit', limit.toString());
      
      const response = await api.get(`/eletroon/${meterId}/readings?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar leituras por período:', error);
      throw error;
    }
  },

  // Atualizar nome de um dispositivo
  async updateDeviceName(meterId: number, name: string): Promise<void> {
    try {
      await api.patch(`/admin/salas/${meterId}`, { name });
    } catch (error) {
      console.error('Erro ao atualizar nome do dispositivo:', error);
      throw error;
    }
  },

  // Criar usuário para um dispositivo
  async createUserForDevice(meterId: number, email: string, password: string): Promise<void> {
    try {
      await api.post(`/admin/salas/${meterId}/usuario`, { email, password });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  },

  // Atualizar usuário de um dispositivo
  async updateUserForDevice(meterId: number, email?: string, password?: string): Promise<void> {
    try {
      await api.patch(`/admin/salas/${meterId}/usuario`, { email, password });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },

  // Remover usuário de um dispositivo
  async deleteUserForDevice(meterId: number): Promise<void> {
    try {
      await api.delete(`/admin/salas/${meterId}/usuario`);
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      throw error;
    }
  },

  // Associar dispositivo a usuário existente
  async associateDeviceToUser(meterId: number, userId: number): Promise<void> {
    try {
      await api.post(`/admin/salas/${meterId}/associar`, { userId });
    } catch (error) {
      console.error('Erro ao associar dispositivo:', error);
      throw error;
    }
  },

  // Exportar dados consolidados
  async exportData(options: ExportOptions): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (options.dateRange.start) params.append('startDate', options.dateRange.start);
      if (options.dateRange.end) params.append('endDate', options.dateRange.end);
      
      const response = await api.get(`/admin/salas/consolidated-report/csv?${params}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw error;
    }
  },

  // Buscar leituras de múltiplos dispositivos por período
  async getMultipleDevicesReadingsByPeriod(
    meterIds: number[],
    startDate?: Date,
    endDate?: Date,
    limit = 2000
  ): Promise<Reading[]> {
    try {
      const params = new URLSearchParams();
      if (meterIds && meterIds.length > 0) {
        params.append('meterIds', meterIds.join(','));
      }
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      if (limit) params.append('limit', limit.toString());
      
      const response = await api.get(`/eletroon/devices/readings/multiple?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar leituras de múltiplos dispositivos:', error);
      throw error;
    }
  },

  // Exportar relatório
  async exportReport(
    meterIds: number[],
    startDate?: Date,
    endDate?: Date,
    format: 'csv' | 'json' = 'csv'
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (meterIds && meterIds.length > 0) {
        params.append('meterIds', meterIds.join(','));
      }
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      params.append('format', format);
      
      const response = await api.get(`/eletroon/devices/readings/export?${params}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      throw error;
    }
  },
};

export default dashboardService;
