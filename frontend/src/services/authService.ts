import axios from 'axios';
import { LoginCredentials, AuthResponse } from '../types/auth';

// ⚠️ IMPORTANTE: Este projeto usa pnpm para gerenciamento de pacotes

// Usar proxy do Vite em desenvolvimento, ou URL direta em produção
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api');

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
    // Não adicionar token em rotas de autenticação pública
    if (config.url?.includes('/auth/login')) {
      // Limpar token antigo/inválido antes do login
      const token = localStorage.getItem('token');
      if (token && !isTokenValid(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      return config;
    }
    
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
    // Não limpar dados se for a rota de login (401 é esperado em credenciais inválidas)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
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
      
      // Limpar token antigo/inválido antes de fazer login
      const oldToken = localStorage.getItem('token');
      if (oldToken && !this.isTokenValid()) {
        console.log('🧹 Limpando token inválido antes do login');
        this.clearAuthData();
      }
      
      // Usar a instância api que já tem baseURL configurado
      // Isso garante que o proxy do Vite funcione corretamente
      console.log('🔗 URL de login: /auth/login');
      console.log('📤 Base URL configurada:', API_BASE_URL);
      console.log('📤 URL completa será:', `${API_BASE_URL}/auth/login`);
      console.log('🌐 Modo:', import.meta.env.DEV ? 'DESENVOLVIMENTO (proxy)' : 'PRODUÇÃO');
      
      // Fazer requisição de login usando a instância api (sem token no header)
      // A instância api já tem o baseURL configurado e os interceptors
      const response = await api.post<{ access_token: string }>(
        '/auth/login',
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 segundos de timeout
        }
      );
      
      console.log('✅ Resposta da API:', response.data);
      
      const { access_token } = response.data;
      
      if (!access_token) {
        throw new Error('Token não recebido do servidor');
      }
      
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
      
      // Tratamento específico de erros HTTP
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { 
          response?: { 
            status?: number;
            data?: { message?: string; error?: string } 
          } 
        };
        
        // Erro 401 - Credenciais inválidas
        if (apiError.response?.status === 401) {
          const errorMessage = apiError.response.data?.message || 
                             apiError.response.data?.error || 
                             'Credenciais inválidas. Verifique seu email e senha.';
          throw new Error(errorMessage);
        }
        
        // Erro 404 - Servidor não encontrado
        if (apiError.response?.status === 404) {
          const axiosError = error as any;
          console.error('❌ Endpoint não encontrado (404)');
          console.error('🔍 URL completa tentada:', axiosError.config?.url || 'N/A');
          console.error('🔍 Base URL configurada:', axiosError.config?.baseURL || 'N/A');
          console.error('🔍 URL final:', axiosError.config?.baseURL + axiosError.config?.url || 'N/A');
          console.error('🔍 Modo desenvolvimento:', import.meta.env.DEV);
          console.error('💡 Verifique se:');
          console.error('   1. O backend está rodando: cd backend && pnpm start:dev');
          console.error('   2. O frontend está rodando: cd frontend && pnpm dev');
          console.error('   3. O proxy do Vite está configurado corretamente');
          console.error('   4. Teste diretamente: http://localhost:3000/api/auth/login');
          throw new Error('Servidor não encontrado. Verifique se o backend está rodando em http://localhost:3000');
        }
        
        // Erro de rede
        if (apiError.response?.status === undefined) {
          const axiosError = error as any;
          console.error('❌ Erro de rede - sem resposta do servidor');
          console.error('🔍 URL tentada:', axiosError.config?.url || 'N/A');
          console.error('🔍 Base URL:', axiosError.config?.baseURL || 'N/A');
          console.error('🔍 Erro completo:', axiosError.message || 'N/A');
          console.error('🔍 Código do erro:', axiosError.code || 'N/A');
          console.error('💡 Verifique se:');
          console.error('   1. O backend está rodando na porta 3000');
          console.error('   2. O frontend está rodando e o proxy está ativo');
          console.error('   3. Não há firewall bloqueando a conexão');
          console.error('   4. Teste diretamente no navegador: http://localhost:3000/api');
          throw new Error('Erro de conexão. Verifique se o backend está acessível.');
        }
        
        // Outros erros HTTP
        if (apiError.response?.data?.message) {
          throw new Error(apiError.response.data.message);
        }
        
        if (apiError.response?.data?.error) {
          throw new Error(apiError.response.data.error);
        }
      }
      
      if (error instanceof Error) {
        throw error;
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
