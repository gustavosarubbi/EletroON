import React, { useState } from 'react';
import { Mail, Clock, Zap, Edit3, Trash2, Eye, EyeOff, CheckSquare, Square, Copy, Check } from 'lucide-react';
import { UserData } from '../types';

interface UserTableRowProps {
  user: UserData;
  isSelected: boolean;
  isEditing: boolean;
  showPassword: boolean;
  originalPassword?: string;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePassword: () => void;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  isSelected,
  isEditing,
  showPassword,
  originalPassword,
  onSelect,
  onEdit,
  onDelete,
  onTogglePassword,
}) => {
  const [copied, setCopied] = useState(false);
  // Usar senha original se disponível, caso contrário usar a senha do user (hasheada)
  const displayPassword = originalPassword || user.password || 'N/A';

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
        <td className="table-email-column">
          <div className="table-cell-item">
            <div className="table-cell-email">
              <Mail size={16} aria-hidden="true" />
              <span className="table-cell-text">{user.email}</span>
            </div>
          </div>
        </td>
        <td className="table-password-column">
          <div className="table-cell-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', minWidth: 0, width: '100%' }}>
              {displayPassword && displayPassword !== 'N/A' && (
                <button
                  className="table-action-btn-icon copy-password"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await navigator.clipboard.writeText(displayPassword);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch (error) {
                      console.error('Erro ao copiar senha:', error);
                    }
                  }}
                  title={copied ? 'Copiado!' : 'Copiar senha'}
                  aria-label="Copiar senha"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              )}
              <button
                className="table-action-btn-icon password-toggle"
                onClick={onTogglePassword}
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <span className="password-label">
                {showPassword ? displayPassword : 'Mostrar'}
              </span>
            </div>
          </div>
        </td>
      <td className="table-role-column">
        <div className="table-cell-item">
          <div className={`role-badge-table ${user.role}`} role="status" aria-label={`Tipo: ${user.role === 'admin' ? 'Administrador' : 'Usuário'}`}>
            {user.role === 'admin' ? 'Administrador' : 'Usuário'}
          </div>
        </div>
      </td>
      <td className="table-room-column">
        <div className="table-cell-item">
          {user.rooms && user.rooms.length > 0 ? (
            <div className="table-cell-rooms" title={user.rooms.join(', ')}>
              <div className="rooms-badges">
                {user.rooms.length === 1 ? (
                  <span className="room-badge">{user.rooms[0]}</span>
                ) : (
                  <>
                    <span className="room-badge">{user.rooms[0]}</span>
                    <span className="room-badge-more" title={`Mais ${user.rooms.length - 1} sala${user.rooms.length - 1 > 1 ? 's' : ''}: ${user.rooms.slice(1).join(', ')}`}>
                      +{user.rooms.length - 1}
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <span className="table-cell-empty">—</span>
          )}
        </div>
      </td>
      <td className="table-devices-column">
        <div className="table-cell-item">
          <div className="table-cell-meters" title={`${user.devices.length} medidor(es) associado(s)`}>
            <Zap size={16} aria-hidden="true" />
            <span className="table-cell-text">{user.devices.length}</span>
          </div>
        </div>
      </td>
      <td className="table-date-column">
        <div className="table-cell-item">
          <div className="table-cell-date" title={new Date(user.createdAt).toLocaleString('pt-BR')}>
            <Clock size={16} aria-hidden="true" />
            <span className="table-cell-text">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </td>
      <td className="table-actions-column">
        <div className="table-actions-cell">
          <div className="table-actions-view-group">
            <button
              className="table-action-btn-icon edit"
              onClick={onEdit}
              title="Editar usuário"
              aria-label="Editar usuário"
            >
              <Edit3 size={14} />
            </button>
            <div className="table-action-divider"></div>
            <button
              className="table-action-btn-icon delete"
              onClick={onDelete}
              title="Excluir usuário"
              aria-label="Excluir usuário"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default UserTableRow;
