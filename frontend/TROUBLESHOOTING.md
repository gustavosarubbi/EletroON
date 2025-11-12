# 🔧 Troubleshooting - Conexão Frontend-Backend

## ❌ Erro 404 ao fazer login

Se você está vendo o erro:
```
api/auth/login:1  Failed to load resource: the server responded with a status of 404 (Not Found)
```

### Passo 1: Verificar se o Backend está rodando

Abra um terminal PowerShell e execute:

```powershell
cd backend
pnpm start:dev
```

**Você DEVE ver:**
```
[Nest] LOG [Bootstrap] Aplicação rodando na porta 3000
[Nest] LOG [Bootstrap] API disponível em: http://localhost:3000/api
```

**Se você NÃO ver isso:**
- O backend não está rodando
- Verifique se há erros no terminal
- Verifique se a porta 3000 está disponível

### Passo 2: Testar o endpoint manualmente

Abra o navegador e acesse:

```
http://localhost:3000/api/auth/login
```

**Resultados esperados:**
- ✅ Se aparecer erro 405 (Method Not Allowed): **Backend está funcionando!** O erro é normal porque você está fazendo GET em um endpoint POST.
- ❌ Se aparecer "Cannot GET /api/auth/login": O endpoint não existe ou o prefixo `/api` não está configurado
- ❌ Se aparecer "ERR_CONNECTION_REFUSED": O backend não está rodando

### Passo 3: Verificar o Console do Navegador

Abra o DevTools (F12) e vá na aba Console. Ao tentar fazer login, você deve ver:

```
🔗 API Base URL: /api
🔗 URL de login: /api/auth/login
📤 Enviando requisição para: /api/auth/login
```

**Se você ver:**
- `🔗 API Base URL: /api` ✅ Correto (usando proxy)
- `🔗 API Base URL: http://localhost:3000/api` ⚠️ Pode funcionar, mas não usa o proxy

### Passo 4: Verificar o Proxy do Vite

O Vite está configurado para fazer proxy de `/api` para `http://localhost:3000`.

**Verifique se:**
1. O arquivo `frontend/vite.config.ts` tem a configuração de proxy
2. O frontend foi reiniciado após adicionar o proxy
3. O backend está rodando na porta 3000

### Passo 5: Verificar CORS

Se o backend estiver rodando mas ainda houver erro, verifique CORS:

1. Abra `backend/src/main.ts`
2. Verifique a linha 90:
   ```typescript
   const origin = corsOrigins === '*' ? true : corsOrigins?.split(',') || ['http://localhost:3001', 'http://localhost:3004'];
   ```
3. Certifique-se de que `http://localhost:3001` está na lista

**Ou configure no `.env` do backend:**
```
CORS_ORIGINS=*
```

### Passo 6: Verificar Variáveis de Ambiente

**Backend (`backend/.env`):**
```env
PORT=3000
CORS_ORIGINS=http://localhost:3001
DATABASE_URL=postgresql://postgres:senha@localhost:5432/eletroon
JWT_SECRET=seu-jwt-secret-aqui
JWT_EXPIRATION_TIME=24h
```

**Frontend (`frontend/.env`):**
```env
# Deixe vazio para usar o proxy do Vite em desenvolvimento
# Ou defina: VITE_API_URL=http://localhost:3000/api
```

## 🔍 Logs de Debug

Agora o sistema tem logs detalhados. Ao tentar fazer login, você verá no console:

- 🔗 URL sendo usada
- 📤 Requisições sendo enviadas
- 📥 Respostas recebidas
- ❌ Erros detalhados com dicas

## ✅ Checklist Rápido

- [ ] Backend está rodando na porta 3000
- [ ] Frontend está rodando na porta 3001
- [ ] Console mostra `🔗 API Base URL: /api`
- [ ] Não há erros no terminal do backend
- [ ] CORS está configurado corretamente
- [ ] Banco de dados está acessível

## 🆘 Ainda não funciona?

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Reinicie ambos os servidores** (frontend e backend)
3. **Verifique os logs completos** no console do navegador
4. **Teste o endpoint diretamente** no navegador: `http://localhost:3000/api/auth/login`

