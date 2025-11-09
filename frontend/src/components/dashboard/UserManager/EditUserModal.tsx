import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Save } from 'lucide-react';
import { UserData, EditUserData } from './types';

interface EditUserModalProps {
  user: UserData;
  onSave: (data: EditUserData) => void;
  onClose: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState<EditUserData>({
    email: user.email,
    password: ''
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
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

