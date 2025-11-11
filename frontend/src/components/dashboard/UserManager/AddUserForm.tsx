import React, { useState } from 'react';
import { Mail, Lock, User, X, CheckCircle2, UserPlus, Building2, Plus, Trash2 } from 'lucide-react';
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
  const [newRoomInput, setNewRoomInput] = useState('');

  const handleAddRoom = () => {
    if (newRoomInput.trim() && !newUser.rooms?.includes(newRoomInput.trim())) {
      onUserChange({
        ...newUser,
        rooms: [...(newUser.rooms || []), newRoomInput.trim()]
      });
      setNewRoomInput('');
    }
  };

  const handleRemoveRoom = (index: number) => {
    const updatedRooms = [...(newUser.rooms || [])];
    updatedRooms.splice(index, 1);
    onUserChange({
      ...newUser,
      rooms: updatedRooms
    });
  };

  const handleRoomInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRoom();
    }
  };

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
        {newUser.role === 'user' && (
          <div className="form-group">
            <label>
              <Building2 size={16} />
              Salas {newUser.role === 'user' && <span className="required-asterisk">*</span>}
            </label>
            <div className="rooms-input-container">
              <div className="rooms-input-wrapper">
                <input
                  type="text"
                  value={newRoomInput}
                  onChange={(e) => setNewRoomInput(e.target.value)}
                  onKeyPress={handleRoomInputKeyPress}
                  placeholder="Digite o nome da sala e pressione Enter"
                  disabled={newUser.role !== 'user'}
                />
                <button
                  type="button"
                  className="btn-add-room"
                  onClick={handleAddRoom}
                  disabled={!newRoomInput.trim() || newUser.rooms?.includes(newRoomInput.trim())}
                  title="Adicionar sala"
                >
                  <Plus size={16} />
                </button>
              </div>
              {newUser.rooms && newUser.rooms.length > 0 && (
                <div className="rooms-list">
                  {newUser.rooms.map((room, index) => (
                    <div key={index} className="room-tag">
                      <Building2 size={14} />
                      <span>{room}</span>
                      <button
                        type="button"
                        className="btn-remove-room"
                        onClick={() => handleRemoveRoom(index)}
                        title="Remover sala"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <small className="form-hint">
              Adicione uma ou mais salas. Pelo menos uma sala é obrigatória para usuários regulares.
              As salas serão associadas aos medidores deste usuário.
            </small>
          </div>
        )}
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
