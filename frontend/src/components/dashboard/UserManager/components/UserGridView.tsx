import React from 'react';
import { Search } from 'lucide-react';
import { UserData } from '../types';
import UserCard from '../UserCard';

interface UserGridViewProps {
  users: UserData[];
  editingUserId: number | null;
  showPasswords: { [key: number]: boolean };
  editData: { [key: number]: { email: string; password: string } };
  onEditUser: (userId: number) => void;
  onSaveUser: (userId: number) => void;
  onCancelEdit: () => void;
  onDeleteUser: (userId: number) => void;
  onTogglePassword: (userId: number) => void;
  onViewMeters: (userId: number) => void;
  onEditChange: (userId: number, data: { email: string; password: string }) => void;
}

const UserGridView: React.FC<UserGridViewProps> = ({
  users,
  editingUserId,
  showPasswords,
  editData,
  onEditUser,
  onSaveUser,
  onCancelEdit,
  onDeleteUser,
  onTogglePassword,
  onViewMeters,
  onEditChange,
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

  return (
    <div className="users-grid-modern">
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          isEditing={editingUserId === user.id}
          editData={editData[user.id]}
          showPassword={showPasswords[user.id] || false}
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
  );
};

export default UserGridView;
