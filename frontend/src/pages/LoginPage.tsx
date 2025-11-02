import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, AlertTriangle, Mail, Lock } from 'lucide-react';
import Button from '../components/ui/Button';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import ToastContainer from '../components/ui/ToastContainer';
import LoginParticles from '../components/ui/LoginParticles';
import { useToast } from '../hooks/useToast';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { login, error, clearError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toasts, removeToast, showSuccess, showError } = useToast();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        navigate(redirectPath, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  // Limpar erro quando o usuário começar a digitar
  useEffect(() => {
    if (error && !isSubmitting) {
      const timer = setTimeout(() => {
        if (email || password) {
          clearError();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [email, password, error, clearError, isSubmitting]);

  // Validação em tempo real
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return '';
    if (!emailRegex.test(email)) return 'E-mail inválido';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return '';
    if (password.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔐 Tentando fazer login...', { email });
      const response = await login({ email, password });
      console.log('✅ Login bem-sucedido! Redirecionando...');
      
      const redirectPath = response.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      const redirectMessage = response.user.role === 'admin' 
        ? 'Redirecionando para o painel administrativo...' 
        : 'Redirecionando para o dashboard...';
      
      showSuccess('Login realizado com sucesso!', redirectMessage, 1000);
      setTimeout(() => navigate(redirectPath), 1000);
    } catch (err: unknown) {
      console.error('❌ Erro no login:', err);
      
      if (err instanceof Error) {
        showError('Erro no login', err.message, 1000);
      } else {
        showError('Erro no login', 'Credenciais inválidas. Verifique seu email e senha.', 1000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page-container">
      {/* Partículas animadas de fundo */}
      <LoginParticles />

      {/* Card de Login Principal */}
      <div className="login-page-card">
        {/* Header com Logo e Título */}
        <div className="login-page-header">
          <div className="login-page-logo-wrapper">
            <div className="login-page-logo-glow"></div>
            <img 
              src="/logo_eletroon.png" 
              alt="EletroON Logo" 
              className="login-page-logo"
            />
          </div>
          <h1 className="login-page-title">
            <span className="login-page-title-main">Eletro</span>
            <span className="login-page-title-accent">ON</span>
          </h1>
          <p className="login-page-subtitle">Sistema Inteligente de Gestão Energética</p>
        </div>

        {/* Divider */}
        <div className="login-page-divider"></div>

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="login-page-form">
          {error && (
            <div className="login-page-error">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Campo Email */}
          <div className="login-page-field">
            <label htmlFor="email" className="login-page-label">
              <Mail size={18} />
              <span>E-mail</span>
            </label>
            <div className="login-page-input-wrapper">
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="seu@email.com"
                required
                disabled={isSubmitting}
                className={`login-page-input ${emailError ? 'error' : email && !emailError ? 'valid' : ''}`}
              />
            </div>
            {emailError && (
              <div className="login-page-validation-error">
                {emailError}
              </div>
            )}
          </div>

          {/* Campo Senha */}
          <div className="login-page-field">
            <label htmlFor="password" className="login-page-label">
              <Lock size={18} />
              <span>Senha</span>
            </label>
            <div className="login-page-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
                className={`login-page-input ${passwordError ? 'error' : password && !passwordError ? 'valid' : ''}`}
              />
              <button
                type="button"
                className="login-page-password-toggle"
                onClick={togglePasswordVisibility}
                disabled={isSubmitting}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordError && (
              <div className="login-page-validation-error">
                {passwordError}
              </div>
            )}
          </div>

          {/* Botão de Login */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={!email || !password || !!emailError || !!passwordError}
            className="login-page-button"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        {/* Footer */}
        <div className="login-page-footer">
          <p>&copy; 2025 EletroON. Todos os direitos reservados.</p>
        </div>
      </div>
      
      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={isSubmitting}
        text="Entrando no sistema..."
        variant="dots"
        size="lg"
      />
      
      {/* Toast Container */}
      <ToastContainer 
        toasts={toasts}
        onRemoveToast={removeToast}
      />
    </div>
  );
};

export default LoginPage;
