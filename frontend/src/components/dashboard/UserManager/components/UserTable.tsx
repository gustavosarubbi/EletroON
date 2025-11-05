import React from 'react';
import { Search } from 'lucide-react';
import { UserData, SortConfig, SortKey } from '../types';
import UserTableHeader from './UserTableHeader';
import UserTableRow from './UserTableRow';
import Pagination from './Pagination';

interface UserTableProps {
  users: UserData[];
  selectedUsers: number[];
  sortConfig: SortConfig | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  editingUserId: number | null;
  showPasswords: { [key: number]: boolean };
  editData: { [key: number]: { email: string; password: string } };
  onSort: (key: SortKey) => void;
  onSelectAll: () => void;
  onSelectUser: (userId: number) => void;
  onEditUser: (userId: number) => void;
  onSaveUser: (userId: number) => void;
  onCancelEdit: () => void;
  onDeleteUser: (userId: number) => void;
  onTogglePassword: (userId: number) => void;
  onEditChange: (userId: number, data: { email: string; password: string }) => void;
  onPageChange: (page: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUsers,
  sortConfig,
  currentPage,
  totalPages,
  totalItems,
  editingUserId,
  showPasswords,
  editData,
  onSort,
  onSelectAll,
  onSelectUser,
  onEditUser,
  onSaveUser,
  onCancelEdit,
  onDeleteUser,
  onTogglePassword,
  onEditChange,
  onPageChange,
}) => {
  return (
    <div className="table-container-modern">
      <table className="users-table-modern">
        <UserTableHeader
          selectedUsers={selectedUsers}
          usersCount={users.length}
          sortConfig={sortConfig}
          onSort={onSort}
          onSelectAll={onSelectAll}
        />
        <tbody>
          {users.length > 0 ? (
            users.map(user => (
              <UserTableRow
                key={user.id}
                user={user}
                isSelected={selectedUsers.includes(user.id)}
                isEditing={editingUserId === user.id}
                showPassword={showPasswords[user.id] || false}
                onSelect={() => onSelectUser(user.id)}
                onEdit={() => onEditUser(user.id)}
                onDelete={() => onDeleteUser(user.id)}
                onTogglePassword={() => onTogglePassword(user.id)}
              />
            ))
          ) : (
            <tr>
              <td colSpan={7} className="table-empty">
                <div className="empty-state">
                  <Search size={64} />
                  <h4>Nenhum usuário encontrado</h4>
                  <p>Tente ajustar os filtros de busca</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default UserTable;
