# Guia de Configuração - EletroON

## ✅ O que já foi configurado

1. ✅ Arquivo `.env` do backend criado em `backend/.env`
2. ✅ Arquivo `.env` do frontend criado em `frontend/.env`
3. ✅ Dependências do backend instaladas
4. ✅ Dependências do frontend instaladas
5. ✅ Prisma Client gerado

## ⚠️ Pendente: Configuração do PostgreSQL

O banco de dados PostgreSQL precisa ser instalado e configurado antes de executar as migrações.

### Passo 1: Instalar PostgreSQL

1. Baixe o PostgreSQL: https://www.postgresql.org/download/windows/
2. Durante a instalação:
   - Configure uma senha para o usuário `postgres` (anote essa senha!)
   - Deixe a porta padrão como `5432`
   - Instale os componentes padrão

### Passo 2: Verificar se o PostgreSQL está rodando

Abra o PowerShell e execute:

```powershell
Get-Service -Name "*postgres*"
```

Se o serviço estiver parado, inicie-o:

```powershell
Start-Service -Name "postgresql-x64-XX"  # Substitua XX pela versão instalada
```

Ou inicie manualmente:
1. Abra o "Gerenciador de Serviços" (Services)
2. Procure por "postgresql"
3. Clique com o botão direito e selecione "Iniciar"

### Passo 3: Atualizar a senha no arquivo .env

Edite o arquivo `backend/.env` e altere a senha na linha `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/eletroon?schema=public
```

Substitua `SUA_SENHA_AQUI` pela senha que você configurou durante a instalação do PostgreSQL.

### Passo 4: Adicionar PostgreSQL ao PATH (se necessário)

Se o comando `psql` não for reconhecido, adicione o PostgreSQL ao PATH:

```powershell
# Verifique qual versão você instalou (geralmente 15, 16 ou 17)
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"  # Ajuste a versão conforme necessário
```

Para tornar permanente, adicione ao PATH do sistema através das Configurações do Windows.

### Passo 5: Criar o banco de dados

Execute no PowerShell:

```powershell
cd C:\Users\gustavo.balieiro\Desktop\EletroON\backend

# Opção 1: Usando psql (se estiver no PATH)
psql -U postgres -c "CREATE DATABASE eletroon;"

# Opção 2: Usando pgAdmin (interface gráfica)
# Abra o pgAdmin e crie o banco manualmente
```

### Passo 6: Executar as migrações

Depois de criar o banco de dados, execute:

```powershell
cd C:\Users\gustavo.balieiro\Desktop\EletroON\backend
pnpm prisma migrate deploy
```

### Passo 7: Verificar se está funcionando

```powershell
# Abrir Prisma Studio (interface visual do banco)
pnpm prisma:studio
```

## 🚀 Iniciar o projeto

### Backend

```powershell
cd C:\Users\gustavo.balieiro\Desktop\EletroON\backend
pnpm start:dev
```

A API estará disponível em: `http://localhost:3000/api`

### Frontend

```powershell
cd C:\Users\gustavo.balieiro\Desktop\EletroON\frontend
pnpm dev
```

O frontend estará disponível em: `http://localhost:5173` (ou outra porta que o Vite indicar)

## 📝 Credenciais padrão

Após a primeira inicialização do backend, os seguintes usuários serão criados automaticamente:

- **Admin**: 
  - Email: `admin@eletroon.com`
  - Senha: `admin123`

- **Usuário**: 
  - Email: `usuario@eletroon.com`
  - Senha: `User@123`

## 🔧 Solução de problemas

### Erro: "Can't reach database server"
- Verifique se o PostgreSQL está rodando
- Verifique se a porta está correta (padrão: 5432)
- Verifique se a senha no `.env` está correta

### Erro: "password authentication failed"
- Verifique se a senha no arquivo `.env` está correta
- Tente redefinir a senha do usuário postgres

### Erro: "database does not exist"
- Execute o comando para criar o banco: `psql -U postgres -c "CREATE DATABASE eletroon;"`

### PostgreSQL não encontrado
- Adicione o PostgreSQL ao PATH do sistema
- Ou use o caminho completo do executável psql


