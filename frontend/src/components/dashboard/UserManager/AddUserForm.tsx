import React from 'react';
import { Mail, Lock, User, X, CheckCircle2, UserPlus, Building2 } from 'lucide-react';
import { NewUserForm } from './types';

interface AddUserFormProps {
  newUser: NewUserForm;
  onUserChange: (user: NewUserForm) => void;
  onSave: () => void;
  onCancel: () => void;
}

const AddUserForm: React.FC<AddUserFormProps> = ({
  newUser,
  onUserChange,
  onSave,
  onCancel,
}) => {
  return (
    <div className="add-user-card">
      <div className="card-header">
        <h3>
          <UserPlus size={18} />
          Novo Usuário
        </h3>
        <button className="close-btn" onClick={onCancel}>
          <X size={20} />
        </button>
      </div>
      <div className="card-body">
        <div className="form-group">
          <label>
            <Mail size={16} />
            Email
          </label>
          <input
            type="email"
            value={newUser.email}
            onChange={(e) => onUserChange({ ...newUser, email: e.target.value })}
            placeholder="usuario@exemplo.com"
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label>
            <Lock size={16} />
            Senha
          </label>
          <input
            type="password"
            value={newUser.password}
            onChange={(e) => onUserChange({ ...newUser, password: e.target.value })}
            placeholder="Digite a senha"
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <label>
            <User size={16} />
            Tipo de Usuário
          </label>
          <select
            value={newUser.role}
            onChange={(e) => onUserChange({ ...newUser, role: e.target.value })}
          >
            <option value="user">Usuário Regular</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div className="form-group">
          <label>
            <Building2 size={16} />
            Sala {newUser.role === 'user' && <span className="required-asterisk">*</span>}
          </label>
          <input
            type="text"
            value={newUser.room || ''}
            onChange={(e) => onUserChange({ ...newUser, room: e.target.value })}
            placeholder="Ex: Sala 101, Laboratório A, etc."
            required={newUser.role === 'user'}
            disabled={newUser.role === 'admin'}
          />
          <small className="form-hint">
            {newUser.role === 'admin' 
              ? 'Administradores não precisam de sala associada'
              : 'A sala será associada a todos os medidores deste usuário. Obrigatório para usuários regulares.'}
          </small>
        </div>
        <div className="form-actions">
          <button className="btn-primary btn-save" onClick={onSave}>
            <CheckCircle2 size={18} />
            <span>Salvar Usuário</span>
          </button>
          <button className="btn-secondary btn-cancel" onClick={onCancel}>
            <X size={18} />
            <span>Cancelar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserForm;
