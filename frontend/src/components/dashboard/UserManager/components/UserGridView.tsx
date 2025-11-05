import React from 'react';
import { Search, CheckSquare, Square, List } from 'lucide-react';
import { UserData } from '../types';
import UserCard from '../UserCard';
import Pagination from './Pagination';

interface UserGridViewProps {
  users: UserData[];
  selectedUsers: number[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  editingUserId: number | null;
  showPasswords: { [key: number]: boolean };
  editData: { [key: number]: { email: string; password: string } };
  onSelectAll: () => void;
  onSelectUser: (userId: number) => void;
  onEditUser: (userId: number) => void;
  onSaveUser: (userId: number) => void;
  onCancelEdit: () => void;
  onDeleteUser: (userId: number) => void;
  onTogglePassword: (userId: number) => void;
  onViewMeters: (userId: number) => void;
  onEditChange: (userId: number, data: { email: string; password: string }) => void;
  onPageChange: (page: number) => void;
}

const UserGridView: React.FC<UserGridViewProps> = ({
  users,
  selectedUsers,
  currentPage,
  totalPages,
  totalItems,
  editingUserId,
  showPasswords,
  editData,
  onSelectAll,
  onSelectUser,
  onEditUser,
  onSaveUser,
  onCancelEdit,
  onDeleteUser,
  onTogglePassword,
  onViewMeters,
  onEditChange,
  onPageChange,
}) => {
  if (users.length === 0) {
    return (
      <div className="empty-state">
        <Search size={64} />
        <h4>Nenhum usuário encontrado</h4>
        <p>Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  const allSelected = selectedUsers.length === users.length && users.length > 0;
  const someSelected = selectedUsers.length > 0 && selectedUsers.length < users.length;

  return (
    <>
      {/* Botão de Selecionar Todos */}
      <div className="grid-select-all-container">
        <button 
          className={`grid-select-all-btn ${allSelected ? 'checked' : ''} ${someSelected ? 'partial' : ''}`}
          onClick={onSelectAll}
          title={allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
          aria-label={allSelected ? 'Desmarcar todos os usuários' : 'Selecionar todos os usuários'}
          aria-pressed={allSelected}
        >
          <List size={16} />
          {allSelected ? (
            <>
              <CheckSquare size={18} />
              <span>Todos Selecionados ({selectedUsers.length})</span>
            </>
          ) : (
            <>
              <Square size={18} />
              <span>Selecionar Todos</span>
            </>
          )}
        </button>
      </div>

      <div className="users-grid-modern">
        {users.map(user => (
          <UserCard
            key={user.id}
            user={user}
            isSelected={selectedUsers.includes(user.id)}
            isEditing={editingUserId === user.id}
            editData={editData[user.id]}
            showPassword={showPasswords[user.id] || false}
            onSelect={() => onSelectUser(user.id)}
            onEditChange={(data) => onEditChange(user.id, data)}
            onSave={() => onSaveUser(user.id)}
            onCancel={onCancelEdit}
            onEdit={() => onEditUser(user.id)}
            onDelete={() => onDeleteUser(user.id)}
            onTogglePassword={() => onTogglePassword(user.id)}
            onViewMeters={() => onViewMeters(user.id)}
          />
        ))}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </>
  );
};

export default UserGridView;
