import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div className="user-manager-container">
      <div className="user-manager-loading">
        <Loader2 className="spinner-icon" size={56} />
        <p>Carregando usuários...</p>
      </div>
    </div>
  );
};

export default LoadingState;
