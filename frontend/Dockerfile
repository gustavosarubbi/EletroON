# Dockerfile para Frontend EletroON
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    curl

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm@10.15.1

# Copiar arquivos de configuração de dependências
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação
RUN pnpm run build

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001 || exit 1

# Comando para iniciar a aplicação
CMD ["pnpm", "run", "preview", "--host", "0.0.0.0", "--port", "3001"]
