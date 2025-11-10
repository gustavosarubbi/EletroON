import React from 'react';
import { CheckSquare, Square, ChevronUp, ChevronDown, Mail, Shield, Zap, Calendar, List, Lock, Settings, Building2 } from 'lucide-react';
import { SortConfig, SortKey } from '../types';

interface UserTableHeaderProps {
  selectedUsers: number[];
  usersCount: number;
  sortConfig: SortConfig | null;
  onSort: (key: SortKey) => void;
  onSelectAll: () => void;
}

const UserTableHeader: React.FC<UserTableHeaderProps> = ({
  selectedUsers,
  usersCount,
  sortConfig,
  onSort,
  onSelectAll,
}) => {
  const allSelected = selectedUsers.length === usersCount && usersCount > 0;
  const someSelected = selectedUsers.length > 0 && selectedUsers.length < usersCount;

  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="sort-icon-active" /> : <ChevronDown size={14} className="sort-icon-active" />;
    }
    return <ChevronUp size={14} className="sort-icon-inactive" />;
  };

  return (
    <thead>
      <tr>
        <th className="table-checkbox-column">
          <div className="checkbox-header-wrapper">
            <button 
              className={`checkbox-header-btn ${allSelected ? 'checked' : ''} ${someSelected ? 'partial' : ''}`}
              onClick={onSelectAll}
              title={allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              aria-label={allSelected ? 'Desmarcar todos os usuários' : 'Selecionar todos os usuários'}
              aria-pressed={allSelected}
            >
              <List size={16} className="checkbox-header-icon" />
              {allSelected ? (
                <>
                  <CheckSquare size={18} />
                  <span>Todos</span>
                </>
              ) : (
                <>
                  <Square size={18} />
                  <span>Todos</span>
                </>
              )}
            </button>
            <div className="checkbox-header-spacer"></div>
          </div>
        </th>
        <th 
          className={`table-sortable table-email-column ${sortConfig?.key === 'email' ? 'active' : ''}`}
          onClick={() => onSort('email')}
          role="columnheader"
          aria-sort={sortConfig?.key === 'email' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          <div className="sort-header">
            <Mail size={14} />
            <span>Email</span>
            {getSortIcon('email')}
          </div>
        </th>
        <th className="table-password-column">
          <div className="sort-header">
            <Lock size={14} />
            <span>Senha</span>
          </div>
        </th>
        <th 
          className={`table-sortable table-role-column ${sortConfig?.key === 'role' ? 'active' : ''}`}
          onClick={() => onSort('role')}
          role="columnheader"
          aria-sort={sortConfig?.key === 'role' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          <div className="sort-header">
            <Shield size={14} />
            <span>Tipo</span>
            {getSortIcon('role')}
          </div>
        </th>
        <th 
          className={`table-sortable table-room-column ${sortConfig?.key === 'room' ? 'active' : ''}`}
          onClick={() => onSort('room')}
          role="columnheader"
          aria-sort={sortConfig?.key === 'room' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          <div className="sort-header">
            <Building2 size={14} />
            <span>Sala</span>
            {getSortIcon('room')}
          </div>
        </th>
        <th 
          className={`table-sortable table-devices-column ${sortConfig?.key === 'devices' ? 'active' : ''}`}
          onClick={() => onSort('devices')}
          role="columnheader"
          aria-sort={sortConfig?.key === 'devices' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          <div className="sort-header">
            <Zap size={14} />
            <span>Medidores</span>
            {getSortIcon('devices')}
          </div>
        </th>
        <th 
          className={`table-sortable table-date-column ${sortConfig?.key === 'createdAt' ? 'active' : ''}`}
          onClick={() => onSort('createdAt')}
          role="columnheader"
          aria-sort={sortConfig?.key === 'createdAt' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          <div className="sort-header">
            <Calendar size={14} />
            <span>Data de Criação</span>
            {getSortIcon('createdAt')}
          </div>
        </th>
        <th className="table-actions-column">
          <div className="table-header-actions">
            <Settings size={14} />
            <span>Ações</span>
          </div>
        </th>
      </tr>
    </thead>
  );
};

export default UserTableHeader;
