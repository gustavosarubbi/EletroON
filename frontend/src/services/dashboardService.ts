import axios from 'axios';
import {
  Device,
  Reading,
  User,
  DashboardStats,
  ExportOptions,
  ConsumptionSummary,
  WeeklySummary,
} from '../types/dashboard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Configuração do Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Função auxiliar para verificar se o token é válido
function isTokenValid(token: string): boolean {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp > currentTime;
  } catch (error) {
    return false;
  }
}

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && isTokenValid(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token && !isTokenValid(token)) {
      // Token inválido ou expirado - limpar e deixar a requisição falhar
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratar diferentes tipos de erro
    if (error.response) {
      // Erro de resposta do servidor
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error || 'Erro desconhecido';
      
      if (status === 401) {
        // Token inválido ou expirado
        console.error('🔒 Token inválido ou expirado');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirecionar para login se não estiver na página de login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } else if (status === 403) {
        console.error('🚫 Acesso negado');
      } else if (status === 404) {
        console.error('❌ Endpoint não encontrado:', error.config?.url);
      } else if (status >= 500) {
        console.error('🔥 Erro no servidor:', message);
      }
    } else if (error.request) {
      // Requisição feita mas sem resposta (erro de rede)
      console.error('🌐 Erro de conexão com a API:', error.message);
    } else {
      // Erro ao configurar a requisição
      console.error('⚠️ Erro ao configurar requisição:', error.message);
    }
    
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
      // Verificar token antes de fazer a requisição
      const token = localStorage.getItem('token');
      if (!token || !isTokenValid(token)) {
        throw new Error('Token inválido ou expirado. Faça login novamente.');
      }

      const response = await api.get('/admin/devices');
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar dispositivos:', error);
      
      // Tratamento específico de erros
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error;
        
        if (status === 401) {
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        } else if (status === 403) {
          throw new Error('Você não tem permissão para acessar os dispositivos.');
        } else if (status === 404) {
          throw new Error('Endpoint de dispositivos não encontrado. Verifique se o backend está configurado corretamente.');
        } else if (status >= 500) {
          throw new Error('Erro no servidor ao buscar dispositivos. Tente novamente mais tarde.');
        } else if (message) {
          throw new Error(message);
        }
      } else if (error.request) {
        // Erro de rede (sem resposta do servidor)
        throw new Error('Não foi possível conectar à API. Verifique se o backend está rodando e acessível.');
      } else if (error.message) {
        // Erro de validação ou outro erro conhecido
        throw error;
      }
      
      throw new Error('Erro desconhecido ao buscar dispositivos. Verifique a conexão com a API.');
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

  // Buscar consumo das últimas 24 horas
  async getConsumptionLast24Hours(): Promise<ConsumptionSummary[]> {
    try {
      const response = await api.get('/admin/consumption/last24h');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar consumo das últimas 24h:', error);
      throw error;
    }
  },

  // Buscar leituras semanais
  async getWeeklyReadings(): Promise<WeeklySummary[]> {
    try {
      const response = await api.get('/admin/readings/weekly');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar leituras semanais:', error);
      throw error;
    }
  },

  // Buscar logs de atividade recentes
  async getActivityLogs(): Promise<{ type: string; message: string; time: string; timestamp: Date }[]> {
    try {
      const response = await api.get('/admin/activity-logs');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar logs de atividade:', error);
      throw error;
    }
  },

  // Deletar usuário
  async deleteUser(userId: number): Promise<void> {
    try {
      await api.delete(`/admin/users/${userId}`);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  },

  // Associar dispositivo a usuário
  async associateMeterToUser(meterId: number, userId: number): Promise<void> {
    try {
      await api.post(`/admin/devices/${meterId}/associate`, { userId });
    } catch (error) {
      console.error('Erro ao associar medidor:', error);
      throw error;
    }
  },

  // Desassociar dispositivo de usuário
  async disassociateMeterFromUser(meterId: number): Promise<void> {
    try {
      await api.patch(`/admin/devices/${meterId}/disassociate`);
    } catch (error) {
      console.error('Erro ao desassociar medidor:', error);
      throw error;
    }
  },

  // Criar usuário
  async createUser(email: string, password: string, role: string = 'USER', room?: string): Promise<User> {
    try {
      const response = await api.post('/admin/users', { email, password, role, room });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  },

  // Atualizar usuário
  async updateUser(userId: number, email?: string, password?: string, room?: string): Promise<User> {
    try {
      const response = await api.patch(`/admin/users/${userId}`, { email, password, room });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },
};

export default dashboardService;
