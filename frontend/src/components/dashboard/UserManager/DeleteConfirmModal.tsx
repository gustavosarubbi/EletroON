import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isBulk?: boolean;
  count?: number;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isBulk = false,
  count = 1,
}) => {
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div 
        className="modal-content-modern delete-confirm-modal" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header-modern">
          <div className="modal-header-content">
            <div className="modal-icon-wrapper delete">
              <AlertTriangle size={24} />
            </div>
            <h3>{title}</h3>
          </div>
          <button className="modal-close-btn" onClick={onCancel} aria-label="Fechar modal">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body-modern">
          <p className="delete-confirm-message">{message}</p>
          {isBulk && count > 0 && (
            <div className="delete-count-badge">
              <Trash2 size={16} />
              <span>{count} usuário(s) serão excluído(s)</span>
            </div>
          )}
          <div className="delete-warning">
            <AlertTriangle size={16} />
            <span>Esta ação não pode ser desfeita.</span>
          </div>
        </div>

        <div className="modal-footer-modern">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            <X size={14} />
            <span>Cancelar</span>
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={onConfirm}
          >
            <Trash2 size={14} />
            <span>Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;


