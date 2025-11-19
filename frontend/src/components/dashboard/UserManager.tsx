import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Edit3, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Plus,
  Trash2,
  Clock,
  Zap,
  Wifi,
  WifiOff,
  MapPin,
  Loader2,
  AlertCircle,
  Search,
  SlidersHorizontal,
  UsersRound,
  UserCog,
  Shield,
  CheckCircle2,
  MoreVertical,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Download,
  CheckSquare,
  Square,
  RefreshCw,
  FileText
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import '../../styles/components/UserManager.css';

interface UserData {
  id: number;
  email: string;
  password?: string;
  role: string;
  createdAt: string;
  devices: Array<{
    meterId: number;
    name: string;
    location?: string;
    status: 'ONLINE' | 'OFFLINE';
    lastReadingAt?: string;
    lastReading?: {
      timestamp: string;
      qt: number;
    };
  }>;
}

interface NewUserForm {
  email: string;
  password: string;
  role: string;
}

interface EditUserData {
  email: string;
  password: string;
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMeterManagement, setShowMeterManagement] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  
  // Novos estados para funcionalidades modernas
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof UserData | 'devices'; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  
  const [newUser, setNewUser] = useState<NewUserForm>({ 
    email: '', 
    password: '', 
    role: 'user' 
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
        [userId]: { email: user.email, password: '' }
      });
      setEditingUserId(userId);
    }
  };

  const handleSaveUser = (userId: number) => {
    const form = editData[userId];
    if (form && form.email) {
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, email: form.email, password: form.password || user.password }
          : user
      ));
      const newEditData = { ...editData };
      delete newEditData[userId];
      setEditData(newEditData);
      setEditingUserId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      setUsers(users.filter(user => user.id !== userId));
      if (editingUserId === userId) {
        setEditingUserId(null);
      }
    }
  };

  const handleAddUser = () => {
    if (newUser.email && newUser.password) {
      const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
      const currentTime = new Date().toISOString().split('T')[0];
      
      setUsers([...users, { 
        id: newId, 
        email: newUser.email, 
        password: newUser.password,
        role: newUser.role,
        createdAt: currentTime,
        devices: []
      }]);
      setNewUser({ email: '', password: '', role: 'user' });
      setShowAddForm(false);
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
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  // Novas funções para funcionalidades modernas
  const handleSort = (key: keyof UserData | 'devices') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = React.useMemo(() => {
    let sortableUsers = [...filteredUsers];
    if (sortConfig) {
      sortableUsers.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'devices') {
          aValue = a.devices.length;
          bValue = b.devices.length;
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
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

  const paginatedUsers = React.useMemo(() => {
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
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selectedUsers.length} usuário(s)?`)) {
      setUsers(users.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
    }
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

  // Renderizar cabeçalho da tabela
  const renderTableHeader = () => (
    <thead>
      <tr>
        <th className="table-checkbox-column">
          <button 
            className="checkbox-header-btn"
            onClick={handleSelectAll}
            title="Selecionar todos"
          >
            {selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0 ? (
              <>
                <CheckSquare size={18} />
                <span>Selecionar todos</span>
              </>
            ) : (
              <>
                <Square size={18} />
                <span>Selecionar todos</span>
              </>
            )}
          </button>
        </th>
        <th 
          className="table-sortable"
          onClick={() => handleSort('email')}
        >
          <div className="sort-header">
            <span>Email</span>
            {sortConfig?.key === 'email' && (
              sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
            )}
          </div>
        </th>
        <th 
          className="table-sortable"
          onClick={() => handleSort('role')}
        >
          <div className="sort-header">
            <span>Tipo</span>
            {sortConfig?.key === 'role' && (
              sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
            )}
          </div>
        </th>
        <th 
          className="table-sortable"
          onClick={() => handleSort('devices')}
        >
          <div className="sort-header">
            <span>Medidores</span>
            {sortConfig?.key === 'devices' && (
              sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
            )}
          </div>
        </th>
        <th 
          className="table-sortable"
          onClick={() => handleSort('createdAt')}
        >
          <div className="sort-header">
            <span>Data de Criação</span>
            {sortConfig?.key === 'createdAt' && (
              sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
            )}
          </div>
        </th>
        <th className="table-actions-column">Ações</th>
      </tr>
    </thead>
  );


  // Renderizar linha da tabela
  const renderTableRow = (user: UserData) => {
    return (
      <tr 
        key={user.id}
        className={selectedUsers.includes(user.id) ? 'table-row-selected' : ''}
      >
        <td className="table-checkbox-column">
          <div className="table-cell-item">
            <button 
              className="checkbox-btn"
              onClick={() => handleSelectUser(user.id)}
            >
              {selectedUsers.includes(user.id) ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
            </button>
          </div>
        </td>
        <td>
          <div className="table-cell-item">
            <div className="table-cell-email">
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
          </div>
        </td>
        <td>
          <div className="table-cell-item">
            <div className={`role-badge-table ${user.role}`}>
              {user.role === 'admin' ? 'Administrador' : 'Usuário'}
            </div>
          </div>
        </td>
        <td>
          <div className="table-cell-item">
            {user.devices.length > 0 ? (
              <button
                className="table-cell-meters-btn"
                onClick={() => setSelectedUserId(user.id)}
                title="Ver medidores"
              >
                <Zap size={16} />
                <span>{user.devices.length}</span>
              </button>
            ) : (
              <div className="table-cell-meters">
                <Zap size={16} />
                <span>{user.devices.length}</span>
              </div>
            )}
          </div>
        </td>
        <td>
          <div className="table-cell-item">
            <div className="table-cell-date">
              <Clock size={16} />
              <span>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </td>
        <td>
          <div className="table-actions-cell">
            <div className="table-action-btn-wrapper">
              <button
                className="table-action-btn edit"
                onClick={() => handleEditUser(user.id)}
                title="Editar"
              >
                <Edit3 size={16} />
              </button>
            </div>
            <div className="table-action-divider"></div>
            <div className="table-action-btn-wrapper">
              <button
                className="table-action-btn delete"
                onClick={() => handleDeleteUser(user.id)}
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="table-action-divider"></div>
            <div className="table-action-menu">
              <button
                className="table-action-btn menu"
                onClick={() => setOpenActionMenu(openActionMenu === user.id ? null : user.id)}
                title="Mais opções"
              >
                <MoreVertical size={16} />
              </button>
              {openActionMenu === user.id && (
                <div className="action-menu-dropdown">
                  <button 
                    className="action-menu-item"
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setOpenActionMenu(null);
                    }}
                  >
                    <Zap size={16} />
                    <span>Ver Medidores</span>
                  </button>
                  <button 
                    className="action-menu-item"
                    onClick={() => {
                      togglePasswordVisibility(user.id);
                      setOpenActionMenu(null);
                    }}
                  >
                    {showPasswords[user.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{showPasswords[user.id] ? 'Ocultar' : 'Mostrar'} Senha</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="user-manager-container">
        <div className="user-manager-loading">
          <Loader2 className="spinner-icon" size={56} />
          <p>Carregando usuários...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (hasError) {
    return (
      <div className="user-manager-container">
        <div className="user-manager-error">
          <AlertCircle className="error-icon" size={64} />
          <h3>Erro ao carregar usuários</h3>
          <p>Não foi possível conectar com a API.</p>
          <p className="error-detail">Verifique se a API está rodando em <code>http://localhost:3000</code></p>
          <button className="retry-btn" onClick={loadUsersData}>
            <Loader2 size={18} />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Variáveis calculadas
  const regularUsers = users.filter(user => user.role !== 'admin');
  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="user-manager-container">
      {/* Header com Estatísticas */}
      <div className="user-manager-header">
        <div className="header-stats">
          <div className="stat-card users-card">
            <div className="stat-header">
              <div className="stat-title-container">
                <div className="status-indicator users"></div>
                <div className="stat-title">Total de Usuários</div>
              </div>
              <div className="stat-icon users">
                <UsersRound size={24} />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Usuários cadastrados</div>
              <div className="stat-progress">
                <div className="stat-progress-bar users" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
          <div className="stat-card admins-card">
            <div className="stat-header">
              <div className="stat-title-container">
                <div className="status-indicator admins"></div>
                <div className="stat-title">Administradores</div>
              </div>
              <div className="stat-icon admins">
                <Shield size={24} />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{users.filter(u => u.role === 'admin').length}</div>
              <div className="stat-label">Usuários administrativos</div>
              <div className="stat-progress">
                <div className="stat-progress-bar admins" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
          <div className="stat-card regular-card">
            <div className="stat-header">
              <div className="stat-title-container">
                <div className="status-indicator regular"></div>
                <div className="stat-title">Usuários Regulares</div>
              </div>
              <div className="stat-icon regular">
                <UserCog size={24} />
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-value">{regularUsers.length}</div>
              <div className="stat-label">Usuários comuns</div>
              <div className="stat-progress">
                <div className="stat-progress-bar regular" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar Moderna */}
        <div className="toolbar-modern">
          <div className="toolbar-left">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar por email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-container">
              <SlidersHorizontal className="filter-icon" size={18} />
              <select 
                className="filter-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as 'all' | 'admin' | 'user')}
              >
                <option value="all">Todos</option>
                <option value="admin">Administradores</option>
                <option value="user">Usuários</option>
              </select>
            </div>
          </div>

          <div className="toolbar-right">
            {selectedUsers.length > 0 && (
              <div className="bulk-actions-bar">
                <span className="bulk-selection-count">
                  {selectedUsers.length} selecionado(s)
                </span>
                <button 
                  className="bulk-action-btn delete"
                  onClick={handleBulkDelete}
                >
                  <Trash2 size={16} />
                  <span>Excluir</span>
                </button>
                <button 
                  className="bulk-action-btn clear"
                  onClick={() => setSelectedUsers([])}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            <div className="view-mode-toggle-switch">
              <input
                type="checkbox"
                id="view-mode-toggle"
                checked={viewMode === 'table'}
                onChange={(e) => setViewMode(e.target.checked ? 'table' : 'grid')}
                className="toggle-input"
              />
              <label htmlFor="view-mode-toggle" className="toggle-label">
                <span className="toggle-slider">
                  {viewMode === 'grid' ? <LayoutGrid size={14} /> : <List size={14} />}
                </span>
              </label>
            </div>

            <div className="export-menu">
              <button className="toolbar-btn secondary">
                <Download size={18} />
                <span>Exportar</span>
                <ChevronDown size={16} />
              </button>
              <div className="export-dropdown">
                <button className="export-option" onClick={() => handleExport('csv')}>
                  <FileText size={16} />
                  <span>Exportar como CSV</span>
                </button>
                <button className="export-option" onClick={() => handleExport('json')}>
                  <FileText size={16} />
                  <span>Exportar como JSON</span>
                </button>
              </div>
            </div>

            <button 
              className="toolbar-btn secondary"
              onClick={loadUsersData}
              title="Atualizar"
            >
              <RefreshCw size={18} />
            </button>

                          <button 
                className="action-btn manage-meters"
                onClick={() => setShowMeterManagement(!showMeterManagement)}
              >
                <span>Gerenciar Medidores</span>
              </button>

            <button 
              className="action-btn add-user"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setShowMeterManagement(false);
              }}
            >
              <Plus size={18} />
              <span>Adicionar Usuário</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formulário Adicionar Usuário */}
      {showAddForm && (
        <div className="add-user-card">
          <div className="card-header">
            <h3>Novo Usuário</h3>
            <button className="close-btn" onClick={() => setShowAddForm(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label>
                  <Mail size={16} />
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@exemplo.com"
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
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Digite a senha"
                />
              </div>
            </div>
            <div className="form-group">
              <label>
                <User size={16} />
                Tipo de Usuário
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="user">Usuário Regular</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={handleAddUser}>
                <CheckCircle2 size={18} />
                <span>Salvar Usuário</span>
              </button>
              <button className="btn-secondary" onClick={() => setShowAddForm(false)}>
                <X size={18} />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seção de Gerenciamento de Medidores */}
      {showMeterManagement && !showAddForm && (
        <div className="meter-management-card">
          <div className="card-header">
            <h3>Gerenciamento de Medidores</h3>
            <button className="close-btn" onClick={() => setShowMeterManagement(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="card-body">
            {regularUsers.length > 0 ? (
              <div className="meter-users-grid">
                {regularUsers.map(user => (
                  <div key={user.id} className="meter-user-card">
                    <div className="user-card-header">
                      <div className="user-avatar">
                        <User size={20} />
                      </div>
                      <div className="user-info">
                        <div className="user-email">{user.email}</div>
                        <div className="user-badge">Usuário Regular</div>
                      </div>
                    </div>
                    
                    <div className="meters-section">
                      <div className="section-title">
                        <Zap size={16} />
                        <span>Medidores Associados ({user.devices.length})</span>
                      </div>
                      <div className="meters-list">
                        {user.devices.length > 0 ? (
                          user.devices.map(device => (
                            <div key={device.meterId} className="meter-item">
                              <div className="meter-info">
                                <div className="meter-name">{device.name}</div>
                                <div className="meter-location">
                                  <MapPin size={12} />
                                  {device.location}
                                </div>
                                <div className={`meter-status-badge ${device.status.toLowerCase()}`}>
                                  {device.status === 'ONLINE' ? <Wifi size={12} /> : <WifiOff size={12} />}
                                  {device.status}
                                </div>
                              </div>
                              <button
                                className="remove-meter-btn"
                                onClick={() => handleDisassociateMeter(user.id, device.meterId)}
                                title="Remover medidor"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="empty-meters">Nenhum medidor associado</div>
                        )}
                      </div>
                      
                      <div className="available-meters-section">
                        <div className="section-title">
                          <Plus size={16} />
                          <span>Medidores Disponíveis</span>
                        </div>
                        <div className="available-meters-grid">
                          {[401, 402, 403, 404, 405].filter(id => 
                            !user.devices.some(d => d.meterId === id)
                          ).map(meterId => (
                            <button
                              key={meterId}
                              className="available-meter-btn"
                              onClick={() => handleAssociateMeter(user.id, meterId)}
                            >
                              <Zap size={14} />
                              <span>Medidor {meterId}</span>
                              <Plus size={14} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <UsersRound size={64} />
                <h4>Nenhum usuário regular encontrado</h4>
                <p>Adicione usuários regulares para gerenciar seus medidores</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de Usuários - Vista em Grid */}
      {!showAddForm && !showMeterManagement && viewMode === 'grid' && (
        <div className="users-grid">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div key={user.id} className="user-card-modern">
                <div className="user-card-header-modern">
                  <div className="user-avatar-modern">
                    <User size={24} />
                  </div>
                  <div className="user-info-modern">
                    <div className="user-email-modern">
                      <Mail size={16} />
                      <span>{user.email}</span>
                    </div>
                    <div className={`role-badge-modern ${user.role}`}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </div>
                  </div>
                </div>

                {editingUserId === user.id ? (
                  <div className="edit-form-modern">
                    <div className="form-group-modern">
                      <label>
                        <Mail size={14} />
                        Email
                      </label>
                      <input
                        type="email"
                        value={editData[user.id]?.email || user.email}
                        onChange={(e) => setEditData({
                          ...editData,
                          [user.id]: { ...(editData[user.id] || { email: user.email, password: '' }), email: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-group-modern">
                      <label>
                        <Lock size={14} />
                        Nova Senha (opcional)
                      </label>
                      <input
                        type="password"
                        placeholder="Deixe em branco para manter a atual"
                        value={editData[user.id]?.password || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          [user.id]: { ...(editData[user.id] || { email: user.email, password: '' }), password: e.target.value }
                        })}
                      />
                    </div>
                    <div className="edit-actions-modern">
                      <button className="btn-save" onClick={() => handleSaveUser(user.id)}>
                        <Save size={16} />
                        <span>Salvar</span>
                      </button>
                      <button className="btn-cancel" onClick={handleCancelEdit}>
                        <X size={16} />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="user-details-modern">
                      <div className="detail-item">
                        <Lock size={14} />
                        <span className="detail-label">Senha:</span>
                        <span className="detail-value">
                          {showPasswords[user.id] ? (user.password || 'N/A') : '********'}
                        </span>
                        <button
                          className="toggle-password-modern"
                          onClick={() => togglePasswordVisibility(user.id)}
                        >
                          {showPasswords[user.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <div className="detail-item">
                        <Zap size={14} />
                        <span className="detail-label">Medidores:</span>
                        <span className="detail-value">{user.devices.length}</span>
                      </div>
                      <div className="detail-item">
                        <Clock size={14} />
                        <span className="detail-label">Criado em:</span>
                        <span className="detail-value">
                          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="user-actions-modern">
                      <button
                        className="action-btn-modern edit"
                        onClick={() => handleEditUser(user.id)}
                      >
                        <Edit3 size={16} />
                        <span>Editar</span>
                      </button>
                      <button
                        className="action-btn-modern delete"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 size={16} />
                        <span>Excluir</span>
                      </button>
                      {user.devices.length > 0 && (
                        <button
                          className="action-btn-modern view-meters"
                          onClick={() => setSelectedUserId(selectedUserId === user.id ? null : user.id)}
                        >
                          <Zap size={16} />
                          <span>Medidores ({user.devices.length})</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Search size={64} />
              <h4>Nenhum usuário encontrado</h4>
              <p>Tente ajustar os filtros de busca</p>
            </div>
          )}
        </div>
      )}

      {/* Lista de Usuários - Vista em Tabela */}
      {!showAddForm && !showMeterManagement && viewMode === 'table' && (
        <div className="table-container-modern">
          <table className="users-table-modern">
            {renderTableHeader()}
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map(user => renderTableRow(user))
              ) : (
                <tr>
                  <td colSpan={5} className="table-empty">
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

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="pagination-modern">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronDown size={18} style={{ transform: 'rotate(90deg)' }} />
              </button>
              
              <div className="pagination-info">
                Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                <span className="pagination-total">({sortedUsers.length} usuários)</span>
              </div>

              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronDown size={18} style={{ transform: 'rotate(-90deg)' }} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Medidores */}
      {selectedUserId && selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUserId(null)}>
          <div className="modal-content-modern" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <h3>
                <Zap size={22} />
                <span>Medidores de {selectedUser.email}</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setSelectedUserId(null)} title="Fechar">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body-modern">
              {selectedUser.devices.length > 0 ? (
                <>
                  {/* Seção de Números dos Medidores */}
                  <div className="meters-numbers-section">
                    <div className="meters-numbers-header">
                      <Zap size={18} />
                      <span>Números dos Medidores ({selectedUser.devices.length})</span>
                    </div>
                    <div className="meters-numbers-grid">
                      {selectedUser.devices.map(device => (
                        <div key={device.meterId} className="meter-number-badge">
                          <span className="meter-number-value">{device.meterId}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lista Detalhada de Medidores */}
                  <div className="meters-list-modern">
                    <div className="meters-list-header">
                      <h4>Detalhes dos Medidores</h4>
                    </div>
                    {selectedUser.devices.map(device => (
                      <div key={device.meterId} className="meter-card-modern">
                        <div className="meter-header-modern">
                          <div className="meter-icon">
                            <Zap size={20} />
                          </div>
                          <div className="meter-title-modern">
                            <div className="meter-name-modern">
                              {device.name} <span className="meter-id-badge">#{device.meterId}</span>
                            </div>
                            <div className={`meter-status-modern ${device.status.toLowerCase()}`}>
                              {device.status === 'ONLINE' ? <Wifi size={14} /> : <WifiOff size={14} />}
                              {device.status}
                            </div>
                          </div>
                        </div>
                        <div className="meter-details-modern">
                          <div className="meter-detail-item">
                            <MapPin size={14} />
                            <span>{device.location || 'Localização não definida'}</span>
                          </div>
                          {device.lastReading && (
                            <div className="meter-detail-item">
                              <Clock size={14} />
                              <span>Última leitura: {new Date(device.lastReading.timestamp).toLocaleString('pt-BR')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <Zap size={64} />
                  <h4>Nenhum medidor associado</h4>
                  <p>Este usuário ainda não possui medidores associados.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;


