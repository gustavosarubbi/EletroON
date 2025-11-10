# Configuração do Banco de Dados - EletroON

Este guia explica como configurar o banco de dados PostgreSQL localmente **sem usar Docker**.

## Pré-requisitos

1. **PostgreSQL instalado localmente**
   - Baixe e instale o PostgreSQL: https://www.postgresql.org/download/windows/
   - Durante a instalação, configure uma senha para o usuário `postgres`
   - Anote a senha que você configurou

2. **Verificar se o PostgreSQL está rodando**
   - Abra o "Services" (Serviços) do Windows
   - Procure por "postgresql" e verifique se está rodando
   - Ou execute: `pg_isready -U postgres`

## Configuração do .env

1. **Edite o arquivo `.env` na raiz do projeto**

2. **Configure a DATABASE_URL** com suas credenciais:
   ```
   DATABASE_URL=postgresql://USUARIO:SENHA@localhost:5432/eletroon?schema=public
   ```
   
   Exemplo:
   ```
   DATABASE_URL=postgresql://postgres:minhasenha123@localhost:5432/eletroon?schema=public
   ```
   
   Onde:
   - `USUARIO`: geralmente `postgres` (ou o usuário que você criou)
   - `SENHA`: a senha que você configurou durante a instalação
   - `5432`: porta padrão do PostgreSQL (ajuste se necessário)
   - `eletroon`: nome do banco de dados (será criado automaticamente)

## Configuração do Banco de Dados

### Opção 1: Usando o Script Automático (Recomendado)

Execute o script PowerShell na pasta `backend`:

```powershell
cd backend
.\setup-database.ps1
```

O script irá:
- Criar o banco de dados `eletroon` se não existir
- Executar as migrações do Prisma automaticamente

### Opção 2: Configuração Manual

1. **Criar o banco de dados manualmente:**

   ```powershell
   # Adicione o PostgreSQL ao PATH (ajuste a versão conforme necessário)
   $env:Path += ";C:\Program Files\PostgreSQL\17\bin"
   
   # Crie o banco de dados
   psql -U postgres -c "CREATE DATABASE eletroon;"
   ```

   Ou usando pgAdmin ou outro cliente PostgreSQL.

2. **Executar as migrações:**

   ```powershell
   cd backend
   pnpm prisma:generate
   pnpm prisma:migrate:deploy
   ```

## Verificação

Após configurar, você pode verificar se está tudo funcionando:

```powershell
cd backend
pnpm prisma:studio
```

Isso abrirá o Prisma Studio, uma interface visual para verificar o banco de dados.

## Solução de Problemas

### Erro: "password authentication failed"
- Verifique se a senha no `.env` está correta
- Verifique se o usuário existe no PostgreSQL

### Erro: "database does not exist"
- Execute o script `setup-database.ps1` ou crie o banco manualmente

### Erro: "could not connect to server"
- Verifique se o PostgreSQL está rodando
- Verifique se a porta está correta (padrão: 5432)
- Verifique se o firewall não está bloqueando a conexão

### PostgreSQL não encontrado no PATH
- Adicione manualmente ao PATH:
  ```powershell
  $env:Path += ";C:\Program Files\PostgreSQL\VERSÃO\bin"
  ```
- Ou execute o `psql` com o caminho completo

## Próximos Passos

Após configurar o banco de dados:

1. Gere o Prisma Client:
   ```powershell
   cd backend
   pnpm prisma:generate
   ```

2. Inicie o servidor:
   ```powershell
   pnpm start:dev
   ```

3. Crie usuários através da API ou interface administrativa conforme necessário.

