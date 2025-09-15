# 🚀 EletroON - Sistema de Monitoramento de Energia

## 📁 Estrutura do Projeto

O projeto EletroON está organizado em uma arquitetura modular com as seguintes pastas principais:

### 🏗️ **Backend (`api-eletroon/`)**
- **API REST** em NestJS com TypeScript
- **Banco de dados** PostgreSQL com Prisma ORM
- **Autenticação** JWT com estratégias de segurança
- **Scripts utilitários** em `scripts/` para administração
- **Queries SQL** em `prisma/` para operações no banco

### 🎨 **Frontend (`front-eletroon/`)**
- **Interface web** em Next.js com React
- **Componentes** reutilizáveis e responsivos
- **Contextos** para gerenciamento de estado
- **PWA** com funcionalidades offline


### 📚 **Documentação e Configuração**
- **`CREDENCIAIS.md`** - Credenciais e configurações do sistema
- **`DEPLOYMENT_GUIDE.md`** - Guia completo de deploy
- **`docker-compose.yml`** - Configuração Docker
- **`nginx.conf`** - Configuração do servidor web
- **`start.ps1`** - Script de inicialização Windows
- **`start.sh`** - Script de inicialização Linux

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- Docker (opcional)

### Desenvolvimento Local
```bash
# Backend
cd api-eletroon
npm install
npm run start:dev

# Frontend
cd front-eletroon
npm install
npm run dev

```

### Docker
```bash
docker-compose up -d
```

## 📖 Documentação

- [Guia de Deploy](DEPLOYMENT_GUIDE.md)
- [Credenciais do Sistema](CREDENCIAIS.md)
- [Uso da API](api-eletroon/API_USAGE.md)
- [Scripts Utilitários](api-eletroon/scripts/README.md)

## 🔧 Scripts Utilitários

### Backend (`api-eletroon/scripts/`)
- `create-users.js` - Criação de usuários padrão
- `verify-password.js` - Verificação de senhas
- `test-connection.js` - Teste de conectividade
- `reset-database.js` - Reset do banco de dados
- `configure-users.js` - Configuração de usuários

### Banco de Dados (`api-eletroon/prisma/`)
- `query_users.sql` - Consulta de usuários
- `drop_user.sql` - Remoção de tabela de usuários
- `delete_users.sql` - Deleção de usuários

## 🌐 Portas Padrão

- **Backend**: 3000
- **Frontend**: 3001
- **Medidor Artificial**: 5001
- **Nginx**: 80

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes.

---

**EletroON Team** - Sistema de Monitoramento de Energia Inteligente
