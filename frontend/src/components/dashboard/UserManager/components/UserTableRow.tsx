import React, { useRef, useEffect } from 'react';
import { Mail, Clock, Zap, Edit3, Trash2, MoreVertical, Eye, EyeOff, CheckSquare, Square, Save, X } from 'lucide-react';
import { UserData, EditUserData } from '../types';

interface UserTableRowProps {
  user: UserData;
  isSelected: boolean;
  isEditing: boolean;
  showPassword: boolean;
  openActionMenu: boolean;
  editData?: EditUserData;
  onSelect: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onTogglePassword: () => void;
  onViewMeters: () => void;
  onEditChange: (data: EditUserData) => void;
  onOpenActionMenu: () => void;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  isSelected,
  isEditing,
  showPassword,
  openActionMenu,
  editData,
  onSelect,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onTogglePassword,
  onViewMeters,
  onEditChange,
  onOpenActionMenu,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (openActionMenu) {
          onOpenActionMenu();
        }
      }
    };

    if (openActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionMenu, onOpenActionMenu]);

  // Focar no input de senha quando mostrar
  useEffect(() => {
    if (isEditing && passwordInputRef.current && showPassword) {
      passwordInputRef.current.focus();
    }
  }, [isEditing, showPassword]);

  return (
    <tr className={`table-row-modern ${isSelected ? 'table-row-selected' : ''} ${isEditing ? 'table-row-editing' : ''}`}>
      <td className="table-checkbox-column">
        <div className="table-cell-item">
          <button 
            className={`checkbox-btn ${isSelected ? 'checked' : ''}`}
            onClick={onSelect}
            aria-label={isSelected ? 'Desmarcar usuário' : 'Selecionar usuário'}
            aria-pressed={isSelected}
          >
            {isSelected ? (
              <CheckSquare size={18} />
            ) : (
              <Square size={18} />
            )}
          </button>
          <span className="user-id-badge">#{user.id}</span>
        </div>
      </td>
      <td>
        <div className="table-cell-item">
          {isEditing ? (
            <input
              type="email"
              className="table-edit-input"
              value={editData?.email || user.email}
              onChange={(e) => onEditChange({ ...editData, email: e.target.value, password: editData?.password || '' })}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSave();
                } else if (e.key === 'Escape') {
                  onCancel();
                }
              }}
              autoFocus
              aria-label="Editar email"
            />
          ) : (
            <div className="table-cell-email">
              <Mail size={16} aria-hidden="true" />
              <span className="table-cell-text">{user.email}</span>
            </div>
          )}
        </div>
      </td>
      <td>
        <div className="table-cell-item">
          <div className={`role-badge-table ${user.role}`} role="status" aria-label={`Tipo: ${user.role === 'admin' ? 'Administrador' : 'Usuário'}`}>
            {user.role === 'admin' ? 'Administrador' : 'Usuário'}
          </div>
        </div>
      </td>
      <td>
        <div className="table-cell-item">
          <div className="table-cell-meters" title={`${user.devices.length} medidor(es) associado(s)`}>
            <Zap size={16} aria-hidden="true" />
            <span className="table-cell-text">{user.devices.length}</span>
          </div>
        </div>
      </td>
      <td>
        <div className="table-cell-item">
          <div className="table-cell-date" title={new Date(user.createdAt).toLocaleString('pt-BR')}>
            <Clock size={16} aria-hidden="true" />
            <span className="table-cell-text">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </td>
      <td className="table-actions-column">
        <div className="table-actions-cell">
          {isEditing ? (
            <div className="table-actions-edit-group">
              <button
                className="table-action-btn-primary save"
                onClick={onSave}
                title="Salvar alterações (Enter)"
                aria-label="Salvar alterações"
              >
                <Save size={14} />
                <span>Salvar</span>
              </button>
              <div className="table-action-divider"></div>
              <button
                className="table-action-btn-secondary cancel"
                onClick={onCancel}
                title="Cancelar edição (Esc)"
                aria-label="Cancelar edição"
              >
                <X size={14} />
                <span>Cancelar</span>
              </button>
            </div>
          ) : (
            <div className="table-actions-view-group">
              <button
                className="table-action-btn-icon edit"
                onClick={onEdit}
                title="Editar usuário"
                aria-label="Editar usuário"
              >
                <Edit3 size={16} />
              </button>
              <div className="table-action-divider"></div>
              <button
                className="table-action-btn-icon delete"
                onClick={onDelete}
                title="Excluir usuário"
                aria-label="Excluir usuário"
              >
                <Trash2 size={16} />
              </button>
              <div className="table-action-divider"></div>
              <div className="table-action-menu-wrapper" ref={menuRef}>
                <button
                  className={`table-action-btn-icon menu ${openActionMenu ? 'active' : ''}`}
                  onClick={onOpenActionMenu}
                  title="Mais opções"
                  aria-label="Abrir menu de opções"
                  aria-expanded={openActionMenu}
                  aria-haspopup="true"
                >
                  <MoreVertical size={16} />
                </button>
                {openActionMenu && (
                  <div className="action-menu-dropdown" role="menu" aria-label="Menu de ações">
                    <button 
                      className="action-menu-item"
                      onClick={onViewMeters}
                      role="menuitem"
                      aria-label="Ver medidores do usuário"
                    >
                      <Zap size={16} />
                      <span>Ver Medidores</span>
                    </button>
                    <button 
                      className="action-menu-item"
                      onClick={onTogglePassword}
                      role="menuitem"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      <span>{showPassword ? 'Ocultar' : 'Mostrar'} Senha</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default UserTableRow;
