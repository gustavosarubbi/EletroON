# Como Regenerar o Prisma Client e Aplicar Migrações

## Problemas Comuns

### 1. Prisma Client Desatualizado

O Prisma Client foi gerado antes da relação `rooms` ser adicionada ao modelo `User` no schema. Isso causa erros como:

```
Unknown field `rooms` for include statement on model User
```

### 2. Migrações Não Aplicadas

As tabelas `Room` e `UserRoom` não existem no banco de dados. Isso causa erros como:

```
relação "UserRoom" não existe
```

## Solução Temporária

Foi implementado um workaround usando queries raw do Prisma para buscar as salas (`rooms`) diretamente do banco de dados, sem depender da relação no Prisma Client. Isso permite que o código funcione mesmo com o Prisma Client desatualizado.

## Solução Definitiva

### Passo 1: Aplicar Migrações

Primeiro, certifique-se de que todas as migrações foram aplicadas ao banco de dados:

```powershell
cd backend
npx prisma migrate deploy
```

Isso criará as tabelas `Room` e `UserRoom` no banco de dados.

### Passo 2: Regenerar o Prisma Client

Para resolver completamente o problema, você precisa regenerar o Prisma Client quando o servidor **NÃO estiver rodando**.

1. **Pare o servidor** (Ctrl+C no terminal onde está rodando)

2. **Execute o script de regeneração:**
   ```powershell
   cd backend
   .\regenerate-prisma.ps1
   ```

   Ou manualmente:
   ```powershell
   cd backend
   npx prisma generate
   ```

3. **Inicie o servidor novamente:**
   ```powershell
   npm run start:dev
   ```

### Verificação

Para verificar o status das migrações:
```powershell
npx prisma migrate status
```

Após regenerar, o Prisma Client deve reconhecer a relação `rooms` e você pode remover os workarounds temporários (queries raw) do código, voltando a usar `include: { rooms: ... }` normalmente.

## Nota

O workaround atual funciona perfeitamente, mas regenerar o Prisma Client é recomendado para:
- Melhor performance (queries otimizadas)
- Type safety completo
- Código mais limpo e manutenível

**Importante:** Sempre aplique as migrações antes de regenerar o Prisma Client para garantir que o banco de dados esteja sincronizado com o schema.

