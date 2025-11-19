import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Save, Building2, Plus, Trash2 } from 'lucide-react';
import { UserData, EditUserData } from './types';

interface EditUserModalProps {
  user: UserData;
  onSave: (data: EditUserData) => void;
  onClose: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState<EditUserData>({
    email: user.email,
    password: '',
    rooms: user.rooms || []
  });
  const [newRoomInput, setNewRoomInput] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atualizar formData quando o user prop mudar
  useEffect(() => {
    setFormData({
      email: user.email,
      password: '',
      rooms: user.rooms || []
    });
  }, [user.id, user.email, user.rooms]);

  const MIN_PASSWORD_LENGTH = 6;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (email: string): string | undefined => {
    if (!email || email.trim() === '') {
      return 'Email é obrigatório';
    }
    if (!EMAIL_REGEX.test(email)) {
      return 'Email inválido';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (password && password.trim() !== '') {
      if (password.length < MIN_PASSWORD_LENGTH) {
        return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`;
      }
    }
    return undefined;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    setErrors(prev => ({ ...prev, email: validateEmail(email) }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData(prev => ({ ...prev, password }));
    setErrors(prev => ({ ...prev, password: validatePassword(password) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(formData.email);
    const passwordError = formData.password ? validatePassword(formData.password) : undefined;

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      // O onSave fecha o modal através do setEditingUserId(null)
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      // Manter o modal aberto em caso de erro para o usuário poder tentar novamente
      // O isSubmitting será resetado no finally
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRoom = () => {
    if (newRoomInput.trim() && !formData.rooms?.includes(newRoomInput.trim())) {
      setFormData({
        ...formData,
        rooms: [...(formData.rooms || []), newRoomInput.trim()]
      });
      setNewRoomInput('');
    }
  };

  const handleRemoveRoom = (index: number) => {
    const updatedRooms = [...(formData.rooms || [])];
    updatedRooms.splice(index, 1);
    setFormData({
      ...formData,
      rooms: updatedRooms
    });
  };

  const handleRoomInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRoom();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isSubmitting) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, isSubmitting]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!isSubmitting && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div 
        className="modal-content-modern edit-user-modal" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header-modern">
          <h3>Editar Usuário</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar modal">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-user-form">
          <div className="modal-body-modern">
            <div className="form-group-modern">
              <label htmlFor="edit-email">
                <Mail size={14} />
                <span>Email</span>
              </label>
              <input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                className={errors.email ? 'input-error' : ''}
                placeholder="usuario@exemplo.com"
                autoFocus
                required
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group-modern">
              <label htmlFor="edit-password">
                <Lock size={14} />
                <span>Nova Senha</span>
                <span className="optional-label">(opcional)</span>
              </label>
              <input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={handlePasswordChange}
                className={errors.password ? 'input-error' : ''}
                placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                minLength={MIN_PASSWORD_LENGTH}
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
              {!errors.password && formData.password && (
                <span className="help-text">
                  {formData.password.length}/{MIN_PASSWORD_LENGTH} caracteres mínimos
                </span>
              )}
            </div>

            {(user.role?.toLowerCase() === 'user' || user.role === 'USER') && (
              <div className="form-group-modern">
                <label htmlFor="edit-rooms">
                  <Building2 size={14} />
                  <span>Salas</span>
                </label>
                <div className="rooms-input-container">
                  <div className="rooms-input-wrapper">
                    <input
                      id="edit-rooms"
                      type="text"
                      value={newRoomInput}
                      onChange={(e) => setNewRoomInput(e.target.value)}
                      onKeyPress={handleRoomInputKeyPress}
                      placeholder="Digite o nome da sala e pressione Enter"
                    />
                    <button
                      type="button"
                      className="btn-add-room"
                      onClick={handleAddRoom}
                      disabled={!newRoomInput.trim() || formData.rooms?.includes(newRoomInput.trim())}
                      title="Adicionar sala"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {formData.rooms && formData.rooms.length > 0 && (
                    <div className="rooms-list">
                      {formData.rooms.map((room, index) => (
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
                <span className="help-text">
                  Adicione ou remova salas. Ao alterar as salas, todos os medidores associados terão sua localização atualizada
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer-modern">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X size={14} />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={Boolean(isSubmitting || errors.email || (formData.password && errors.password))}
            >
              <Save size={14} />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;

