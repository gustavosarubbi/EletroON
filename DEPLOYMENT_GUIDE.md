# 🚀 Guia de Deploy e Configuração - EletroON

## 📋 Visão Geral

Este guia explica como configurar e fazer deploy do projeto EletroON em diferentes ambientes (desenvolvimento, produção, Docker, etc.).

## 🔧 Configuração do Backend

### 1. Variáveis de Ambiente

Copie o arquivo `env.example` para `.env` e configure:

```bash
# api-eletroon/.env
PORT=3000
CORS_ORIGINS=http://localhost:3001,http://127.0.0.1:3001
DATABASE_URL="postgresql://usuario:senha@localhost:5432/eletroon"
JWT_SECRET=seu-jwt-secret-aqui
NODE_ENV=development
```

### 2. Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run start:prod

# Docker (permite qualquer origem)
npm run start:docker
```

### 3. Configuração CORS

- **Desenvolvimento**: `CORS_ORIGINS=http://localhost:3001,http://127.0.0.1:3001`
- **Produção**: `CORS_ORIGINS=https://seu-dominio.com`
- **Docker**: `CORS_ORIGINS=*` (permite qualquer origem)

## 🔧 Configuração do Frontend

### 1. Variáveis de Ambiente

Copie o arquivo `env.example` para `.env.local` e configure:

```bash
# front-eletroon/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
PORT=3001
NODE_ENV=development
```

### 2. Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Produção
npm run start:prod

# Docker
npm run start:docker
```

### 3. URLs da API

- **Desenvolvimento**: `http://localhost:3000/api`
- **Produção**: `https://seu-dominio.com/api` ou `/api`
- **Docker**: Configurável via variável de ambiente

## 🐳 Deploy com Docker

### 1. Backend

```dockerfile
# Dockerfile para o backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start:docker"]
```

### 2. Frontend

```dockerfile
# Dockerfile para o frontend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:docker"]
```

### 3. Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./api-eletroon
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - CORS_ORIGINS=*
      - DATABASE_URL=postgresql://postgres:senha@db:5432/eletroon
    depends_on:
      - db

  frontend:
    build: ./front-eletroon
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3000/api
      - PORT=3001
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=eletroon
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=senha
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🌐 Deploy em Produção

### 1. Servidor Tradicional

```bash
# Backend
cd api-eletroon
npm run build
npm run start:prod

# Frontend
cd front-eletroon
npm run build
npm run start:prod
```

### 2. Variáveis de Ambiente em Produção

```bash
# Backend
export PORT=3000
export CORS_ORIGINS=https://seu-dominio.com
export DATABASE_URL="postgresql://usuario:senha@servidor:5432/eletroon"
export JWT_SECRET=seu-jwt-secret-producao
export NODE_ENV=production

# Frontend
export NEXT_PUBLIC_API_URL=https://seu-dominio.com/api
export PORT=3001
export NODE_ENV=production
```

### 3. Nginx (Reverso Proxy)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔒 Segurança

### 1. CORS
- Configure apenas as origens necessárias em produção
- Evite usar `CORS_ORIGINS=*` em produção

### 2. Variáveis de Ambiente
- Nunca commite arquivos `.env` no Git
- Use variáveis de ambiente seguras em produção
- Rotacione JWT secrets regularmente

### 3. Portas
- Use portas não padrão em produção
- Configure firewall adequadamente

## 📝 Checklist de Deploy

- [ ] Configurar variáveis de ambiente
- [ ] Configurar CORS adequadamente
- [ ] Configurar banco de dados
- [ ] Testar em ambiente local
- [ ] Fazer build de produção
- [ ] Configurar servidor/container
- [ ] Testar funcionalidades
- [ ] Configurar monitoramento
- [ ] Configurar backup

## 🆘 Solução de Problemas

### CORS Errors
- Verifique se `CORS_ORIGINS` está configurado corretamente
- Confirme se o frontend está acessando a URL correta

### Portas em Uso
- Use `netstat -tulpn` para verificar portas ocupadas
- Configure portas diferentes via variáveis de ambiente

### Banco de Dados
- Verifique se `DATABASE_URL` está correto
- Confirme se o banco está acessível

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Logs da aplicação
- Documentação da API em `/api/docs`
- Configurações de ambiente
