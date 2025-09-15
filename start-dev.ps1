# Script para iniciar desenvolvimento completo do EletroON
# Frontend (porta 3001) + Backend (porta 3000)
# ⚠️ IMPORTANTE: Este projeto usa pnpm para gerenciamento de pacotes

Write-Host "🚀 Iniciando desenvolvimento completo do EletroON..." -ForegroundColor Green
Write-Host ""

# Verificar se pnpm está instalado
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm não está instalado. Instale com: npm install -g pnpm" -ForegroundColor Red
    exit 1
}

# Função para iniciar backend
function Start-Backend {
    Write-Host "🔧 Iniciando Backend (porta 3000)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api-eletroon; pnpm run start:dev"
}

# Função para iniciar frontend
function Start-Frontend {
    Write-Host "🎨 Iniciando Frontend (porta 3001)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd front-eletroon; pnpm run dev"
}

# Aguardar um pouco entre os inícios
Start-Backend
Start-Sleep -Seconds 3
Start-Frontend

Write-Host ""
Write-Host "✅ Desenvolvimento iniciado!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Use Ctrl+C para parar este script" -ForegroundColor Gray



