# Correções para Problemas de Travamento

Este documento descreve as correções implementadas para resolver problemas de travamento do servidor backend.

## Problemas Identificados e Corrigidos

### 1. ✅ Função `isPortAvailable` Melhorada

**Problema:** A função tinha race conditions e não fazia cleanup adequado dos servidores de teste.

**Solução:**
- Timeout aumentado de 1s para 2s
- Cleanup adequado com `removeAllListeners()`
- Uso de `once()` em vez de `on()` para evitar múltiplos handlers
- Melhor tratamento de erros

**Arquivo:** `backend/src/main.ts` (linhas 13-61)

### 2. ✅ Timeout no `app.listen()`

**Problema:** O servidor podia travar indefinidamente se houvesse problemas na inicialização do servidor HTTP.

**Solução:**
- Adicionado timeout de 10 segundos usando `Promise.race()`
- Aplicado tanto na tentativa inicial quanto no fallback de porta alternativa

**Arquivo:** `backend/src/main.ts` (linhas 272-298)

### 3. ✅ Timeout na Conexão do Prisma

**Problema:** A conexão com o banco de dados podia travar indefinidamente se o banco não estivesse acessível.

**Solução:**
- Adicionado timeout de 10 segundos na conexão inicial
- Usando `Promise.race()` para garantir que a conexão não trave

**Arquivo:** `backend/src/prisma/prisma.service.ts` (linhas 48-55)

### 4. ✅ Melhor Tratamento de Erros Fatais

**Problema:** Erros não capturados não encerravam o processo, deixando-o em estado inconsistente. Além disso, em modo watch, `process.exit()` fazia o watch mode parar de funcionar.

**Solução:**
- Detecção automática do modo watch
- Em modo watch: não usa `process.exit()`, permite que o NestJS reinicie automaticamente
- Em produção: `uncaughtException` encerra o processo após 5 segundos
- Evita processos "zombie" que mantêm portas ocupadas
- Permite que o watch mode continue funcionando mesmo com erros

**Arquivo:** `backend/src/main.ts` (linhas 10-13, 94-112, 325-337, 340-355)

### 5. ✅ Script de Limpeza de Portas

**Problema:** Processos travados nas portas 3000, 3001, 3002 precisavam ser encerrados manualmente.

**Solução:**
- Script PowerShell `clean-ports.ps1` que:
  - Identifica processos nas portas 3000, 3001, 3002
  - Mostra informações dos processos
  - Permite encerrar processos travados com confirmação

**Arquivo:** `backend/clean-ports.ps1`

## Como Usar

### Limpar Portas Travadas

**Opção 1: Usando o script npm**
```powershell
cd backend
pnpm run clean:ports
```

**Opção 2: Executar diretamente**
```powershell
cd backend
.\clean-ports.ps1
```

**Opção 3: Manualmente (PowerShell)**
```powershell
# Encontrar processos
3000, 3001, 3002 | ForEach-Object {
    $port = $_
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) {
        Write-Host "Porta $port ocupada pelo processo $process"
        Stop-Process -Id $process -Force
    }
}
```

### Iniciar o Backend

Após limpar as portas, inicie o backend normalmente:

```powershell
cd backend
pnpm run start:dev
```

Ou a partir da raiz do projeto:

```powershell
pnpm run dev:backend
```

## Melhorias Implementadas

1. **Timeouts em Operações Críticas:**
   - Verificação de porta: 2 segundos
   - Inicialização do servidor: 10 segundos
   - Conexão com banco: 10 segundos

2. **Cleanup Adequado:**
   - Servidores de teste são fechados corretamente
   - Listeners são removidos antes de fechar
   - Processos encerram graciosamente

3. **Melhor Detecção de Problemas:**
   - Logs mais informativos
   - Warnings quando portas estão ocupadas
   - Erros claros quando timeouts ocorrem

4. **Compatibilidade com Watch Mode:**
   - Detecção automática do modo watch
   - Não usa `process.exit()` em modo watch
   - Permite reinicialização automática pelo NestJS
   - Watch mode continua funcionando mesmo com erros

5. **Ferramentas de Diagnóstico:**
   - Script de limpeza de portas
   - Logs detalhados de inicialização

## Prevenção de Problemas Futuros

1. **Sempre use Ctrl+C para encerrar o servidor** em vez de fechar o terminal
2. **Execute `pnpm run clean:ports`** antes de iniciar se houver problemas
3. **Verifique os logs** se o servidor não iniciar na porta esperada
4. **Mantenha apenas uma instância** do servidor rodando por vez
5. **Em modo watch, erros não encerram o processo** - o NestJS reinicia automaticamente
6. **Se o watch mode parar**, verifique os logs para erros que impedem a reinicialização

## Troubleshooting

### Servidor não inicia na porta 3000

**Sintoma:** Logs mostram "Porta 3000 ocupada, usando porta 3002"

**Solução:**
```powershell
pnpm run clean:ports
# Depois reinicie o servidor
```

### Timeout na conexão com banco

**Sintoma:** Erro "Timeout: Conexão com banco de dados excedeu 10 segundos"

**Solução:**
1. Verifique se o banco de dados está rodando
2. Verifique a variável `DATABASE_URL` no `.env`
3. Verifique a conectividade de rede

### Timeout na inicialização do servidor

**Sintoma:** Erro "Timeout: Servidor não iniciou em 10 segundos"

**Solução:**
1. Verifique se há processos travados: `pnpm run clean:ports`
2. Verifique os logs para erros anteriores
3. Reinicie o computador se o problema persistir

### Watch mode para de funcionar

**Sintoma:** `pnpm run start:dev` para de funcionar após algum tempo, sem travar

**Causa:** O código estava usando `process.exit(1)` em erros, o que encerrava o processo filho e fazia o watch mode parar.

**Solução Implementada:**
- Detecção automática do modo watch
- Em modo watch, erros não encerram o processo com `process.exit()`
- O NestJS watch mode reinicia automaticamente quando há erros
- Logs mostram "⚠️ Modo watch detectado - aguardando reinicialização..."

**Como verificar:**
- Se você ver a mensagem "⚠️ Modo watch detectado" nos logs, o watch mode está funcionando corretamente
- Se o watch mode parar completamente, verifique se há erros de compilação TypeScript

## Notas Técnicas

- Os timeouts são configurados para serem suficientes em condições normais, mas podem precisar ser ajustados em ambientes mais lentos
- O script de limpeza usa `-Force` para garantir que processos travados sejam encerrados
- O tratamento de `uncaughtException` aguarda 5 segundos antes de encerrar para permitir que logs sejam escritos (apenas em produção)
- **Modo Watch:** A detecção do modo watch verifica:
  - Presença de `--watch` nos argumentos da linha de comando
  - Variável de ambiente `NODE_ENV === 'development'`
  - Variável de ambiente `NEST_WATCH === 'true'`
- Em modo watch, erros são lançados em vez de usar `process.exit()`, permitindo que o NestJS reinicie automaticamente

