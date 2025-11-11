import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ChevronRight, Zap } from 'lucide-react';
import LoginParticles from '../components/ui/LoginParticles';
import Sidebar from '../components/dashboard/Sidebar';
import MeterManagement from '../components/dashboard/UserManager/MeterManagement';
import { dashboardService } from '../services/dashboardService';
import { UserData } from '../components/dashboard/UserManager/types';
import { Device } from '../types/dashboard';
import '../styles/components/Dashboard.css';

const MeterManagementPage: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, devicesData] = await Promise.all([
        dashboardService.getUsers(),
        dashboardService.getDevices()
      ]);
      setUsers(usersData);
      // Transformar dados dos dispositivos para incluir campo associated
      const devicesWithAssociation = devicesData.map(device => ({
        ...device,
        associated: device.user !== null && device.user !== undefined
      }));
      setDevices(devicesWithAssociation);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados. Verifique a conexão com a API.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssociateMeter = async (userId: number, meterId: number) => {
    try {
      await dashboardService.associateMeterToUser(meterId, userId);
      // Recarregar dados para garantir sincronização
      await loadData();
    } catch (err: any) {
      console.error('Erro ao associar medidor:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao associar medidor. Tente novamente.';
      setError(errorMessage);
    }
  };

  const handleDisassociateMeter = async (_userId: number, meterId: number) => {
    try {
      await dashboardService.disassociateMeterFromUser(meterId);
      // Recarregar dados para garantir sincronização
      await loadData();
    } catch (err: any) {
      console.error('Erro ao desassociar medidor:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Erro ao desassociar medidor. Tente novamente.';
      setError(errorMessage);
    }
  };

  const regularUsers = users.filter(user => user.role !== 'admin');

  return (
    <div className="dashboard-page-container">
      <LoginParticles />

      {/* Botão de Menu - Visível apenas quando sidebar está fechado */}
      {!sidebarVisible && (
        <button 
          className="dashboard-menu-toggle"
          onClick={() => setSidebarVisible(!sidebarVisible)}
          title="Abrir menu"
          aria-label="Toggle sidebar"
        >
          <svg width="56" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="0" width="24" height="6" rx="3" fill="white"/>
            <rect y="10" width="24" height="6" rx="3" fill="white"/>
            <rect y="20" width="24" height="6" rx="3" fill="white"/>
          </svg>
        </button>
      )}

      {/* Título com Breadcrumb */}
      <div className="dashboard-title-section">
        <div className="dashboard-title-header">
          <div className="dashboard-breadcrumb">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
            <ChevronRight size={18} />
            <Zap size={18} />
            <span className="breadcrumb-active">Gerenciamento de Medidores</span>
          </div>
        </div>
        <h1 className="dashboard-main-title">Gerenciamento de Medidores</h1>
        <p className="dashboard-subtitle">Gerencie a associação de medidores com usuários</p>
      </div>

      {/* Sidebar */}
      <Sidebar 
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      <div className="dashboard-page-content">
        {error && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#fee', 
            color: '#c33', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}
        
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px' 
          }}>
            <p>Carregando dados...</p>
          </div>
        ) : (
          <MeterManagement
            regularUsers={regularUsers}
            allDevices={devices}
            onAssociateMeter={handleAssociateMeter}
            onDisassociateMeter={handleDisassociateMeter}
          />
        )}
      </div>
    </div>
  );
};

export default MeterManagementPage;

