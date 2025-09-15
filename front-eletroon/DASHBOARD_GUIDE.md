# 📊 Dashboard Admin - EletroON

## 🎯 Visão Geral

O Dashboard Admin é uma interface completa para gerenciar dispositivos, usuários e monitorar dados em tempo real do sistema EletroON.

## 🚀 Funcionalidades

### 📈 Estatísticas em Tempo Real
- **Total de Dispositivos**: Contagem geral de dispositivos cadastrados
- **Dispositivos Online/Offline**: Status de conectividade em tempo real
- **Total de Usuários**: Número de usuários cadastrados no sistema
- **Total de Leituras**: Quantidade de dados coletados

### 🔧 Gerenciamento de Dispositivos
- **Visualização em Cards**: Interface intuitiva com status visual
- **Edição de Nomes**: Renomear dispositivos facilmente
- **Status de Conectividade**: Indicadores visuais (online/offline)
- **Última Leitura**: Timestamp da última coleta de dados
- **Localização**: Informações de local do dispositivo

### 👥 Gerenciamento de Usuários
- **Criação de Usuários**: Associar usuários a dispositivos específicos
- **Edição de Credenciais**: Atualizar email e senha
- **Remoção de Usuários**: Desassociar usuários de dispositivos
- **Associação**: Vincular dispositivos a usuários existentes

### 🔍 Filtros e Busca
- **Busca por Nome**: Encontrar dispositivos por nome ou ID
- **Filtro por Status**: Visualizar apenas dispositivos online/offline
- **Busca em Tempo Real**: Resultados instantâneos

### 📊 Visualização de Dados
- **Gráficos Interativos**: Visualização de métricas com Chart.js
- **Múltiplas Métricas**: Potência, tensão, corrente, energia
- **Períodos Personalizáveis**: Últimas 24h, 7 dias, 30 dias
- **Exportação**: Dados em CSV, XLSX ou JSON

## 🎨 Design System

### 🎨 Cores
- **Azul**: Dispositivos e informações gerais
- **Verde**: Status online e sucessos
- **Laranja**: Alertas e métricas importantes
- **Vermelho**: Status offline e erros
- **Roxo**: Usuários e estatísticas

### 📱 Responsividade
- **Desktop**: Layout em grid com múltiplas colunas
- **Tablet**: Adaptação automática do grid
- **Mobile**: Layout em coluna única otimizado

### ⚡ Animações
- **Hover Effects**: Elevação suave dos cards
- **Loading States**: Spinners e estados de carregamento
- **Transitions**: Transições suaves entre estados

## 🔧 Componentes

### StatsCard
```tsx
<StatsCard
  title="Total de Dispositivos"
  value={stats.totalDevices}
  icon={Zap}
  color="blue"
  subtitle={`${stats.onlineDevices} online`}
/>
```

### DeviceCard
```tsx
<DeviceCard
  device={device}
  onUpdateName={handleUpdateName}
  onCreateUser={handleCreateUser}
  onUpdateUser={handleUpdateUser}
  onDeleteUser={handleDeleteUser}
  onAssociateUser={handleAssociateUser}
/>
```

### Chart
```tsx
<Chart
  data={chartData}
  title="Potência Total (PT)"
  height={300}
/>
```

## 📡 API Integration

### Endpoints Utilizados
- `GET /api/admin/stats` - Estatísticas do dashboard
- `GET /api/admin/salas` - Lista de dispositivos
- `GET /api/admin/users` - Lista de usuários
- `PATCH /api/admin/salas/{id}/name` - Atualizar nome
- `POST /api/admin/salas/{id}/user` - Criar usuário
- `PATCH /api/admin/salas/{id}/user` - Atualizar usuário
- `DELETE /api/admin/salas/{id}/user` - Remover usuário
- `POST /api/admin/export` - Exportar dados

### Autenticação
- **JWT Token**: Armazenado no localStorage
- **Interceptors**: Adição automática do token nas requisições
- **Refresh**: Renovação automática do token

## 🚀 Como Usar

### 1. Acesso
- Faça login com credenciais de admin
- Acesse automaticamente o dashboard após login

### 2. Navegação
- **Header**: Ações principais (atualizar, exportar, sair)
- **Stats**: Visão geral dos números do sistema
- **Filtros**: Busca e filtros de dispositivos
- **Grid**: Lista de dispositivos com ações

### 3. Ações Rápidas
- **Atualizar**: Botão de refresh para dados em tempo real
- **Exportar**: Download de dados em CSV
- **Editar**: Clique no menu de opções do dispositivo
- **Buscar**: Use a barra de busca para encontrar dispositivos

## 🔒 Segurança

### Autenticação
- **JWT Tokens**: Autenticação segura
- **Role-based Access**: Apenas admins podem acessar
- **Session Management**: Logout automático em caso de erro

### Validação
- **Input Validation**: Validação de todos os inputs
- **Error Handling**: Tratamento de erros da API
- **Loading States**: Feedback visual para operações

## 📱 Responsividade

### Breakpoints
- **Desktop**: > 1024px - Layout completo
- **Tablet**: 768px - 1024px - Grid adaptado
- **Mobile**: < 768px - Layout em coluna

### Otimizações Mobile
- **Touch-friendly**: Botões e áreas de toque otimizadas
- **Swipe Gestures**: Navegação por gestos
- **Performance**: Carregamento otimizado para mobile

## 🎯 Próximas Funcionalidades

### 📊 Analytics Avançados
- **Relatórios**: Geração de relatórios automáticos
- **Alertas**: Notificações de anomalias
- **Comparações**: Análise comparativa de períodos

### 🔧 Automação
- **Agendamentos**: Tarefas automáticas
- **Backups**: Backup automático de dados
- **Manutenção**: Alertas de manutenção preventiva

### 📱 Mobile App
- **PWA**: Progressive Web App
- **Push Notifications**: Notificações em tempo real
- **Offline Mode**: Funcionalidade offline

## 🐛 Troubleshooting

### Problemas Comuns
1. **Dados não carregam**: Verifique a conexão com a API
2. **Erro de autenticação**: Faça logout e login novamente
3. **Dispositivos offline**: Verifique a conectividade dos dispositivos
4. **Exportação falha**: Verifique se há dados para exportar

### Logs
- **Console**: Logs detalhados no console do navegador
- **Network**: Verifique as requisições na aba Network
- **Errors**: Tratamento de erros com feedback visual

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o dashboard:
- **Email**: suporte@eletroon.com
- **Documentação**: Consulte a documentação da API
- **Issues**: Reporte bugs no repositório do projeto
