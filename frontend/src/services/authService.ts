import axios, { isAxiosError } from 'axios';
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
      
      // Tratamento detalhado de erros Axios
      if (isAxiosError(error)) {
        const axiosError = error;
        
        // Log detalhado do erro
        console.error('📋 Detalhes do erro Axios:');
        console.error('   - Código:', axiosError.code || 'N/A');
        console.error('   - Mensagem:', axiosError.message || 'N/A');
        console.error('   - URL tentada:', axiosError.config?.url || 'N/A');
        console.error('   - Base URL:', axiosError.config?.baseURL || 'N/A');
        console.error('   - URL completa:', `${axiosError.config?.baseURL || ''}${axiosError.config?.url || ''}` || 'N/A');
        console.error('   - Método:', axiosError.config?.method?.toUpperCase() || 'N/A');
        console.error('   - Status HTTP:', axiosError.response?.status || 'N/A (sem resposta)');
        console.error('   - Dados da resposta:', axiosError.response?.data || 'N/A');
        console.error('   - Modo desenvolvimento:', import.meta.env.DEV);
        
        // Erro de conexão (ECONNREFUSED, ETIMEDOUT, etc.)
        if (!axiosError.response) {
          const errorCode = axiosError.code;
          let errorMessage = 'Erro de conexão com o servidor.';
          
          if (errorCode === 'ECONNREFUSED') {
            errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3000.';
            console.error('💡 Solução:');
            console.error('   1. Verifique se o backend está rodando: cd backend && pnpm start:dev');
            console.error('   2. Verifique se o backend está na porta 3000');
            console.error('   3. Teste diretamente: http://localhost:3000/api');
          } else if (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNABORTED') {
            errorMessage = 'Tempo de conexão esgotado. O servidor pode estar sobrecarregado ou inacessível.';
            console.error('💡 Solução:');
            console.error('   1. Verifique se o backend está respondendo');
            console.error('   2. Verifique a conexão de rede');
            console.error('   3. Tente novamente em alguns instantes');
          } else if (errorCode === 'ERR_NETWORK') {
            errorMessage = 'Erro de rede. Verifique sua conexão com a internet.';
            console.error('💡 Solução:');
            console.error('   1. Verifique sua conexão de internet');
            console.error('   2. Verifique se o proxy do Vite está funcionando');
            console.error('   3. Verifique se há firewall bloqueando a conexão');
          } else {
            console.error('💡 Solução:');
            console.error('   1. O backend está rodando? cd backend && pnpm start:dev');
            console.error('   2. O frontend está rodando? cd frontend && pnpm dev');
            console.error('   3. O proxy do Vite está configurado? Verifique vite.config.ts');
            console.error('   4. Teste diretamente: http://localhost:3000/api/auth/login');
          }
          
          throw new Error(errorMessage);
        }
        
        // Erro 401 - Credenciais inválidas
        if (axiosError.response?.status === 401) {
          const errorMessage = axiosError.response.data?.message || 
                             axiosError.response.data?.error || 
                             'Credenciais inválidas. Verifique seu email e senha.';
          throw new Error(errorMessage);
        }
        
        // Erro 404 - Servidor não encontrado
        if (axiosError.response?.status === 404) {
          console.error('💡 Solução:');
          console.error('   1. Verifique se a rota /api/auth/login existe no backend');
          console.error('   2. Verifique se o prefixo global está configurado como "api"');
          console.error('   3. Teste diretamente: http://localhost:3000/api/auth/login');
          throw new Error('Endpoint não encontrado. Verifique se o backend está rodando e a rota está correta.');
        }
        
        // Erro 500 - Erro interno do servidor
        if (axiosError.response?.status === 500) {
          const errorMessage = axiosError.response.data?.message || 
                             axiosError.response.data?.error || 
                             'Erro interno do servidor. Tente novamente mais tarde.';
          console.error('💡 O backend retornou um erro 500. Verifique os logs do servidor.');
          throw new Error(errorMessage);
        }
        
        // Outros erros HTTP
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
        
        if (axiosError.response?.data?.error) {
          throw new Error(axiosError.response.data.error);
        }
        
        // Erro HTTP genérico
        if (axiosError.response?.status) {
          throw new Error(`Erro HTTP ${axiosError.response.status}: ${axiosError.message}`);
        }
      }
      
      // Erro genérico
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
