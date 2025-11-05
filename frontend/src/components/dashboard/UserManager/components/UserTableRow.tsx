import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Clock, Zap, Edit3, Trash2, Eye, EyeOff, CheckSquare, Square, X } from 'lucide-react';
import { UserData } from '../types';

interface UserTableRowProps {
  user: UserData;
  isSelected: boolean;
  isEditing: boolean;
  showPassword: boolean;
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
  onSelect,
  onEdit,
  onDelete,
  onTogglePassword,
}) => {
  const [passwordPopoverPosition, setPasswordPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const passwordButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (showPassword && passwordButtonRef.current) {
        const rect = passwordButtonRef.current.getBoundingClientRect();
        setPasswordPopoverPosition({
          top: rect.bottom + 8,
          left: rect.left
        });
      } else {
        setPasswordPopoverPosition(null);
      }
    };

    if (showPassword) {
      // Pequeno delay para garantir que o DOM está atualizado
      const timeoutId = setTimeout(updatePosition, 10);
      
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setPasswordPopoverPosition(null);
    }
  }, [showPassword]);

  useEffect(() => {
    if (showPassword && passwordPopoverPosition) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.password-popover') && !target.closest('.password-toggle')) {
          onTogglePassword();
        }
      };
      
      // Pequeno delay para evitar fechar imediatamente ao abrir
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPassword, passwordPopoverPosition, onTogglePassword]);

  const popoverContent = showPassword && passwordPopoverPosition ? (
    <div
      className="password-popover"
      style={{
        position: 'fixed',
        top: `${passwordPopoverPosition.top}px`,
        left: `${passwordPopoverPosition.left}px`,
        zIndex: 10000,
      }}
    >
      <div className="password-popover-content">
        <div className="password-popover-header">
          <span>Senha do Usuário</span>
          <button
            className="password-popover-close"
            onClick={onTogglePassword}
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>
        <div className="password-popover-body">
          <code className="password-value">{user.password || 'N/A'}</code>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
              <button
                ref={passwordButtonRef}
                className="table-action-btn-icon password-toggle"
                onClick={onTogglePassword}
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <span className="password-label">
                {showPassword ? 'Ocultar' : 'Mostrar'}
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
      {popoverContent && createPortal(popoverContent, document.body)}
    </>
  );
};

export default UserTableRow;
