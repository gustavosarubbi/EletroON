import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface ErrorStateProps {
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ onRetry }) => {
  return (
    <div className="user-manager-container">
      <div className="user-manager-error">
        <AlertCircle className="error-icon" size={64} />
        <h3>Erro ao carregar usuários</h3>
        <p>Não foi possível conectar com a API.</p>
        <p className="error-detail">Verifique se a API está rodando em <code>http://localhost:3000</code></p>
        <button className="retry-btn" onClick={onRetry}>
          <Loader2 size={18} />
          Tentar Novamente
        </button>
      </div>
    </div>
  );
};

export default ErrorState;
