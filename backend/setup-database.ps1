# Script para configurar o banco de dados EletroON
# Execute este script após configurar a senha correta no arquivo .env
# Este script NÃO usa Docker - configura PostgreSQL local

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configurando banco de dados EletroON" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Erro: Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "   Crie o arquivo .env na raiz do projeto ou copie o .env.example" -ForegroundColor Yellow
    exit 1
}

# Ler a DATABASE_URL do arquivo .env
$envContent = Get-Content .env -Raw
if ($envContent -match 'DATABASE_URL=postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/([^?]+)') {
    $username = $matches[1]
    $password = $matches[2]
    $dbHost = $matches[3]
    $port = $matches[4]
    $database = $matches[5]
    
    Write-Host "Configurações encontradas:" -ForegroundColor Yellow
    Write-Host "  Host: $dbHost" -ForegroundColor Gray
    Write-Host "  Porta: $port" -ForegroundColor Gray
    Write-Host "  Usuário: $username" -ForegroundColor Gray
    Write-Host "  Banco: $database" -ForegroundColor Gray
    Write-Host ""
    
    # Tentar encontrar PostgreSQL no PATH comum
    $pgPaths = @(
        "C:\Program Files\PostgreSQL\17\bin",
        "C:\Program Files\PostgreSQL\16\bin",
        "C:\Program Files\PostgreSQL\15\bin",
        "C:\Program Files\PostgreSQL\14\bin",
        "C:\Program Files\PostgreSQL\13\bin"
    )
    
    $pgFound = $false
    foreach ($pgPath in $pgPaths) {
        if (Test-Path $pgPath) {
            $env:Path += ";$pgPath"
            $pgFound = $true
            Write-Host "✓ PostgreSQL encontrado em: $pgPath" -ForegroundColor Green
            break
        }
    }
    
    if (-not $pgFound) {
        Write-Host "⚠️  PostgreSQL não encontrado no PATH padrão." -ForegroundColor Yellow
        Write-Host "   Certifique-se de que o PostgreSQL está instalado e acessível." -ForegroundColor Yellow
        Write-Host "   Você pode adicionar manualmente ao PATH ou executar:" -ForegroundColor Yellow
        Write-Host "   \$env:Path += ';C:\Program Files\PostgreSQL\XX\bin'" -ForegroundColor Cyan
        Write-Host ""
    }
    
    # Configurar senha do PostgreSQL
    $env:PGPASSWORD = $password
    
    Write-Host ""
    Write-Host "1. Criando banco de dados '$database' (se não existir)..." -ForegroundColor Yellow
    
    # Verificar se o banco existe
    $dbExists = psql -U $username -h $dbHost -p $port -t -A -c "SELECT 1 FROM pg_database WHERE datname='$database'" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao conectar ao PostgreSQL!" -ForegroundColor Red
        Write-Host "   Verifique se:" -ForegroundColor Yellow
        Write-Host "   - PostgreSQL está instalado e rodando" -ForegroundColor Yellow
        Write-Host "   - As credenciais no .env estão corretas" -ForegroundColor Yellow
        Write-Host "   - O servidor PostgreSQL está acessível em $dbHost`:$port" -ForegroundColor Yellow
        exit 1
    }
    
    if ($dbExists -match "1") {
        Write-Host "   ✓ Banco de dados '$database' já existe." -ForegroundColor Green
    } else {
        $createResult = psql -U $username -h $dbHost -p $port -c "CREATE DATABASE $database;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ Banco de dados '$database' criado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Erro ao criar banco de dados:" -ForegroundColor Red
            Write-Host "   $createResult" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host ""
    Write-Host "2. Executando migrações do Prisma..." -ForegroundColor Yellow
    
    # Navegar para o diretório backend se necessário
    if (Test-Path "backend") {
        Set-Location backend
    }
    
    # Executar migrações
    pnpm prisma:migrate:deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Configuração do banco de dados concluída!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Próximos passos:" -ForegroundColor Cyan
        Write-Host "  1. Execute 'pnpm prisma:generate' para gerar o Prisma Client" -ForegroundColor Yellow
        Write-Host "  2. Execute 'pnpm start:dev' para iniciar o servidor" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao executar migrações!" -ForegroundColor Red
        Write-Host "   Execute manualmente: pnpm prisma:migrate:deploy" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "❌ Erro: Não foi possível encontrar a DATABASE_URL no arquivo .env" -ForegroundColor Red
    Write-Host "   Certifique-se de que a DATABASE_URL está configurada corretamente." -ForegroundColor Yellow
    Write-Host "   Formato esperado: postgresql://usuario:senha@host:porta/database?schema=public" -ForegroundColor Yellow
    exit 1
}
