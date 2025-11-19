# 🔧 Correção: Backend Parando Após 15 Minutos

## Problema
O backend para de funcionar após aproximadamente 15 minutos de execução.

## Causas Possíveis
1. **Timeout de conexão do PostgreSQL** - Conexões inativas são fechadas após 15 minutos
2. **Pool de conexões esgotado** - Muitas conexões abertas sem fechar
3. **Erros não tratados** - Erros silenciosos que causam crash

## Soluções Implementadas

### 1. Configuração de Pool na DATABASE_URL

Adicione parâmetros de pool na sua `DATABASE_URL` no arquivo `.env`:

```env
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/eletroon?schema=public&connection_limit=10&pool_timeout=20&connect_timeout=10
```

**Parâmetros importantes:**
- `connection_limit=10` - Limite de conexões no pool
- `pool_timeout=20` - Timeout do pool em segundos
- `connect_timeout=10` - Timeout de conexão em segundos

### 2. Keep-Alive Automático

O PrismaService agora verifica a conexão a cada 5 minutos fazendo uma query simples (`SELECT 1`), mantendo a conexão ativa.

### 3. Reconexão Automática

Se a conexão for perdida, o sistema tenta reconectar automaticamente.

### 4. Tratamento de Erros Melhorado

- Erros não capturados são logados mas não encerram o processo
- Logs detalhados para identificar problemas

## Como Aplicar

1. **Atualize o arquivo `.env`** com os parâmetros de pool:
   ```env
   DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/eletroon?schema=public&connection_limit=10&pool_timeout=20&connect_timeout=10
   ```

2. **Reinicie o backend:**
   ```powershell
   cd backend
   pnpm start:dev
   ```

## Monitoramento

O sistema agora loga:
- ⚠️ Quando detecta perda de conexão
- ✅ Quando reconecta com sucesso
- ❌ Erros de conexão detalhados
- ⚠️ Queries lentas (mais de 5 segundos)

## Verificação

Após aplicar as correções, monitore os logs do backend. Você deve ver:
- `✅ Conectado ao banco de dados com sucesso` na inicialização
- Queries de keep-alive silenciosas a cada 5 minutos
- Se houver perda de conexão: `⚠️ Conexão com banco perdida, tentando reconectar...`

## Se o Problema Persistir

1. **Verifique os logs** do backend para identificar o erro exato
2. **Verifique se o PostgreSQL está rodando:**
   ```powershell
   pg_isready -U postgres
   ```
3. **Verifique configurações do PostgreSQL:**
   - `idle_in_transaction_session_timeout` (padrão: 0 = desabilitado)
   - `statement_timeout` (padrão: 0 = desabilitado)
4. **Aumente os timeouts** na DATABASE_URL se necessário

