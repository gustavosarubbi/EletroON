import React, { useState, useMemo } from 'react';
import { 
  X, 
  UsersRound, 
  Zap, 
  Plus, 
  Wifi, 
  WifiOff, 
  MapPin, 
  Search,
  Link2,
  Unlink,
  Clock,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { UserData } from './types';
import { Device } from '../../../types/dashboard';

interface MeterManagementProps {
  regularUsers: UserData[];
  allDevices: Device[];
  onAssociateMeter: (userId: number, meterId: number) => void;
  onDisassociateMeter: (userId: number, meterId: number) => void;
  onClose?: () => void;
}

interface Meter {
  id: number;
  name: string;
  location?: string;
  status: 'ONLINE' | 'OFFLINE';
  associatedUserId?: number;
  associatedUserEmail?: string;
  lastReading?: {
    timestamp: string;
    qt: number;
  };
}

const MeterManagement: React.FC<MeterManagementProps> = ({
  regularUsers,
  allDevices,
  onAssociateMeter,
  onDisassociateMeter,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'users' | 'meters'>('meters');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ONLINE' | 'OFFLINE' | 'available'>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());
  const [selectedMeterForUser, setSelectedMeterForUser] = useState<{ userId: number; meterId: number | null } | null>(null);
  const [meterSearchQuery, setMeterSearchQuery] = useState('');
  const [selectedUserForMeter, setSelectedUserForMeter] = useState<Record<number, number | null>>({});

  // Criar lista completa de medidores a partir dos dados reais da API
  const allMeters: Meter[] = useMemo(() => {
    return allDevices.map(device => ({
      id: device.meterId,
      name: device.name,
      location: device.location,
      status: device.status,
      associatedUserId: device.user?.id,
      associatedUserEmail: device.user?.email,
      lastReading: device.lastReading || undefined,
    })).sort((a, b) => a.id - b.id);
  }, [allDevices]);

  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return regularUsers;
    
    const query = searchQuery.toLowerCase();
    return regularUsers.filter(user => 
      user.email.toLowerCase().includes(query) ||
      user.devices.some(d => 
        d.name.toLowerCase().includes(query) ||
        d.meterId.toString().includes(query) ||
        d.location?.toLowerCase().includes(query)
      )
    );
  }, [regularUsers, searchQuery]);

  // Filtrar medidores
  const filteredMeters = useMemo(() => {
    let meters = allMeters;
    
    // Filtro por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      meters = meters.filter(meter => 
        meter.name.toLowerCase().includes(query) ||
        meter.id.toString().includes(query) ||
        meter.location?.toLowerCase().includes(query) ||
        meter.associatedUserEmail?.toLowerCase().includes(query)
      );
    }
    
    // Filtro por status
    if (filterStatus === 'available') {
      meters = meters.filter(m => !m.associatedUserId);
    } else if (filterStatus !== 'all') {
      meters = meters.filter(m => m.status === filterStatus);
    }
    
    return meters;
  }, [allMeters, searchQuery, filterStatus]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = allMeters.length;
    const online = allMeters.filter(m => m.status === 'ONLINE').length;
    const offline = allMeters.filter(m => m.status === 'OFFLINE').length;
    const associated = allMeters.filter(m => m.associatedUserId).length;
    const available = total - associated;

    return { total, online, offline, associated, available };
  }, [allMeters]);

  const toggleUserExpansion = (userId: number) => {
    const isSelecting = selectedMeterForUser?.userId === userId;
    
    // Se estiver selecionando medidor para este usuário, fecha a seleção primeiro
    if (isSelecting) {
      setSelectedMeterForUser(null);
      setMeterSearchQuery('');
      // Se estava selecionando, fecha o card também
      setExpandedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } else {
      // Faz o toggle da expansão normalmente
      setExpandedUsers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) {
          newSet.delete(userId);
        } else {
          newSet.add(userId);
        }
        return newSet;
      });
    }
  };

  const handleAssociateMeter = (userId: number, meterId: number) => {
    onAssociateMeter(userId, meterId);
    setSelectedMeterForUser(null);
    setMeterSearchQuery('');
  };

  const handleDisassociateMeter = (meterId: number, userId: number) => {
    onDisassociateMeter(userId, meterId);
  };

  const getAvailableMetersForUser = (userId: number) => {
    const userMeterIds = new Set(
      regularUsers.find(u => u.id === userId)?.devices.map(d => d.meterId) || []
    );
    const available = allMeters.filter(m => !m.associatedUserId && !userMeterIds.has(m.id));
    
    // Filtrar por busca se houver
    if (meterSearchQuery) {
      const query = meterSearchQuery.toLowerCase();
      return available.filter(m => 
        m.id.toString().includes(query) ||
        m.name.toLowerCase().includes(query) ||
        m.location?.toLowerCase().includes(query)
      );
    }
    
    return available;
  };

  const formatLastReading = (timestamp?: string) => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="meter-management-container">
      {onClose && (
        <div className="meter-management-header">
          <div className="meter-management-title-section">
            <Zap size={20} className="meter-management-title-icon" />
            <h2>Gerenciamento de Medidores</h2>
          </div>
          <button className="meter-management-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      )}

      {/* Estatísticas Rápidas */}
      <div className="meter-stats-grid">
        <div className="meter-stat-card total">
          <div className="meter-stat-value">{stats.total}</div>
          <div className="meter-stat-content">
            <div className="meter-stat-icon total">
              <Zap size={18} />
            </div>
            <div className="meter-stat-label">Total de Medidores</div>
          </div>
        </div>
        <div className="meter-stat-card online">
          <div className="meter-stat-value">{stats.online}</div>
          <div className="meter-stat-content">
            <div className="meter-stat-icon online">
              <Wifi size={18} />
            </div>
            <div className="meter-stat-label">Online</div>
          </div>
        </div>
        <div className="meter-stat-card offline">
          <div className="meter-stat-value">{stats.offline}</div>
          <div className="meter-stat-content">
            <div className="meter-stat-icon offline">
              <WifiOff size={18} />
            </div>
            <div className="meter-stat-label">Offline</div>
          </div>
        </div>
        <div className="meter-stat-card associated">
          <div className="meter-stat-value">{stats.associated}</div>
          <div className="meter-stat-content">
            <div className="meter-stat-icon associated">
              <Link2 size={18} />
            </div>
            <div className="meter-stat-label">Associados</div>
          </div>
        </div>
        <div className="meter-stat-card available">
          <div className="meter-stat-value">{stats.available}</div>
          <div className="meter-stat-content">
            <div className="meter-stat-icon available">
              <Plus size={18} />
            </div>
            <div className="meter-stat-label">Disponíveis</div>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="meter-search-bar">
        <div className="meter-search-input-wrapper">
          <Search size={18} className="meter-search-icon" />
          <input
            type="text"
            placeholder="Buscar usuários, medidores, IDs ou localizações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="meter-search-input"
          />
          {searchQuery && (
            <button 
              className="meter-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="meter-view-toggle">
          <button
            className={`meter-view-btn ${viewMode === 'meters' ? 'active' : ''}`}
            onClick={() => setViewMode('meters')}
          >
            <Zap size={16} />
            <span>Por Medidor</span>
          </button>
          <button
            className={`meter-view-btn ${viewMode === 'users' ? 'active' : ''}`}
            onClick={() => setViewMode('users')}
          >
            <UsersRound size={16} />
            <span>Por Usuário</span>
          </button>
        </div>
        {viewMode === 'meters' && (
          <div className="meter-filters">
            <button
              className={`meter-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Todos
            </button>
            <button
              className={`meter-filter-btn meter-filter-btn-available ${filterStatus === 'available' ? 'active' : ''}`}
              onClick={() => setFilterStatus('available')}
            >
              <Plus size={14} />
              Disponíveis
            </button>
            <button
              className={`meter-filter-btn meter-filter-btn-online ${filterStatus === 'ONLINE' ? 'active' : ''}`}
              onClick={() => setFilterStatus('ONLINE')}
            >
              <Wifi size={14} />
              Online
            </button>
            <button
              className={`meter-filter-btn meter-filter-btn-offline ${filterStatus === 'OFFLINE' ? 'active' : ''}`}
              onClick={() => setFilterStatus('OFFLINE')}
            >
              <WifiOff size={14} />
              Offline
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      <div className="meter-management-content">
        {viewMode === 'users' ? (
          /* Visualização por Usuário */
          <div className="meter-users-view">
            {filteredUsers.length > 0 ? (
              <div className="meter-users-list-enhanced">
                {filteredUsers.map(user => {
                  const isExpanded = expandedUsers.has(user.id);
                  const availableMeters = getAvailableMetersForUser(user.id);
                  const isSelectingMeter = selectedMeterForUser?.userId === user.id;

                  return (
                    <div key={user.id} className="meter-user-card-enhanced">
                      <div 
                        className="meter-user-card-header"
                        onClick={() => toggleUserExpansion(user.id)}
                      >
                        <div className="meter-user-card-main">
                          <div className="meter-user-avatar-enhanced">
                            <UsersRound size={20} />
                          </div>
                          <div className="meter-user-info-enhanced">
                            <div className="meter-user-email-enhanced">{user.email}</div>
                            <div className="meter-user-stats">
                              {user.rooms && user.rooms.length > 0 && (
                                <span className="meter-user-stat-badge room" title={user.rooms.join(', ')}>
                                  <MapPin size={12} />
                                  {user.rooms.length === 1 ? user.rooms[0] : `${user.rooms.length} salas`}
                                </span>
                              )}
                              <span className="meter-user-stat-badge">
                                <Zap size={12} />
                                {user.devices.length} medidor{user.devices.length !== 1 ? 'es' : ''}
                              </span>
                              {user.devices.filter(d => d.status === 'ONLINE').length > 0 && (
                                <span className="meter-user-stat-badge online">
                                  <Wifi size={12} />
                                  {user.devices.filter(d => d.status === 'ONLINE').length} online
                                </span>
                              )}
                            </div>
                            {(!user.rooms || user.rooms.length === 0) && (
                              <div className="meter-user-warning">
                                ⚠️ Este usuário não possui salas definidas. Defina pelo menos uma sala antes de associar medidores.
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="meter-user-card-actions">
                          {availableMeters.length > 0 && user.rooms && user.rooms.length > 0 && (
                            <button
                              className="meter-associate-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSelectingMeter) {
                                  // Se já está selecionando, fecha a seleção
                                  setSelectedMeterForUser(null);
                                  setMeterSearchQuery('');
                                } else {
                                  // Se não está selecionando, abre a seleção e expande o card
                                  setSelectedMeterForUser({ userId: user.id, meterId: null });
                                  if (!isExpanded) {
                                    setExpandedUsers(prev => {
                                      const newSet = new Set(prev);
                                      newSet.add(user.id);
                                      return newSet;
                                    });
                                  }
                                }
                              }}
                              title="Associar medidor"
                            >
                              {isSelectingMeter ? (
                                <>
                                  <X size={16} />
                                  <span>Cancelar</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={16} />
                                  <span>Associar</span>
                                </>
                              )}
                            </button>
                          )}
                          {(!user.rooms || user.rooms.length === 0) && (
                            <button
                              className="meter-associate-btn disabled"
                              disabled
                              title="Defina pelo menos uma sala para o usuário antes de associar medidores"
                            >
                              <MapPin size={16} />
                              <span>Sem Sala</span>
                            </button>
                          )}
                          {isExpanded ? (
                            <ChevronDown size={20} className="meter-expand-icon" />
                          ) : (
                            <ChevronRight size={20} className="meter-expand-icon" />
                          )}
                        </div>
                      </div>

                      {(isExpanded || isSelectingMeter) && (
                        <div className="meter-user-card-body">
                          {/* Medidores do Usuário */}
                          {user.devices.length > 0 && (
                            <div className="meter-user-meters-section">
                              <div className="meter-section-title">
                                <Link2 size={14} />
                                <span>Medidores Associados ({user.devices.length})</span>
                              </div>
                              <div className="meter-user-meters-list">
                                {user.devices.map(device => (
                                  <div key={device.meterId} className="meter-user-meter-item">
                                    <div className="meter-user-meter-item-main">
                                      <Zap size={16} className="meter-user-meter-item-icon" />
                                      <div className="meter-user-meter-item-info">
                                        <div className="meter-user-meter-item-name">{device.name}</div>
                                        <div className="meter-user-meter-item-details">
                                          <span className="meter-user-meter-item-id">ID: {device.meterId}</span>
                                          {device.location && (
                                            <>
                                              <span className="meter-user-meter-item-separator">•</span>
                                              <span className="meter-user-meter-item-location">
                                                <MapPin size={11} />
                                                {device.location}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="meter-user-meter-item-actions">
                                      <div className={`meter-user-meter-item-status ${device.status.toLowerCase()}`}>
                                        {device.status === 'ONLINE' ? <Wifi size={12} /> : <WifiOff size={12} />}
                                        <span>{device.status}</span>
                                      </div>
                                      <button
                                        className="meter-user-meter-item-remove"
                                        onClick={() => handleDisassociateMeter(device.meterId, user.id)}
                                        title="Remover medidor"
                                      >
                                        <Unlink size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Medidores Disponíveis para Associar */}
                          {isSelectingMeter && user.rooms && user.rooms.length > 0 && availableMeters.length > 0 && (
                            <div className="meter-available-meters-section">
                              <div className="meter-section-title">
                                <Plus size={14} />
                                <span>Associar Medidor às Salas: {user.rooms.join(', ')}</span>
                              </div>
                              <div className="meter-associate-search-wrapper">
                                <Search size={14} className="meter-associate-search-icon" />
                                <input
                                  type="text"
                                  placeholder="Buscar medidor por ID ou nome..."
                                  className="meter-associate-search-input"
                                  value={meterSearchQuery}
                                  onChange={(e) => setMeterSearchQuery(e.target.value)}
                                />
                                {meterSearchQuery && (
                                  <button
                                    className="meter-associate-search-clear"
                                    onClick={() => setMeterSearchQuery('')}
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                              <div className="meter-available-meters-list">
                                {getAvailableMetersForUser(user.id).length > 0 ? (
                                  <>
                                    {getAvailableMetersForUser(user.id).map(meter => (
                                      <div
                                        key={meter.id}
                                        className={`meter-available-meter-item ${selectedMeterForUser?.meterId === meter.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedMeterForUser({ userId: user.id, meterId: meter.id })}
                                      >
                                        <div className="meter-available-meter-item-info">
                                          <Zap size={14} />
                                          <span className="meter-available-meter-item-name">{meter.name}</span>
                                          <span className="meter-available-meter-item-id">ID: {meter.id}</span>
                                        </div>
                                        <div className={`meter-available-meter-item-status ${meter.status.toLowerCase()}`}>
                                          {meter.status === 'ONLINE' ? <Wifi size={12} /> : <WifiOff size={12} />}
                                          <span>{meter.status}</span>
                                        </div>
                                      </div>
                                    ))}
                                    {selectedMeterForUser?.meterId && (
                                      <button
                                        className="meter-confirm-associate-btn"
                                        onClick={() => {
                                          handleAssociateMeter(user.id, selectedMeterForUser.meterId!);
                                          setMeterSearchQuery('');
                                        }}
                                      >
                                        <Link2 size={14} />
                                        <span>Associar Medidor {selectedMeterForUser.meterId}</span>
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <div className="meter-associate-empty">
                                    <Search size={24} />
                                    <p>Nenhum medidor encontrado</p>
                                    <span>{meterSearchQuery ? 'Tente ajustar os termos de busca' : 'Todos os medidores já estão associados'}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {user.devices.length === 0 && !isSelectingMeter && (
                            <div className="meter-user-empty-state">
                              <Zap size={32} />
                              <p>Nenhum medidor associado</p>
                              {(!user.rooms || user.rooms.length === 0) ? (
                                <span className="meter-user-warning-text">
                                  Defina pelo menos uma sala para este usuário antes de associar medidores.
                                </span>
                              ) : availableMeters.length > 0 ? (
                                <button
                                  className="meter-associate-first-btn"
                                  onClick={() => setSelectedMeterForUser({ userId: user.id, meterId: null })}
                                >
                                  <Plus size={14} />
                                  Associar primeiro medidor
                                </button>
                              ) : (
                                <span>Todos os medidores já estão associados</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="meter-empty-state">
                <Search size={48} />
                <p>Nenhum usuário encontrado</p>
                <span>Tente ajustar os termos de busca</span>
              </div>
            )}
          </div>
        ) : (
          /* Visualização por Medidor - Separada por Online/Offline */
          <div className="meter-meters-view">
            {filteredMeters.length > 0 ? (
              <div className="meter-meters-sections">
                {/* Seção de Medidores Online */}
                {filteredMeters.filter(m => m.status === 'ONLINE').length > 0 && (
                  <div className="meter-status-section">
                    <div className="meter-status-section-header online">
                      <div className="meter-status-section-title">
                        <Wifi size={18} />
                        <h3>Medidores Online</h3>
                        <span className="meter-status-count">
                          {filteredMeters.filter(m => m.status === 'ONLINE').length}
                        </span>
                      </div>
                    </div>
                    <div className="meter-status-section-list">
                      {filteredMeters
                        .filter(m => m.status === 'ONLINE')
                        .map(meter => {
                          const isAssociated = !!meter.associatedUserId;
                          const [selectedUserForMeter, setSelectedUserForMeter] = useState<number | null>(null);

                          return (
                            <div
                              key={meter.id}
                              className={`meter-meter-card ${isAssociated ? 'associated' : 'available'} online`}
                            >
                              <div className="meter-meter-card-header">
                                <div className="meter-meter-card-icon-wrapper">
                                  <Zap size={20} className="meter-meter-card-icon" />
                                  <div className={`meter-meter-status-badge online`}>
                                    <Wifi size={12} />
                                  </div>
                                </div>
                                <div className="meter-meter-card-info">
                                  <div className="meter-meter-card-name">{meter.name}</div>
                                  <div className="meter-meter-card-details">
                                    <span className="meter-meter-card-id">ID: {meter.id}</span>
                                    {meter.location && (
                                      <>
                                        <span className="meter-meter-card-separator">•</span>
                                        <span className="meter-meter-card-location">
                                          <MapPin size={11} />
                                          {meter.location}
                                        </span>
                                      </>
                                    )}
                                    {meter.lastReading && (
                                      <>
                                        <span className="meter-meter-card-separator">•</span>
                                        <span className="meter-meter-card-reading">
                                          <Clock size={11} />
                                          {formatLastReading(meter.lastReading.timestamp)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="meter-meter-card-footer">
                                {isAssociated ? (
                                  <div className="meter-meter-card-associated">
                                    <div className="meter-meter-card-user-info">
                                      <UsersRound size={14} />
                                      <span className="meter-meter-card-user-email">{meter.associatedUserEmail}</span>
                                    </div>
                                    <button
                                      className="meter-meter-card-disassociate-btn"
                                      onClick={() => meter.associatedUserId && handleDisassociateMeter(meter.id, meter.associatedUserId)}
                                      title="Desassociar medidor"
                                    >
                                      <Unlink size={14} />
                                      <span>Remover</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="meter-meter-card-available">
                                    <div className="meter-meter-card-associate-controls">
                                      {selectedUserId === null ? (
                                        <>
                                          <div className="meter-meter-card-available-label">
                                            <Plus size={14} />
                                            <span>Disponível para associação</span>
                                          </div>
                                          <button
                                            className="meter-meter-card-associate-btn"
                                            onClick={() => setSelectedUserForMeter(prev => ({ ...prev, [meter.id]: 0 }))}
                                            title="Associar medidor a um usuário"
                                          >
                                            <Link2 size={14} />
                                            <span>Associar</span>
                                          </button>
                                        </>
                                      ) : (
                                        <div className="meter-meter-card-user-selector">
                                          <select
                                            className="meter-meter-card-user-select"
                                            value={selectedUserId || ''}
                                            onChange={(e) => setSelectedUserForMeter(prev => ({ ...prev, [meter.id]: Number(e.target.value) || null }))}
                                          >
                                            <option value="">Selecione um usuário...</option>
                                            {regularUsers
                                              .filter(u => u.rooms && u.rooms.length > 0)
                                              .map(user => (
                                                <option key={user.id} value={user.id}>
                                                  {user.email} ({user.rooms?.join(', ')})
                                                </option>
                                              ))}
                                          </select>
                                          <div className="meter-meter-card-associate-actions">
                                            <button
                                              className="meter-meter-card-confirm-btn"
                                              onClick={() => {
                                                if (selectedUserId) {
                                                  handleAssociateMeter(selectedUserId, meter.id);
                                                  setSelectedUserForMeter(prev => {
                                                    const newState = { ...prev };
                                                    delete newState[meter.id];
                                                    return newState;
                                                  });
                                                }
                                              }}
                                              disabled={!selectedUserId}
                                            >
                                              <Link2 size={14} />
                                              <span>Confirmar</span>
                                            </button>
                                            <button
                                              className="meter-meter-card-cancel-btn"
                                              onClick={() => setSelectedUserForMeter(prev => {
                                                const newState = { ...prev };
                                                delete newState[meter.id];
                                                return newState;
                                              })}
                                            >
                                              <X size={14} />
                                              <span>Cancelar</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Seção de Medidores Offline */}
                {filteredMeters.filter(m => m.status === 'OFFLINE').length > 0 && (
                  <div className="meter-status-section">
                    <div className="meter-status-section-header offline">
                      <div className="meter-status-section-title">
                        <WifiOff size={18} />
                        <h3>Medidores Offline</h3>
                        <span className="meter-status-count">
                          {filteredMeters.filter(m => m.status === 'OFFLINE').length}
                        </span>
                      </div>
                    </div>
                    <div className="meter-status-section-list">
                      {filteredMeters
                        .filter(m => m.status === 'OFFLINE')
                        .map(meter => {
                          const isAssociated = !!meter.associatedUserId;
                          const selectedUserId = selectedUserForMeter[meter.id] || null;

                          return (
                            <div
                              key={meter.id}
                              className={`meter-meter-card ${isAssociated ? 'associated' : 'available'} offline`}
                            >
                              <div className="meter-meter-card-header">
                                <div className="meter-meter-card-icon-wrapper">
                                  <Zap size={20} className="meter-meter-card-icon" />
                                  <div className={`meter-meter-status-badge offline`}>
                                    <WifiOff size={12} />
                                  </div>
                                </div>
                                <div className="meter-meter-card-info">
                                  <div className="meter-meter-card-name">{meter.name}</div>
                                  <div className="meter-meter-card-details">
                                    <span className="meter-meter-card-id">ID: {meter.id}</span>
                                    {meter.location && (
                                      <>
                                        <span className="meter-meter-card-separator">•</span>
                                        <span className="meter-meter-card-location">
                                          <MapPin size={11} />
                                          {meter.location}
                                        </span>
                                      </>
                                    )}
                                    {meter.lastReading && (
                                      <>
                                        <span className="meter-meter-card-separator">•</span>
                                        <span className="meter-meter-card-reading">
                                          <Clock size={11} />
                                          {formatLastReading(meter.lastReading.timestamp)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="meter-meter-card-footer">
                                {isAssociated ? (
                                  <div className="meter-meter-card-associated">
                                    <div className="meter-meter-card-user-info">
                                      <UsersRound size={14} />
                                      <span className="meter-meter-card-user-email">{meter.associatedUserEmail}</span>
                                    </div>
                                    <button
                                      className="meter-meter-card-disassociate-btn"
                                      onClick={() => meter.associatedUserId && handleDisassociateMeter(meter.id, meter.associatedUserId)}
                                      title="Desassociar medidor"
                                    >
                                      <Unlink size={14} />
                                      <span>Remover</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="meter-meter-card-available">
                                    <div className="meter-meter-card-associate-controls">
                                      {selectedUserId === null ? (
                                        <>
                                          <div className="meter-meter-card-available-label">
                                            <Plus size={14} />
                                            <span>Disponível para associação</span>
                                          </div>
                                          <button
                                            className="meter-meter-card-associate-btn"
                                            onClick={() => setSelectedUserForMeter(prev => ({ ...prev, [meter.id]: 0 }))}
                                            title="Associar medidor a um usuário"
                                          >
                                            <Link2 size={14} />
                                            <span>Associar</span>
                                          </button>
                                        </>
                                      ) : (
                                        <div className="meter-meter-card-user-selector">
                                          <select
                                            className="meter-meter-card-user-select"
                                            value={selectedUserId || ''}
                                            onChange={(e) => setSelectedUserForMeter(prev => ({ ...prev, [meter.id]: Number(e.target.value) || null }))}
                                          >
                                            <option value="">Selecione um usuário...</option>
                                            {regularUsers
                                              .filter(u => u.rooms && u.rooms.length > 0)
                                              .map(user => (
                                                <option key={user.id} value={user.id}>
                                                  {user.email} ({user.rooms?.join(', ')})
                                                </option>
                                              ))}
                                          </select>
                                          <div className="meter-meter-card-associate-actions">
                                            <button
                                              className="meter-meter-card-confirm-btn"
                                              onClick={() => {
                                                if (selectedUserId) {
                                                  handleAssociateMeter(selectedUserId, meter.id);
                                                  setSelectedUserForMeter(prev => {
                                                    const newState = { ...prev };
                                                    delete newState[meter.id];
                                                    return newState;
                                                  });
                                                }
                                              }}
                                              disabled={!selectedUserId}
                                            >
                                              <Link2 size={14} />
                                              <span>Confirmar</span>
                                            </button>
                                            <button
                                              className="meter-meter-card-cancel-btn"
                                              onClick={() => setSelectedUserForMeter(prev => {
                                                const newState = { ...prev };
                                                delete newState[meter.id];
                                                return newState;
                                              })}
                                            >
                                              <X size={14} />
                                              <span>Cancelar</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="meter-empty-state">
                <Search size={48} />
                <p>Nenhum medidor encontrado</p>
                <span>Tente ajustar os filtros de busca</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeterManagement;
