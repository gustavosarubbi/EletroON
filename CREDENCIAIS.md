y# 🔐 Configurações do Sistema EletroON

## ⚠️ **IMPORTANTE: SEGURANÇA**

**NUNCA** commite credenciais reais no Git! Use variáveis de ambiente.

## 👤 **Usuários Padrão**

### **Administrador**
- **Email**: Configurado via `DEFAULT_ADMIN_EMAIL`
- **Senha**: Configurada via `DEFAULT_ADMIN_PASSWORD`
- **Role**: `ADMIN`
- **Acesso**: Todas as funcionalidades

### **Usuário Comum**
- **Email**: Configurado via `DEFAULT_USER_EMAIL`
- **Senha**: Configurada via `DEFAULT_USER_PASSWORD`
- **Role**: `USER`
- **Acesso**: Funcionalidades limitadas

## 🌐 **Configuração de Portas**

### **Desenvolvimento Local**
- **Frontend**: `http://localhost:3001`
- **Backend**: `http://localhost:3000`
- **Banco**: `localhost:5432`

### **Docker**
- **Nginx (Proxy)**: `http://localhost:80` ← **URL Principal**
- **Frontend**: `http://localhost:3001` (acesso direto)
- **Backend**: `http://localhost:3000` (acesso direto)
- **Banco**: `localhost:5432`

## 🔧 **Por que Portas Diferentes?**

### **Nginx (Porta 80)**
- ✅ **URL limpa**: `http://localhost` (sem porta)
- ✅ **Padrão web**: Navegadores usam porta 80 por padrão
- ✅ **Proxy reverso**: Roteia automaticamente:
  - `/api/*` → Backend (porta 3000)
  - `/` → Frontend (porta 3001)

### **Comunicação entre Containers**
- **Frontend** → **Backend**: `http://backend:3000/api` (rede interna Docker)
- **Nginx** → **Frontend**: `http://frontend:3001` (rede interna Docker)
- **Nginx** → **Backend**: `http://backend:3000` (rede interna Docker)

## 🚀 **Como Acessar**

### **Recomendado (via Docker)**
```
http://localhost:80
```
- Usa o proxy reverso (Nginx)
- Melhor performance
- Configuração de produção

### **Desenvolvimento Local**
```
Frontend: http://localhost:3001
Backend:  http://localhost:3000
```
- Para desenvolvimento
- Debugging mais fácil
- Hot reload

## 📝 **Variáveis de Ambiente**

### **Backend (.env)**
```env
DATABASE_URL=postgresql://postgres:SUA_SENHA_DB@db:5432/eletroon
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
JWT_EXPIRATION_TIME=24h
CORS_ORIGINS=*

# Usuários padrão (personalizáveis)
DEFAULT_ADMIN_EMAIL=admin@seudominio.com
DEFAULT_ADMIN_PASSWORD=SUA_SENHA_ADMIN_SEGURA
DEFAULT_USER_EMAIL=usuario@seudominio.com
DEFAULT_USER_PASSWORD=SUA_SENHA_USER_SEGURA
```

### **Frontend**
```env
NEXT_PUBLIC_API_URL=http://backend:3000/api  # Docker
NEXT_PUBLIC_API_URL=http://localhost:3000/api # Local
```

## 🎨 **Personalização das Credenciais**

### **Opção 1: Variáveis de Ambiente**
```bash
# No arquivo .env (NUNCA commite este arquivo!)
DEFAULT_ADMIN_EMAIL=meuadmin@empresa.com
DEFAULT_ADMIN_PASSWORD=MinhaSenha123!
DEFAULT_USER_EMAIL=usuario@empresa.com
DEFAULT_USER_PASSWORD=Usuario123!
```

### **Opção 2: Script Interativo**
```bash
node scripts/configure-users.js
```
O script pergunta cada configuração e aplica automaticamente.

### **Opção 3: Docker Compose (usando .env)**
```yaml
environment:
  - DEFAULT_ADMIN_EMAIL=${DEFAULT_ADMIN_EMAIL}
  - DEFAULT_ADMIN_PASSWORD=${DEFAULT_ADMIN_PASSWORD}
  - DEFAULT_USER_EMAIL=${DEFAULT_USER_EMAIL}
  - DEFAULT_USER_PASSWORD=${DEFAULT_USER_PASSWORD}
```

## 🧪 **Testando o Sistema**

### **1. Verificar se está rodando**
```bash
docker-compose ps
```

### **2. Ver logs**
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
```

### **3. Testar API**
```bash
# Via Docker (Nginx)
curl http://localhost:80/api/docs

# Via Backend direto
curl http://localhost:3000/api/docs
```

### **4. Testar Login**
```bash
# Usar as credenciais configuradas no .env
Email: [configurado em DEFAULT_ADMIN_EMAIL]
Senha: [configurada em DEFAULT_ADMIN_PASSWORD]
```

## 🔄 **Gerenciar Usuários**

### **1. Configuração Interativa (Recomendado)**
```bash
cd api-eletroon
# Configure primeiro o .env com suas credenciais
$env:DATABASE_URL="postgresql://postgres:SUA_SENHA_DB@localhost:5432/eletroon"
node scripts/configure-users.js
```
Este script permite configurar interativamente:
- Email e senha do administrador
- Email e senha do usuário comum
- Confirmação antes de aplicar mudanças

### **2. Reset de Senhas**
```bash
cd api-eletroon
$env:DATABASE_URL="postgresql://postgres:SUA_SENHA_DB@localhost:5432/eletroon"
node scripts/reset-passwords.js
```
Redefine senhas usando as configurações das variáveis de ambiente.

### **3. Verificar Configurações**
```bash
cd api-eletroon
$env:DATABASE_URL="postgresql://postgres:eletroon123@localhost:5432/eletroon"
node scripts/check-config.js
```
Verifica todas as configurações do sistema e status do banco de dados.

## 📚 **Documentação da API**

- **Swagger UI**: `http://localhost:80/api/docs` (via Docker)
- **Swagger UI**: `http://localhost:3000/api/docs` (local)
