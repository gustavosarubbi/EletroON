import React from 'react';
import { UsersRound, Mail, Lock, Edit3, Save, X, Eye, EyeOff, Trash2, Zap, Clock, CheckSquare, Square } from 'lucide-react';
import { UserData, EditUserData } from './types';

interface UserCardProps {
  user: UserData;
  isSelected?: boolean;
  isEditing: boolean;
  editData?: EditUserData;
  showPassword: boolean;
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
  onSelect,
  onEditChange,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  onTogglePassword,
  onViewMeters,
}) => {
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
            <CheckSquare size={18} />
          ) : (
            <Square size={18} />
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
                {showPassword ? (user.password || 'N/A') : '********'}
              </span>
              <button className="toggle-password-modern" onClick={onTogglePassword}>
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
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
