# Script Interativo para Configurar Banco de Dados EletroON

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuracao do Banco de Dados EletroON" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Arquivo .env nao encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "Por favor, informe a senha do PostgreSQL:" -ForegroundColor Yellow
Write-Host "Usuario: postgres" -ForegroundColor Gray
Write-Host ""

# Tentar ler a senha atual do .env
$envContent = Get-Content .env -Raw
if ($envContent -match 'DATABASE_URL=postgresql://postgres:([^@]+)@') {
    $currentPassword = $matches[1]
    Write-Host "Senha atual configurada: $currentPassword" -ForegroundColor Gray
    Write-Host ""
}

$password = Read-Host "Digite a senha do PostgreSQL (ou pressione Enter para usar a atual)"

if ([string]::IsNullOrWhiteSpace($password)) {
    if ($currentPassword) {
        $password = $currentPassword
    } else {
        Write-Host "❌ Senha nao fornecida!" -ForegroundColor Red
        exit 1
    }
}

# Atualizar o .env com a senha correta
$newDbUrl = "postgresql://postgres:$password@localhost:5432/eletroon?schema=public"
$envContent = $envContent -replace 'DATABASE_URL=.*', "DATABASE_URL=$newDbUrl"
[System.IO.File]::WriteAllText("$PWD\.env", $envContent, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "Testando conexao com PostgreSQL..." -ForegroundColor Cyan

# Tentar encontrar PostgreSQL
$pgVersions = @(17, 16, 15, 14, 13)
$pgFound = $false
foreach ($ver in $pgVersions) {
    $pgPath = "C:\Program Files\PostgreSQL\$ver\bin"
    if (Test-Path "$pgPath\psql.exe") {
        $env:Path += ";$pgPath"
        $pgFound = $true
        Write-Host "✓ PostgreSQL $ver encontrado" -ForegroundColor Green
        break
    }
}

if (-not $pgFound) {
    Write-Host "⚠️  PostgreSQL nao encontrado no PATH" -ForegroundColor Yellow
    Write-Host "   Tentando conectar diretamente..." -ForegroundColor Yellow
}

$env:PGPASSWORD = $password

# Testar conexao
$testResult = psql -U postgres -h localhost -p 5432 -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Conexao com PostgreSQL bem-sucedida!" -ForegroundColor Green
    Write-Host ""
    
    # Criar banco de dados
    Write-Host "Criando banco de dados 'eletroon'..." -ForegroundColor Cyan
    $dbExists = psql -U postgres -h localhost -p 5432 -t -A -c "SELECT 1 FROM pg_database WHERE datname='eletroon'" 2>&1
    
    if ($dbExists -match "1") {
        Write-Host "✓ Banco de dados 'eletroon' ja existe" -ForegroundColor Green
    } else {
        $createResult = psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE eletroon;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Banco de dados 'eletroon' criado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro ao criar banco de dados:" -ForegroundColor Red
            Write-Host $createResult -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host ""
    Write-Host "Executando migracoes do Prisma..." -ForegroundColor Cyan
    pnpm prisma:migrate:deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Banco de dados configurado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Próximos passos:" -ForegroundColor Cyan
        Write-Host "  1. Execute: pnpm prisma:generate" -ForegroundColor Yellow
        Write-Host "  2. Execute: pnpm start:dev" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "⚠️  Execute manualmente: pnpm prisma:migrate:deploy" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "❌ Erro ao conectar ao PostgreSQL!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possiveis problemas:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL nao esta instalado" -ForegroundColor Gray
    Write-Host "  2. PostgreSQL nao esta rodando" -ForegroundColor Gray
    Write-Host "  3. Senha incorreta" -ForegroundColor Gray
    Write-Host "  4. PostgreSQL nao esta configurado para aceitar conexoes TCP/IP" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Execute este script novamente e verifique a senha." -ForegroundColor Yellow
    exit 1
}

