import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, AlertTriangle, Brain, Star, Shield, Mail, Lock } from 'lucide-react';
import Button from '../components/ui/Button';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import ToastContainer from '../components/ui/ToastContainer';
import LoginParticles from '../components/ui/LoginParticles';
import { useToast } from '../hooks/useToast';
// CSS imports are now handled by the main index.css file

// ⚠️ IMPORTANTE: Este projeto usa pnpm para gerenciamento de pacotes

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
        // Redirecionar baseado no role do usuário
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        navigate(redirectPath, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  // Limpar erro apenas quando o usuário começar a digitar (não durante o login)
  useEffect(() => {
    if (error && !isSubmitting) {
      // Limpar o erro apenas quando o usuário começar a digitar ativamente
      const timer = setTimeout(() => {
        if (email || password) {
          clearError();
        }
      }, 2000); // Delay maior para dar tempo de ler a mensagem
      
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
      return; // Validação será feita pelos tooltips
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔐 Tentando fazer login...', { email });
      const response = await login({ email, password });
      console.log('✅ Login bem-sucedido! Redirecionando...');
      
      // Determinar o caminho de redirecionamento baseado no role
      const redirectPath = response.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      const redirectMessage = response.user.role === 'admin' 
        ? 'Redirecionando para o painel administrativo...' 
        : 'Redirecionando para o dashboard...';
      
      showSuccess('Login realizado com sucesso!', redirectMessage, 1000);
      setTimeout(() => navigate(redirectPath), 1000);
    } catch (err: unknown) {
      console.error('❌ Erro no login:', err);
      
      // Mostrar toast de erro
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
    <div className="login-container">
      {/* Partículas modernas animadas */}
      <LoginParticles />

      {/* Card de Login */}
      <div className="login-card">
        {/* Header do Login */}
        <div className="login-header">
          <div className="logo-container">
            <img 
              src="/logo_eletroon.png" 
              alt="EletroON Logo" 
              className="logo"
            />
          </div>
          <h1 className="eletroon-title">EletroON</h1>
        </div>

        {/* Bloco com 3 ícones e palavras em linha */}
        <div className="features-inline">
          <div className="feature-inline-item">
            <div className="feature-icon">
              <Brain size={16} />
            </div>
            <span className="feature-text">Inteligente</span>
          </div>
          
          <span className="separator">•</span>
          
          <div className="feature-inline-item">
            <div className="feature-icon">
              <Star size={16} />
            </div>
            <span className="feature-text">Moderno</span>
          </div>
          
          <span className="separator">•</span>
          
          <div className="feature-inline-item">
            <div className="feature-icon">
              <Shield size={16} />
            </div>
            <span className="feature-text">Seguro</span>
          </div>
        </div>

        {/* Texto de login abaixo dos ícones */}
        <p className="login-subtitle-below-icons">Faça login para acessar o sistema</p>

        {/* Divider antes do formulário */}
        <div className="form-divider"></div>

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label-with-icon">
              <Mail size={16} />
              <span>E-mail</span>
            </label>
                          <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Digite seu e-mail"
                required
                disabled={isSubmitting}
                className={emailError ? 'invalid' : email && !emailError ? 'valid' : ''}
              />
              {emailError && (
                <div className="validation-message error">
                  <span>{emailError}</span>
                </div>
              )}
            </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label-with-icon">
              <Lock size={16} />
              <span>Senha</span>
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Digite sua senha"
                required
                disabled={isSubmitting}
                className={passwordError ? 'invalid' : password && !passwordError ? 'valid' : ''}
              />
              
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordError && (
              <div className="validation-message error">
                <span>{passwordError}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={!email || !password}
            className="login-button"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        {/* Divider antes do footer */}
        <div className="login-divider"></div>


        {/* Footer do Login */}
        <div className="login-footer">
          <p>&copy; 2025 EletroON. Todos os direitos reservados.</p>
        </div>
      </div>
      
      {/* Loading Overlay para operações de loading */}
      <LoadingOverlay 
        isVisible={isSubmitting}
        text="Entrando no sistema..."
        variant="dots"
        size="lg"
      />
      
      {/* Container de Toasts para feedback visual */}
      <ToastContainer 
        toasts={toasts}
        onRemoveToast={removeToast}
      />
    </div>
  );
};

export default LoginPage;
