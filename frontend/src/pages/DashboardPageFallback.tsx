import React from 'react';

const DashboardPageFallback: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)',
      color: '#ffffff',
      padding: '2rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
        Dashboard Admin - EletroON
      </h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3>Total de Usuários</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>3</div>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>2 ativos, 1 inativo</p>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3>Usuários Ativos</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>2</div>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>67% do total</p>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3>Usuários Inativos</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>1</div>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>33% do total</p>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '1.5rem',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3>Total de Leituras</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>1,250</div>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Leituras registradas</p>
        </div>
      </div>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Gerenciamento de Usuários</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>ID: 1</div>
              <div>admin@eletroon.com</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Última leitura: 15/01/2024 14:30:25</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>Editar</button>
              <button style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>Excluir</button>
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>ID: 2</div>
              <div>user1@eletroon.com</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Última leitura: 15/01/2024 13:45:12</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>Editar</button>
              <button style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>Excluir</button>
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>ID: 3</div>
              <div>user2@eletroon.com</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Última leitura: 15/01/2024 12:20:08</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>Editar</button>
              <button style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>Excluir</button>
            </div>
          </div>
        </div>
        
        <button style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '12px',
          cursor: 'pointer',
          marginTop: '1.5rem',
          fontWeight: '600'
        }}>
          + Adicionar Usuário
        </button>
      </div>
    </div>
  );
};

export default DashboardPageFallback;
