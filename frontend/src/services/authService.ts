import axios from 'axios';
import { LoginCredentials, AuthResponse } from '../types/auth';

// ⚠️ IMPORTANTE: Este projeto usa pnpm para gerenciamento de pacotes

const API_BASE_URL = 'http://localhost:3000/api';

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

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Em caso de erro 401, apenas rejeitar a promise
    // O AuthContext irá lidar com a limpeza dos dados
    if (error.response?.status === 401) {
      console.log('🔒 Token inválido ou expirado, requisição rejeitada');
    }
    return Promise.reject(error);
  }
);

// Função para decodificar JWT (apenas payload, sem verificação)
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    return null;
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Tentando fazer login...', { email: credentials.email });
      
      const response = await api.post<{ access_token: string }>('/auth/login', credentials);
      
      console.log('✅ Resposta da API:', response.data);
      
      const { access_token } = response.data;
      
      // Decodificar o token para extrair informações do usuário
      const payload = decodeJWT(access_token);
      if (!payload) {
        throw new Error('Token inválido recebido do servidor');
      }
      
      // Criar objeto user a partir do payload do JWT
      const user = {
        id: payload.sub.toString(),
        email: payload.email,
        name: payload.email.split('@')[0], // Usar parte do email como nome
        role: payload.role.toLowerCase() as 'admin' | 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Salvar token e usuário no localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return {
        user,
        token: access_token,
      };
    } catch (error: unknown) {
      console.error('❌ Erro no serviço de autenticação:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        if (apiError.response?.data?.message) {
          throw new Error(apiError.response.data.message);
        }
      }
      
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error('Erro desconhecido ao fazer login');
      }
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async getCurrentUser(): Promise<any | null> {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
      return null;
    }
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUser(): any | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > currentTime;
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return false;
    }
  },

  clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default authService;
