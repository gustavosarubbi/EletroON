import React from 'react';
import { CheckSquare, Square, ChevronUp, ChevronDown, Mail, Shield, Zap, Calendar, List } from 'lucide-react';
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
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <thead>
      <tr>
        <th className="table-checkbox-column">
          <div className="checkbox-header-wrapper">
            <List size={14} className="checkbox-header-icon" />
            <button 
              className={`checkbox-header-btn ${allSelected ? 'checked' : ''} ${someSelected ? 'partial' : ''}`}
              onClick={onSelectAll}
              title={allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              aria-label={allSelected ? 'Desmarcar todos os usuários' : 'Selecionar todos os usuários'}
              aria-pressed={allSelected}
            >
              {allSelected ? (
                <>
                  <CheckSquare size={16} />
                  <span>Todos</span>
                </>
              ) : (
                <>
                  <Square size={16} />
                  <span>Todos</span>
                </>
              )}
            </button>
          </div>
        </th>
        <th 
          className={`table-sortable ${sortConfig?.key === 'email' ? 'active' : ''}`}
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
        <th 
          className={`table-sortable ${sortConfig?.key === 'role' ? 'active' : ''}`}
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
          className={`table-sortable ${sortConfig?.key === 'devices' ? 'active' : ''}`}
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
          className={`table-sortable ${sortConfig?.key === 'createdAt' ? 'active' : ''}`}
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
            <span>Ações</span>
          </div>
        </th>
      </tr>
    </thead>
  );
};

export default UserTableHeader;
