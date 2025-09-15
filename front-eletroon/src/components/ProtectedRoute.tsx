import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  console.log('🔒 ProtectedRoute:', {
    isAuthenticated,
    isLoading,
    user,
    requireAdmin,
    currentPath: location.pathname
  });

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    console.log('⏳ ProtectedRoute: Carregando...');
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute: Não autenticado, redirecionando para login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se requer admin e usuário não é admin, redirecionar para dashboard
  if (requireAdmin && user?.role !== 'admin') {
    console.log('🚫 ProtectedRoute: Usuário não é admin, redirecionando para dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Se usuário é admin mas está tentando acessar rota não-admin, redirecionar para admin dashboard
  if (user?.role === 'admin' && !requireAdmin && location.pathname === '/dashboard') {
    console.log('🔄 ProtectedRoute: Admin acessando dashboard normal, redirecionando para admin dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }

  console.log('✅ ProtectedRoute: Acesso permitido');
  return <>{children}</>;
};

export default ProtectedRoute;
