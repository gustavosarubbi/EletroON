import React from 'react';
import { UsersRound, Shield, UserCog } from 'lucide-react';
import { UserData } from './types';

interface UserStatsProps {
  users: UserData[];
}

const UserStats: React.FC<UserStatsProps> = ({ users }) => {
  const totalUsers = users.length;
  const admins = users.filter(u => u.role === 'admin').length;
  const regularUsers = users.filter(u => u.role !== 'admin').length;

  return (
    <div className="header-stats">
      <div className="stat-card users-card">
        <div className="stat-header">
          <div className="stat-title-container">
            <div className="status-indicator users"></div>
            <div className="stat-title">Total de Usuários</div>
          </div>
          <div className="stat-icon users">
            <UsersRound size={24} />
          </div>
        </div>
        <div className="stat-content">
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-label">Usuários cadastrados</div>
          <div className="stat-progress">
            <div className="stat-progress-bar users" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
      
      <div className="stat-card admins-card">
        <div className="stat-header">
          <div className="stat-title-container">
            <div className="status-indicator admins"></div>
            <div className="stat-title">Administradores</div>
          </div>
          <div className="stat-icon admins">
            <Shield size={24} />
          </div>
        </div>
        <div className="stat-content">
          <div className="stat-value">{admins}</div>
          <div className="stat-label">Usuários administrativos</div>
          <div className="stat-progress">
            <div className="stat-progress-bar admins" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
      
      <div className="stat-card regular-card">
        <div className="stat-header">
          <div className="stat-title-container">
            <div className="status-indicator regular"></div>
            <div className="stat-title">Usuários Regulares</div>
          </div>
          <div className="stat-icon regular">
            <UserCog size={24} />
          </div>
        </div>
        <div className="stat-content">
          <div className="stat-value">{regularUsers}</div>
          <div className="stat-label">Usuários comuns</div>
          <div className="stat-progress">
            <div className="stat-progress-bar regular" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStats;
