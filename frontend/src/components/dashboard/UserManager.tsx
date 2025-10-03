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
  MapPin
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';

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
  isEditing?: boolean;
}

const UserManager: React.FC = () => {

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Carregar dados dos usuários
  const loadUsersData = async () => {
    try {
      setLoading(true);
      setHasError(false);
      console.log('Carregando dados dos usuários...');
      
      // Carregar dados reais da API
      const usersData = await dashboardService.getUsers();
      console.log('✅ Dados reais de usuários carregados:', usersData);
      setUsers(usersData);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados dos usuários:', error);
      setHasError(true);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadUsersData();
  }, []);
  
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMeterManagement, setShowMeterManagement] = useState(false);
  const [showUserMeters, setShowUserMeters] = useState<number | null>(null);

  const handleEditUser = (userId: number) => {
    setEditingUser(userId);
  };

  const handleSaveUser = (userId: number, newEmail: string, newPassword: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, email: newEmail, password: newPassword || user.password }
        : user
    ));
    setEditingUser(null);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleAddUser = () => {
    if (newUser.email && newUser.password) {
      const newId = Math.max(...users.map(u => u.id)) + 1;
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

  const togglePasswordVisibility = (userId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleShowUserMeters = (userId: number) => {
    setShowUserMeters(showUserMeters === userId ? null : userId);
  };


  const handleAssociateMeter = (userId: number, meterId: number) => {
    // Simular associação de medidor
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

  if (loading) {
    return (
      <div className="user-manager">
        <div className="user-manager-header">
          <h2>Gerenciamento de Usuários</h2>
        </div>
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Carregando dados dos usuários...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="user-manager">
        <div className="user-manager-header">
          <h2>Gerenciamento de Usuários</h2>
        </div>
        <div className="error-message">
          <div className="error-content">
            <h3>❌ Erro ao carregar usuários</h3>
            <p>Não foi possível conectar com a API.</p>
            <p>Verifique se a API está rodando em <code>http://localhost:3000</code></p>
            <button 
              className="retry-btn"
              onClick={loadUsersData}
            >
              🔄 Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-manager">
      <div className="user-manager-header">
        <h2>Gerenciamento de Usuários</h2>
        <div className="header-actions">
          <button 
            className="manage-meters-btn"
            onClick={() => setShowMeterManagement(!showMeterManagement)}
          >
            <Zap size={16} />
            Gerenciar Medidores
          </button>
          <button 
            className="add-user-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={16} />
            Adicionar Usuário
          </button>
        </div>
      </div>

      {/* Formulário para adicionar usuário */}
      {showAddForm ? (
        <div className="add-user-form">
          <h3>Adicionar Novo Usuário</h3>
          <div className="form-group">
            <label>
              <Mail size={16} />
              Email
            </label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="Digite o email do usuário"
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
          <div className="form-actions">
            <button className="save-btn" onClick={handleAddUser}>
              <Save size={16} />
              Salvar
            </button>
            <button className="cancel-btn" onClick={() => setShowAddForm(false)}>
              <X size={16} />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>

      {/* Seção de Gerenciamento de Medidores */}
      {showMeterManagement && (
        <div className="meter-management-section">
          <h3>Gerenciamento de Medidores</h3>
          {users.filter(user => user.role !== 'admin').length > 0 ? (
            <div className="meter-management-grid">
              {users.filter(user => user.role !== 'admin').map(user => (
              <div key={user.id} className="user-meter-card">
                <div className="user-info-header">
                  <div className="user-avatar-small">
                    <User size={16} />
                  </div>
                  <div className="user-info">
                    <div className="user-email">{user.email}</div>
                    <div className="user-role-badge">
                      Usuário
                    </div>
                  </div>
                </div>
                
                <div className="meters-section">
                  <h4>Medidores Associados ({user.devices.length})</h4>
                  <div className="meters-table">
                    {user.devices.map(device => (
                      <div key={device.meterId} className="meter-row">
                        <div className="meter-info">
                          <div className="meter-name">
                            <Zap size={14} />
                            <span>{device.name}</span>
                          </div>
                          <div className="meter-location">
                            <MapPin size={12} />
                            <span>{device.location}</span>
                          </div>
                          <div className={`meter-status ${device.status.toLowerCase()}`}>
                            {device.status === 'ONLINE' ? <Wifi size={12} /> : <WifiOff size={12} />}
                            <span>{device.status === 'ONLINE' ? 'Online' : 'Offline'}</span>
                          </div>
                        </div>
                        <div className="meter-reading">
                          {device.lastReading && (
                            <div className="reading-info">
                              <div className="reading-time">
                                {new Date(device.lastReading.timestamp).toLocaleString('pt-BR')}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="meter-actions">
                          <button
                            className="disassociate-btn"
                            onClick={() => handleDisassociateMeter(user.id, device.meterId)}
                            title="Desassociar medidor"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="available-meters">
                    <h5>Medidores Disponíveis</h5>
                    <div className="available-meters-list">
                      {[401, 402, 403, 404, 405].map(meterId => (
                        <div key={meterId} className="available-meter">
                          <div className="meter-id">Medidor {meterId}</div>
                          <button
                            className="associate-btn"
                            onClick={() => handleAssociateMeter(user.id, meterId)}
                          >
                            <Plus size={12} />
                            Associar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <div className="no-users-message">
              <User size={48} />
              <h4>Nenhum usuário regular encontrado</h4>
              <p>Adicione usuários regulares para gerenciar seus medidores</p>
            </div>
          )}
        </div>
      )}

      {/* Lista de usuários */}
      <div className="users-list">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <div className="user-header">
              <div className="user-avatar">
                <User size={20} />
              </div>
              <div className="user-basic-info">
                {editingUser === user.id ? (
                  <div className="edit-form">
                    <div className="form-group">
                      <label>
                        <Mail size={14} />
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue={user.email}
                        id={`email-${user.id}`}
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        <Lock size={14} />
                        Nova Senha
                      </label>
                      <input
                        type="password"
                        placeholder="Digite a nova senha"
                        id={`password-${user.id}`}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="user-email">
                      <Mail size={16} />
                      <span>{user.email}</span>
                    </div>
                    <div className="user-password">
                      <Lock size={16} />
                      <span>{showPasswords[user.id] ? (user.password || 'N/A') : '********'}</span>
                      <button
                        className="toggle-password"
                        onClick={() => togglePasswordVisibility(user.id)}
                      >
                        {showPasswords[user.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <div className="user-role">
                      <User size={16} />
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="user-actions">
                {editingUser === user.id ? (
                  <div className="edit-actions">
                    <button
                      className="save-btn"
                      onClick={() => {
                        const emailInput = document.getElementById(`email-${user.id}`) as HTMLInputElement;
                        const passwordInput = document.getElementById(`password-${user.id}`) as HTMLInputElement;
                        handleSaveUser(user.id, emailInput.value, passwordInput.value);
                      }}
                    >
                      <Save size={16} />
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={handleCancelEdit}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="default-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEditUser(user.id)}
                      title="Editar usuário"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteUser(user.id)}
                      title="Excluir usuário"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Medidores Associados */}
            <div className="user-devices">
              <button 
                className="view-meters-btn"
                onClick={() => handleShowUserMeters(user.id)}
              >
                <Zap size={16} />
                Ver Medidores ({user.devices.length})
              </button>
            </div>
          </div>
        ))}
      </div>
        </>
      )}

      {/* Modal de Medidores do Usuário */}
      {showUserMeters && (
        <div className="user-meters-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Medidores de {users.find(u => u.id === showUserMeters)?.email}</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowUserMeters(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {users.find(u => u.id === showUserMeters)?.devices && users.find(u => u.id === showUserMeters)!.devices.length > 0 ? (
                <div className="meters-list">
                  {users.find(u => u.id === showUserMeters)?.devices.map(device => (
                    <div key={device.meterId} className="meter-item">
                      <div className="meter-info">
                        <div className="meter-name">
                          <Zap size={16} />
                          <span>{device.name}</span>
                        </div>
                        <div className="meter-location">
                          <MapPin size={14} />
                          <span>{device.location || 'Localização não definida'}</span>
                        </div>
                        <div className={`meter-status ${device.status.toLowerCase()}`}>
                          {device.status === 'ONLINE' ? <Wifi size={14} /> : <WifiOff size={14} />}
                          <span>{device.status === 'ONLINE' ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                      {device.lastReading && (
                        <div className="meter-reading">
                          <div className="reading-time">
                            <Clock size={14} />
                            <span>Última leitura: {new Date(device.lastReading.timestamp).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-meters">
                  <Zap size={48} />
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
