import React from 'react';
import '../../../styles/components/UserManager.css';
import { useUserManager } from './hooks/useUserManager';
import UserStats from './UserStats';
import UserToolbar from './UserToolbar';
import AddUserForm from './AddUserForm';
import MeterManagement from './MeterManagement';
import MetersModal from './MetersModal';
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
    showMeterManagement,
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
    regularUsers,
    selectedUser,
    newUser,
    editData,
    openActionMenu,
    // Handlers
    loadUsersData,
    handleEditUser,
    handleSaveUser,
    handleCancelEdit,
    handleDeleteUser,
    handleAddUser,
    handleAssociateMeter,
    handleDisassociateMeter,
    handleSort,
    handleSelectUser,
    handleSelectAll,
    handleBulkDelete,
    handleExport,
    togglePasswordVisibility,
    // Setters
    setShowAddForm,
    setShowMeterManagement,
    setSelectedUserId,
    setEditingUserId,
    setSearchQuery,
    setFilterRole,
    setViewMode,
    setCurrentPage,
    setNewUser,
    setEditData,
    setSelectedUsers,
    setOpenActionMenu,
  } = useUserManager();

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  const handleEditChange = (userId: number, data: { email: string; password: string }) => {
    setEditData({
      ...editData,
      [userId]: data
    });
  };

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
      {!showAddForm && !showMeterManagement && (
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
            setShowMeterManagement(false);
          }}
          onManageMeters={() => {
            setShowMeterManagement(true);
            setShowAddForm(false);
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

      {/* Gerenciamento de Medidores */}
      {showMeterManagement && (
        <MeterManagement
          regularUsers={regularUsers}
          onAssociateMeter={handleAssociateMeter}
          onDisassociateMeter={handleDisassociateMeter}
          onClose={() => setShowMeterManagement(false)}
        />
      )}

      {/* Lista de Usuários - Vista em Tabela */}
      {!showAddForm && !showMeterManagement && viewMode === 'table' && (
        <UserTable
          users={paginatedUsers}
          selectedUsers={selectedUsers}
          sortConfig={sortConfig}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedUsers.length}
          editingUserId={editingUserId}
          showPasswords={showPasswords}
          openActionMenu={openActionMenu}
          editData={editData}
          onSort={handleSort}
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
          onOpenActionMenu={setOpenActionMenu}
        />
      )}

      {/* Lista de Usuários - Vista em Grid */}
      {!showAddForm && !showMeterManagement && viewMode === 'grid' && (
        <UserGridView
          users={paginatedUsers}
          editingUserId={editingUserId}
          showPasswords={showPasswords}
          editData={editData}
          onEditUser={handleEditUser}
          onSaveUser={handleSaveUser}
          onCancelEdit={handleCancelEdit}
          onDeleteUser={handleDeleteUser}
          onTogglePassword={togglePasswordVisibility}
          onViewMeters={setSelectedUserId}
          onEditChange={handleEditChange}
        />
      )}

      {/* Modal de Medidores */}
      {selectedUserId && selectedUser && (
        <MetersModal
          user={selectedUser}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};

export default UserManager;
