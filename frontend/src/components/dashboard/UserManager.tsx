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
  Filter,
  Users as UsersIcon,
  CheckCircle2
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

  const regularUsers = users.filter(user => user.role !== 'admin');
  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="user-manager-container">
      {/* Header com Estatísticas */}
      <div className="user-manager-header">
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-icon users">
              <UsersIcon size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Total de Usuários</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon admins">
              <User size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{users.filter(u => u.role === 'admin').length}</div>
              <div className="stat-label">Administradores</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon regular">
              <UsersIcon size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{regularUsers.length}</div>
              <div className="stat-label">Usuários Regulares</div>
            </div>
          </div>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="header-controls">
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
            <Filter className="filter-icon" size={18} />
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

        {/* Botões de Ação */}
        <div className="header-actions">
          <button 
            className="action-btn manage-meters"
            onClick={() => setShowMeterManagement(!showMeterManagement)}
          >
            <Zap size={18} />
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
                <UsersIcon size={64} />
                <h4>Nenhum usuário regular encontrado</h4>
                <p>Adicione usuários regulares para gerenciar seus medidores</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de Usuários */}
      {!showAddForm && !showMeterManagement && (
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

      {/* Modal de Medidores */}
      {selectedUserId && selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUserId(null)}>
          <div className="modal-content-modern" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <h3>Medidores de {selectedUser.email}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedUserId(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body-modern">
              {selectedUser.devices.length > 0 ? (
                <div className="meters-list-modern">
                  {selectedUser.devices.map(device => (
                    <div key={device.meterId} className="meter-card-modern">
                      <div className="meter-header-modern">
                        <div className="meter-icon">
                          <Zap size={20} />
                        </div>
                        <div className="meter-title-modern">
                          <div className="meter-name-modern">{device.name}</div>
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
