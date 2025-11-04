# Script para configurar o banco de dados EletroON
# Execute este script apÃ³s configurar a senha correta no arquivo .env

Write-Host "Configurando banco de dados EletroON..." -ForegroundColor Green

# Adiciona PostgreSQL ao PATH da sessÃ£o atual
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"

# LÃª a DATABASE_URL do arquivo .env
$envContent = Get-Content .env -Raw
if ($envContent -match 'DATABASE_URL=postgresql://postgres:([^@]+)@') {
    $password = $matches[1]
    $env:PGPASSWORD = $password
    
    Write-Host "
1. Criando banco de dados 'eletroon' (se nÃ£o existir)..." -ForegroundColor Yellow
    psql -U postgres -h localhost -p 5432 -c "SELECT 1 FROM pg_database WHERE datname='eletroon'" -t -A | ForEach-Object {
        if ($_ -ne "1") {
            psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE eletroon;"
            Write-Host "   Banco de dados 'eletroon' criado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "   Banco de dados 'eletroon' jÃ¡ existe." -ForegroundColor Green
        }
    }
    
    Write-Host "
2. Executando migraÃ§Ãµes do Prisma..." -ForegroundColor Yellow
    cd ..
    pnpm prisma:migrate
    
    Write-Host "
âœ… ConfiguraÃ§Ã£o do banco de dados concluÃ­da!" -ForegroundColor Green
} else {
    Write-Host "Erro: NÃ£o foi possÃ­vel encontrar a senha no arquivo .env" -ForegroundColor Red
    Write-Host "Certifique-se de que a DATABASE_URL estÃ¡ configurada corretamente." -ForegroundColor Red
}
