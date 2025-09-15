import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthContextType, LoginCredentials, User } from '../types/auth';
import authService from '../services/authService';


// Estado inicial
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Tipos de ações
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User };

// Reducer para gerenciar o estado
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    default:
      return state;
  }
}

// Criar o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Provider do contexto
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar se há usuário logado ao inicializar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔍 Inicializando autenticação...');
        
        const token = authService.getToken();
        const user = authService.getUser();
        
        if (token && user && authService.isTokenValid()) {
          console.log('✅ Token válido encontrado, usuário autenticado:', user);
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        } else {
          if (token && user) {
            console.log('⚠️ Token expirado ou inválido, limpando dados');
            authService.clearAuthData();
          } else {
            console.log('❌ Nenhum usuário encontrado no localStorage');
          }
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar autenticação:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Função de login
  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('🔐 Iniciando processo de login...');
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authService.login(credentials);
      
      console.log('✅ Login bem-sucedido:', response);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: response.user, token: response.token },
      });
      
      return response; // Retornar o response para uso no componente
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message || 'Erro desconhecido ao fazer login',
      });
      throw error;
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      await authService.logout();
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      // Sempre limpar os dados locais
      authService.clearAuthData();
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Função para limpar erros
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
