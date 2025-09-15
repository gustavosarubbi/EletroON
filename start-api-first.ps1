# Script para iniciar o EletroON com API primeiro
# Garante que a API esteja rodando antes de iniciar o frontend
# ⚠️ IMPORTANTE: Este projeto usa pnpm para gerenciamento de pacotes

Write-Host "🚀 Iniciando EletroON com API primeiro..." -ForegroundColor Green
Write-Host ""

# Verificar se pnpm está instalado
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm não está instalado. Instale com: npm install -g pnpm" -ForegroundColor Red
    exit 1
}

# Função para verificar se a API está rodando
function Test-ApiRunning {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api" -Method GET -TimeoutSec 5 -ErrorAction Stop
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# Função para aguardar a API ficar disponível
function Wait-ForApi {
    $maxAttempts = 30
    $attempt = 0
    
    Write-Host "⏳ Aguardando API ficar disponível..." -ForegroundColor Yellow
    
    while ($attempt -lt $maxAttempts) {
        if (Test-ApiRunning) {
            Write-Host "✅ API está rodando!" -ForegroundColor Green
            return $true
        }
        
        $attempt++
        Write-Host "🔄 Tentativa $attempt/$maxAttempts - Aguardando API..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
    
    Write-Host "❌ Timeout: API não ficou disponível em $($maxAttempts * 2) segundos" -ForegroundColor Red
    return $false
}

# Função para iniciar backend
function Start-Backend {
    Write-Host "🔧 Iniciando Backend (porta 3000)..." -ForegroundColor Yellow
    
    # Verificar se já está rodando
    if (Test-ApiRunning) {
        Write-Host "✅ API já está rodando!" -ForegroundColor Green
        return $true
    }
    
    # Iniciar backend em nova janela
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api-eletroon; pnpm run start:dev"
    
    # Aguardar API ficar disponível
    return Wait-ForApi
}

# Função para iniciar frontend
function Start-Frontend {
    Write-Host "🎨 Iniciando Frontend (porta 3001)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd front-eletroon; pnpm run dev"
}

# Função principal
function Main {
    Write-Host "📋 Verificando dependências..." -ForegroundColor Blue
    
    # Verificar se as pastas existem
    if (-not (Test-Path "api-eletroon")) {
        Write-Host "❌ Pasta api-eletroon não encontrada!" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Path "front-eletroon")) {
        Write-Host "❌ Pasta front-eletroon não encontrada!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Dependências verificadas!" -ForegroundColor Green
    Write-Host ""
    
    # Iniciar backend primeiro
    if (Start-Backend) {
        Write-Host ""
        Write-Host "🎯 API está pronta! Iniciando frontend..." -ForegroundColor Green
        
        # Aguardar um pouco para garantir que a API está estável
        Start-Sleep -Seconds 3
        
        # Iniciar frontend
        Start-Frontend
        
        Write-Host ""
        Write-Host "✅ EletroON iniciado com sucesso!" -ForegroundColor Green
        Write-Host "🌐 Frontend: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "🔧 Backend: http://localhost:3000" -ForegroundColor Yellow
        Write-Host "📊 API Docs: http://localhost:3000/api" -ForegroundColor Blue
        Write-Host ""
        Write-Host "💡 Dica: O frontend agora só mostrará dados reais da API!" -ForegroundColor Magenta
        Write-Host "💡 Se a API não estiver rodando, você verá mensagens de erro." -ForegroundColor Magenta
        Write-Host ""
        Write-Host "🛑 Para parar: Feche as janelas do PowerShell ou use Ctrl+C" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "❌ Falha ao iniciar a API. Verifique os logs acima." -ForegroundColor Red
        Write-Host "💡 Dica: Execute 'cd api-eletroon && pnpm run start:dev' para ver os erros" -ForegroundColor Yellow
        exit 1
    }
}

# Executar função principal
Main

