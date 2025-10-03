# Dockerfile para Backend EletroON
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    curl \
    openssl

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm@10.15.1

# Copiar arquivos de configuração de dependências
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile --prod

# Copiar código fonte
COPY . .

# Gerar Prisma client
RUN npx prisma generate

# Build da aplicação
RUN pnpm run build

# Criar diretório para logs
RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando para iniciar a aplicação
CMD ["pnpm", "run", "start:prod"]
