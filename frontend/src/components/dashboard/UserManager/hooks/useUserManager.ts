import { useState, useEffect, useMemo } from 'react';
import { dashboardService } from '../../../../services/dashboardService';
import { UserData, NewUserForm, EditUserData, FilterRole, ViewMode, SortConfig, SortKey } from '../types';

export const useUserManager = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: number | null; isBulk: boolean }>({ userId: null, isBulk: false });
  const [newUser, setNewUser] = useState<NewUserForm>({ 
    email: '', 
    password: '', 
    role: 'user',
    room: ''
  });
  const [editData, setEditData] = useState<{ [key: number]: EditUserData }>({});

  // Carregar dados
  const loadUsersData = async () => {
    try {
      setLoading(true);
      setHasError(false);
      const usersData = await dashboardService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('❌ Erro ao carregar dados dos usuários:', error);
      setHasError(true);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersData();
  }, []);

  // Fechar menu de ações ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openActionMenu !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('.table-action-menu')) {
          setOpenActionMenu(null);
        }
      }
    };

    if (openActionMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openActionMenu]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole]);

  // Handlers
  const togglePasswordVisibility = (userId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleEditUser = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setEditData({
        ...editData,
        [userId]: { email: user.email, password: '', room: user.room || '' }
      });
      setEditingUserId(userId);
    }
  };

  const handleSaveUser = async (userId: number) => {
    const form = editData[userId];
    if (form && form.email) {
      try {
        await dashboardService.updateUser(userId, form.email, form.password, form.room);
        await loadUsersData(); // Recarregar dados após atualização
        const newEditData = { ...editData };
        delete newEditData[userId];
        setEditData(newEditData);
        setEditingUserId(null);
      } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        throw error;
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleDeleteUser = async (userId: number) => {
    setDeleteConfirm({ userId, isBulk: false });
  };

  const confirmDeleteUser = async () => {
    const userId = deleteConfirm.userId;
    if (userId !== null) {
      try {
        // Chamar API para deletar no backend
        await dashboardService.deleteUser(userId);
        // Atualizar estado local após sucesso
        setUsers(users.filter(user => user.id !== userId));
        if (editingUserId === userId) {
          setEditingUserId(null);
        }
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        // Recarregar dados em caso de erro para manter sincronização
        await loadUsersData();
      }
    }
    setDeleteConfirm({ userId: null, isBulk: false });
  };

  const cancelDeleteUser = () => {
    setDeleteConfirm({ userId: null, isBulk: false });
  };

  const handleAddUser = async () => {
    // Validar campos obrigatórios
    if (!newUser.email || !newUser.password) {
      return;
    }
    
    // Sala é obrigatória apenas para usuários regulares
    if (newUser.role === 'user' && !newUser.room?.trim()) {
      return;
    }
    
    try {
      await dashboardService.createUser(
        newUser.email,
        newUser.password,
        newUser.role === 'admin' ? 'ADMIN' : 'USER',
        newUser.role === 'admin' ? undefined : newUser.room
      );
      await loadUsersData(); // Recarregar dados após criação
      setNewUser({ email: '', password: '', role: 'user', room: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      throw error;
    }
  };

  const handleAssociateMeter = (userId: number, meterId: number) => {
    const newMeter = {
      meterId,
      name: `Medidor ${meterId}`,
      location: `Sala ${meterId}`,
      status: 'ONLINE' as const,
      lastReadingAt: new Date().toLocaleString('pt-BR'),
      lastReading: {
        timestamp: new Date().toLocaleString('pt-BR'),
        qt: Math.random() * 2000 + 500
      }
    };

    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, devices: [...user.devices, newMeter] }
        : user
    ));
  };

  const handleDisassociateMeter = (userId: number, meterId: number) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, devices: user.devices.filter(device => device.meterId !== meterId) }
        : user
    ));
  };

  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesFilter;
    });
  }, [users, searchQuery, filterRole]);

  // Ordenar usuários
  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = useMemo(() => {
    let sortableUsers = [...filteredUsers];
    if (sortConfig) {
      sortableUsers.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'devices') {
          aValue = a.devices.length;
          bValue = b.devices.length;
        } else if (sortConfig.key === 'room') {
          // Tratar room (pode ser null ou undefined)
          aValue = a.room || '';
          bValue = b.room || '';
        } else {
          aValue = a[sortConfig.key as keyof UserData];
          bValue = b[sortConfig.key as keyof UserData];
        }

        // Comparação para strings (case-insensitive)
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [filteredUsers, sortConfig]);

  // Paginar usuários
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    }
  };

  const handleBulkDelete = () => {
    setDeleteConfirm({ userId: null, isBulk: true });
  };

  const confirmBulkDelete = async () => {
    try {
      // Deletar todos os usuários selecionados no backend
      await Promise.all(selectedUsers.map(userId => dashboardService.deleteUser(userId)));
      // Atualizar estado local após sucesso
      setUsers(users.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
    } catch (error) {
      console.error('Erro ao deletar usuários:', error);
      // Recarregar dados em caso de erro para manter sincronização
      await loadUsersData();
    }
    setDeleteConfirm({ userId: null, isBulk: false });
  };

  const handleExport = (format: 'csv' | 'json') => {
    const data = filteredUsers.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      devicesCount: user.devices.length
    }));

    if (format === 'csv') {
      const headers = ['ID', 'Email', 'Role', 'Data de Criação', 'Medidores'];
      const csvContent = [
        headers.join(','),
        ...data.map(u => [u.id, u.email, u.role, u.createdAt, u.devicesCount].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `usuarios_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    }
  };

  const toggleRowExpand = (userId: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Variáveis calculadas
  const regularUsers = users.filter(user => user.role !== 'admin');
  const selectedUser = users.find(u => u.id === selectedUserId);

  return {
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
    itemsPerPage,
    totalPages,
    openActionMenu,
    showAdvancedFilters,
    expandedRows,
    newUser,
    editData,
    filteredUsers,
    sortedUsers,
    paginatedUsers,
    regularUsers,
    selectedUser,
    deleteConfirm,
    // Handlers
    loadUsersData,
    togglePasswordVisibility,
    handleEditUser,
    handleSaveUser,
    handleCancelEdit,
    handleDeleteUser,
    confirmDeleteUser,
    cancelDeleteUser,
    handleAddUser,
    handleAssociateMeter,
    handleDisassociateMeter,
    handleSort,
    handleSelectUser,
    handleSelectAll,
    handleBulkDelete,
    confirmBulkDelete,
    handleExport,
    toggleRowExpand,
    // Setters
    setShowAddForm,
    setSelectedUserId,
    setEditingUserId,
    setSearchQuery,
    setFilterRole,
    setViewMode,
    setCurrentPage,
    setOpenActionMenu,
    setShowAdvancedFilters,
    setNewUser,
    setEditData,
    setSelectedUsers,
  };
};
