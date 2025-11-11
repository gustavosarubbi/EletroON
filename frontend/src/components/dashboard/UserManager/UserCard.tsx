import React, { useState } from 'react';
import { UsersRound, Mail, Lock, Edit3, Save, X, Eye, EyeOff, Trash2, Zap, Clock, CheckSquare, Square, Building2, Copy, Check } from 'lucide-react';
import { UserData, EditUserData } from './types';

interface UserCardProps {
  user: UserData;
  isSelected?: boolean;
  isEditing: boolean;
  editData?: EditUserData;
  showPassword: boolean;
  originalPassword?: string;
  onSelect?: () => void;
  onEditChange: (data: EditUserData) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePassword: () => void;
  onViewMeters: () => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  isSelected = false,
  isEditing,
  editData,
  showPassword,
  originalPassword,
  onSelect,
  onEditChange,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  onTogglePassword,
  onViewMeters,
}) => {
  const [copied, setCopied] = useState(false);
  // Usar senha original se disponível, caso contrário usar a senha do user (hasheada)
  const displayPassword = originalPassword || user.password || 'N/A';
  return (
    <div className={`user-card-modern ${isSelected ? 'card-selected' : ''}`}>
      {onSelect && (
        <button 
          className="card-checkbox-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          aria-label={isSelected ? 'Desmarcar usuário' : 'Selecionar usuário'}
          aria-pressed={isSelected}
        >
          {isSelected ? (
            <CheckSquare size={14} />
          ) : (
            <Square size={14} />
          )}
        </button>
      )}
      <div className="user-card-header-modern">
        <div className="user-avatar-modern">
          <UsersRound size={24} />
        </div>
        <div className="user-info-modern">
          <div className="user-email-modern">
            <Mail size={16} />
            <span>{user.email}</span>
          </div>
          <div className={`role-badge-modern ${user.role}`}>
            {user.role === 'admin' ? 'Administrador' : 'Usuário'}
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="edit-form-modern">
          <div className="form-group-modern">
            <label>
              <Mail size={14} />
              Email
            </label>
            <input
              type="email"
              value={editData?.email || user.email}
              onChange={(e) => onEditChange({ ...editData, email: e.target.value, password: editData?.password || '' })}
            />
          </div>
          <div className="form-group-modern">
            <label>
              <Lock size={14} />
              Nova Senha (opcional)
            </label>
            <input
              type="password"
              placeholder="Deixe em branco para manter a atual"
              value={editData?.password || ''}
              onChange={(e) => onEditChange({ ...editData, email: editData?.email || user.email, password: e.target.value })}
            />
          </div>
          <div className="edit-actions-modern">
            <button className="btn-save" onClick={onSave}>
              <Save size={16} />
              <span>Salvar</span>
            </button>
            <button className="btn-cancel" onClick={onCancel}>
              <X size={16} />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="user-details-modern">
            <div className="detail-item password-item">
              <Lock size={14} />
              <span className="detail-label">Senha:</span>
              <span className="detail-value password-value-card">
                {showPassword ? displayPassword : '********'}
              </span>
              {displayPassword && displayPassword !== 'N/A' && (
                <button
                  className="toggle-password-modern copy-password"
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
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
              <button className="toggle-password-modern" onClick={onTogglePassword}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {user.rooms && user.rooms.length > 0 && (
              <div className="detail-item">
                <Building2 size={14} />
                <span className="detail-label">Salas:</span>
                <div className="detail-value rooms-list-card" title={user.rooms.join(', ')}>
                  {user.rooms.length <= 3 ? (
                    user.rooms.map((room, index) => (
                      <span key={index} className="room-badge-card">{room}</span>
                    ))
                  ) : (
                    <>
                      {user.rooms.slice(0, 2).map((room, index) => (
                        <span key={index} className="room-badge-card">{room}</span>
                      ))}
                      <span className="room-badge-card-more" title={`Mais ${user.rooms.length - 2} sala${user.rooms.length - 2 > 1 ? 's' : ''}: ${user.rooms.slice(2).join(', ')}`}>
                        +{user.rooms.length - 2}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="detail-item">
              <Zap size={14} />
              <span className="detail-label">Medidores:</span>
              <span className="detail-value">{user.devices.length}</span>
            </div>
            <div className="detail-item">
              <Clock size={14} />
              <span className="detail-label">Criado em:</span>
              <span className="detail-value">
                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          <div className="user-actions-modern">
            <button className="action-btn-modern edit" onClick={onEdit}>
              <Edit3 size={16} />
              <span>Editar</span>
            </button>
            <button className="action-btn-modern delete" onClick={onDelete}>
              <Trash2 size={16} />
              <span>Excluir</span>
            </button>
            {user.devices.length > 0 && (
              <button className="action-btn-modern view-meters" onClick={onViewMeters}>
                <Zap size={16} />
                <span>Medidores ({user.devices.length})</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserCard;
