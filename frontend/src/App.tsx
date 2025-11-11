import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import RoomChartsPage from './pages/RoomChartsPage';
import MeterManagementPage from './pages/MeterManagementPage';
import UserEnergyPage from './pages/UserEnergyPage';
import './styles/index.css';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserEnergyPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requireAdmin={true}>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute requireAdmin={true}>
                <UserManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/graficos-salas" element={
              <ProtectedRoute requireAdmin={true}>
                <RoomChartsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/medidores" element={
              <ProtectedRoute requireAdmin={true}>
                <MeterManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
