import React, { useCallback } from 'react';
import '../../../styles/components/UserManager.css';
import { useUserManager } from './hooks/useUserManager';
import { dashboardService } from '../../../services/dashboardService';
import UserStats from './UserStats';
import UserToolbar from './UserToolbar';
import AddUserForm from './AddUserForm';
import MetersModal from './MetersModal';
import EditUserModal from './EditUserModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import UserTable from './components/UserTable';
import UserGridView from './components/UserGridView';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';

const UserManager: React.FC = () => {
  const {
    // Estado
    users,
    loading,
    hasError,
    showAddForm,
    selectedUserId,
    editingUserId,
    showPasswords,
    searchQuery,
    filterRole,
    viewMode,
    selectedUsers,
    sortConfig,
    currentPage,
    totalPages,
    paginatedUsers,
    sortedUsers,
    selectedUser,
    newUser,
    editData,
    originalPasswords,
    deleteConfirm,
    // Handlers
    loadUsersData,
    handleEditUser,
    handleSaveUser,
    handleCancelEdit,
    handleDeleteUser,
    confirmDeleteUser,
    cancelDeleteUser,
    handleAddUser,
    handleSort,
    handleSelectUser,
    handleSelectAll,
    handleBulkDelete,
    confirmBulkDelete,
    handleExport,
    togglePasswordVisibility,
    // Setters
    setShowAddForm,
    setSelectedUserId,
    setEditingUserId,
    setSearchQuery,
    setFilterRole,
    setViewMode,
    setCurrentPage,
    setNewUser,
    setEditData,
    setSelectedUsers,
    setShowPasswords,
    setOriginalPasswords,
  } = useUserManager();

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  const handleEditChange = (userId: number, data: { email: string; password: string; rooms?: string[] }) => {
    setEditData({
      ...editData,
      [userId]: data
    });
  };

  // Memoizar função de fechar modal para evitar recriações
  const handleCloseModal = useCallback(() => {
    setEditingUserId(null);
  }, [setEditingUserId]);

  // Memoizar função de salvar para evitar recriações
  const handleSaveUserModal = useCallback(async (data: { email: string; password: string; rooms?: string[] }) => {
    const currentEditingUserId = editingUserId;
    if (!currentEditingUserId) return;
    
    try {
      // Se uma nova senha foi fornecida, armazenar a senha original antes de enviar
      if (data.password && data.password.trim() !== '') {
        setOriginalPasswords(prev => ({
          ...prev,
          [currentEditingUserId]: data.password
        }));
      }
      // Salvar usando os dados passados diretamente
      await dashboardService.updateUser(currentEditingUserId, data.email, data.password, data.rooms);
      // Recarregar dados após atualização
      await loadUsersData();
      // Limpar editData usando função de atualização
      setEditData(prev => {
        const newEditData = { ...prev };
        delete newEditData[currentEditingUserId];
        return newEditData;
      });
      // FECHAR MODAL PRIMEIRO
      setEditingUserId(null);
      // Resetar o estado de visualização de senha para o usuário atualizado
      setShowPasswords(prev => {
        const newState = { ...prev };
        delete newState[currentEditingUserId];
        return newState;
      });
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      throw error;
    }
  }, [editingUserId, setEditData, setEditingUserId, setShowPasswords, setOriginalPasswords, loadUsersData]);

  if (loading) {
    return <LoadingState />;
  }

  if (hasError) {
    return <ErrorState onRetry={loadUsersData} />;
  }

  return (
    <div className="user-manager-container">
      {/* Header com Estatísticas */}
      <div className="user-manager-header">
        <UserStats users={users} />
      </div>

      {/* Toolbar */}
      {!showAddForm && (
        <UserToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterRole={filterRole}
          onFilterChange={setFilterRole}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedCount={selectedUsers.length}
          onBulkDelete={handleBulkDelete}
          onClearSelection={handleClearSelection}
          onRefresh={loadUsersData}
          onExport={handleExport}
          onAddUser={() => {
            setShowAddForm(true);
          }}
        />
      )}

      {/* Formulário Adicionar Usuário */}
      {showAddForm && (
        <AddUserForm
          newUser={newUser}
          onUserChange={setNewUser}
          onSave={handleAddUser}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Lista de Usuários - Vista em Tabela */}
      {!showAddForm && viewMode === 'table' && (
        <UserTable
          users={paginatedUsers}
          selectedUsers={selectedUsers}
          sortConfig={sortConfig}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedUsers.length}
          editingUserId={editingUserId}
          showPasswords={showPasswords}
          originalPasswords={originalPasswords}
          onSort={handleSort}
          onSelectAll={handleSelectAll}
          onSelectUser={handleSelectUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onTogglePassword={togglePasswordVisibility}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Lista de Usuários - Vista em Grid */}
      {!showAddForm && viewMode === 'grid' && (
        <UserGridView
          users={paginatedUsers}
          selectedUsers={selectedUsers}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedUsers.length}
          editingUserId={editingUserId}
          showPasswords={showPasswords}
          editData={editData}
          originalPasswords={originalPasswords}
          onSelectAll={handleSelectAll}
          onSelectUser={handleSelectUser}
          onEditUser={handleEditUser}
          onSaveUser={handleSaveUser}
          onCancelEdit={handleCancelEdit}
          onDeleteUser={handleDeleteUser}
          onTogglePassword={togglePasswordVisibility}
          onViewMeters={setSelectedUserId}
          onEditChange={handleEditChange}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modal de Medidores */}
      {selectedUserId && selectedUser && (
        <MetersModal
          user={selectedUser}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Modal de Edição de Usuário */}
      {editingUserId && (() => {
        const userToEdit = users.find(u => u.id === editingUserId);
        if (!userToEdit) return null;
        
        return (
          <EditUserModal
            key={editingUserId} // Forçar re-render quando editingUserId mudar
            user={userToEdit}
            onSave={handleSaveUserModal}
            onClose={handleCloseModal}
          />
        );
      })()}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirm.userId !== null && (
        (() => {
          const userToDelete = users.find(u => u.id === deleteConfirm.userId);
          return userToDelete ? (
            <DeleteConfirmModal
              isOpen={true}
              title="Excluir Usuário"
              message={`Tem certeza que deseja excluir o usuário "${userToDelete.email}"?`}
              onConfirm={confirmDeleteUser}
              onCancel={cancelDeleteUser}
              isBulk={false}
            />
          ) : null;
        })()
      )}

      {deleteConfirm.isBulk && selectedUsers.length > 0 && (
        <DeleteConfirmModal
          isOpen={true}
          title="Excluir Usuários"
          message={`Tem certeza que deseja excluir ${selectedUsers.length} usuário(s) selecionado(s)?`}
          onConfirm={confirmBulkDelete}
          onCancel={cancelDeleteUser}
          isBulk={true}
          count={selectedUsers.length}
        />
      )}
    </div>
  );
};

export default UserManager;
