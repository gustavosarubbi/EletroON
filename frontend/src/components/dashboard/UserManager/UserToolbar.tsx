import React from 'react';
import {
  Search,
  SlidersHorizontal,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  X,
  LayoutGrid,
  List,
  ChevronDown,
  FileText
} from 'lucide-react';
import { FilterRole, ViewMode } from './types';

interface UserToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterRole: FilterRole;
  onFilterChange: (role: FilterRole) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onRefresh: () => void;
  onExport: (format: 'csv' | 'json') => void;
  onAddUser: () => void;
  onManageMeters: () => void;
}

const UserToolbar: React.FC<UserToolbarProps> = ({
  searchQuery,
  onSearchChange,
  filterRole,
  onFilterChange,
  viewMode,
  onViewModeChange,
  selectedCount,
  onBulkDelete,
  onClearSelection,
  onRefresh,
  onExport,
  onAddUser,
  onManageMeters,
}) => {
  return (
    <div className="toolbar-modern">
      <div className="toolbar-left">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="filter-container">
          <SlidersHorizontal className="filter-icon" size={18} />
          <select
            className="filter-select"
            value={filterRole}
            onChange={(e) => onFilterChange(e.target.value as FilterRole)}
          >
            <option value="all">Todos</option>
            <option value="admin">Administradores</option>
            <option value="user">Usuários</option>
          </select>
        </div>
      </div>

      <div className="toolbar-right">
        {selectedCount > 0 && (
          <div className="bulk-actions-bar">
            <span className="bulk-selection-count">
              {selectedCount} selecionado(s)
            </span>
            <button
              className="bulk-action-btn delete"
              onClick={onBulkDelete}
            >
              <Trash2 size={16} />
              <span>Excluir</span>
            </button>
            <button
              className="bulk-action-btn clear"
              onClick={onClearSelection}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="view-mode-toggle-switch">
          <input
            type="checkbox"
            id="view-mode-toggle"
            checked={viewMode === 'table'}
            onChange={(e) => onViewModeChange(e.target.checked ? 'table' : 'grid')}
            className="toggle-input"
          />
          <label htmlFor="view-mode-toggle" className="toggle-label">
            <span className="toggle-slider">
              {viewMode === 'grid' ? <LayoutGrid size={14} /> : <List size={14} />}
            </span>
          </label>
        </div>

        <div className="export-menu">
          <button className="toolbar-btn secondary">
            <Download size={18} />
            <span>Exportar</span>
            <ChevronDown size={16} />
          </button>
          <div className="export-dropdown">
            <button className="export-option" onClick={() => onExport('csv')}>
              <FileText size={16} />
              <span>Exportar como CSV</span>
            </button>
            <button className="export-option" onClick={() => onExport('json')}>
              <FileText size={16} />
              <span>Exportar como JSON</span>
            </button>
          </div>
        </div>

        <button
          className="toolbar-btn secondary"
          onClick={onRefresh}
          title="Atualizar"
        >
          <RefreshCw size={18} />
        </button>

        <button
          className="action-btn manage-meters"
          onClick={onManageMeters}
        >
          <span>Gerenciar Medidores</span>
        </button>

        <button
          className="action-btn add-user"
          onClick={onAddUser}
        >
          <Plus size={18} />
          <span>Adicionar Usuário</span>
        </button>
      </div>
    </div>
  );
};

export default UserToolbar;
