# Script de inicialização do EletroON via Docker
# Execute este script para iniciar todo o sistema

Write-Host "🚀 Iniciando EletroON via Docker..." -ForegroundColor Green

# Verificar se o Docker está rodando
Write-Host "📋 Verificando Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está rodando. Inicie o Docker Desktop primeiro!" -ForegroundColor Red
    exit 1
}

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado. Copiando do env.example..." -ForegroundColor Red
    Copy-Item "env.example" ".env"
    Write-Host "✅ Arquivo .env criado. Configure as variáveis antes de continuar!" -ForegroundColor Yellow
    Write-Host "📝 Edite o arquivo .env com suas configurações e execute novamente." -ForegroundColor Yellow
    exit 1
}

# Parar containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose down

# Construir e iniciar os serviços
Write-Host "🔨 Construindo e iniciando serviços..." -ForegroundColor Yellow
docker-compose up --build -d

# Aguardar um pouco para os serviços iniciarem
Write-Host "⏳ Aguardando serviços iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar status dos containers
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "🎉 EletroON iniciado com sucesso!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🗄️ Banco PostgreSQL: localhost:5432" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Para ver os logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "🛑 Para parar: docker-compose down" -ForegroundColor Yellow
