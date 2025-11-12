# 🔍 Debug de Conexão Frontend-Backend

## Como verificar se está tudo conectado

### 1. Verificar se o Backend está rodando

Abra um terminal e execute:

```bash
cd backend
pnpm start:dev
```

Você deve ver algo como:
```
[Nest] LOG [Bootstrap] Aplicação rodando na porta 3000
[Nest] LOG [Bootstrap] API disponível em: http://localhost:3000/api
```

### 2. Verificar se o Frontend está rodando

Em outro terminal, execute:

```bash
cd frontend
pnpm dev
```

Você deve ver algo como:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3001/
  ➜  Network: use --host to expose
```

### 3. Verificar no Console do Navegador

Abra o DevTools (F12) e vá na aba Console. Você deve ver:

```
🔗 API Base URL: /api
📤 Requisição: GET /api/eletroon/my-devices?page=1&limit=100
🔄 Requisição proxy: GET /api/eletroon/my-devices?page=1&limit=100
📥 Resposta: 200 /api/eletroon/my-devices?page=1&limit=100
```

### 4. Problemas Comuns

#### ❌ Erro: "Network Error" ou "Erro de conexão"

**Causa:** Backend não está rodando ou não está acessível

**Solução:**
1. Verifique se o backend está rodando na porta 3000
2. Tente acessar diretamente: http://localhost:3000/api
3. Verifique os logs do backend para ver se há erros

#### ❌ Erro: "CORS policy"

**Causa:** Backend não está permitindo requisições do frontend

**Solução:**
1. Verifique se o backend está configurado para aceitar `http://localhost:3001`
2. No arquivo `backend/src/main.ts`, linha 90, deve ter: `['http://localhost:3001', 'http://localhost:3004']`
3. Ou configure `CORS_ORIGINS=*` no `.env` do backend

#### ❌ Erro: "404 Not Found"

**Causa:** Endpoint não existe ou URL incorreta

**Solução:**
1. Verifique se o endpoint `/api/eletroon/my-devices` existe no backend
2. Verifique se o prefixo `/api` está configurado no backend

#### ❌ Erro: "401 Unauthorized"

**Causa:** Token inválido ou expirado

**Solução:**
1. Faça login novamente
2. Verifique se o token está sendo enviado no header `Authorization`

### 5. Testar Conexão Manualmente

Abra o navegador e acesse:

```
http://localhost:3000/api/eletroon/my-devices
```

Se você ver um erro de autenticação (401), o backend está funcionando!
Se você ver "Cannot GET", o endpoint não existe.
Se você ver "ERR_CONNECTION_REFUSED", o backend não está rodando.

### 6. Configuração do Proxy

O Vite está configurado para fazer proxy das requisições `/api` para `http://localhost:3000`.

Isso significa que:
- Frontend faz requisição para: `/api/eletroon/my-devices`
- Vite redireciona para: `http://localhost:3000/api/eletroon/my-devices`

### 7. Logs Úteis

No console do navegador, você verá:
- 🔗 URL da API sendo usada
- 📤 Todas as requisições sendo feitas
- 📥 Todas as respostas recebidas
- ❌ Erros detalhados com dicas de solução

