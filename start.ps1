# Script de inicialização do EletroON para Windows
# Este script facilita o deploy em diferentes ambientes

param(
    [Parameter(Position=0)]
    [string]$Command = "start"
)

# Função para imprimir mensagens coloridas
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Header {
    Write-Host "================================" -ForegroundColor Blue
    Write-Host "  EletroON - Sistema de Monitoramento" -ForegroundColor Blue
    Write-Host "================================" -ForegroundColor Blue
}

# Função para verificar dependências
function Test-Dependencies {
    Write-Info "Verificando dependências..."
    
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js não está instalado"
        exit 1
    }
    
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error "npm não está instalado"
        exit 1
    }
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Warning "Docker não está instalado - deploy local será usado"
        $script:USE_DOCKER = $false
    } else {
        $script:USE_DOCKER = $true
    }
    
    Write-Info "Dependências verificadas com sucesso"
}

# Função para configurar ambiente
function Initialize-Environment {
    Write-Info "Configurando ambiente..."
    
    # Verificar se arquivos .env existem
    if (-not (Test-Path "api-eletroon\.env")) {
        Write-Warning "Arquivo .env não encontrado no backend"
        Write-Info "Copiando env.example para .env..."
        Copy-Item "api-eletroon\env.example" "api-eletroon\.env"
        Write-Warning "Configure o arquivo api-eletroon\.env antes de continuar"
    }
    
    if (-not (Test-Path "front-eletroon\.env.local")) {
        Write-Warning "Arquivo .env.local não encontrado no frontend"
        Write-Info "Copiando env.example para .env.local..."
        Copy-Item "front-eletroon\env.example" "front-eletroon\.env.local"
        Write-Warning "Configure o arquivo front-eletroon\.env.local antes de continuar"
    }
    
    Write-Info "Ambiente configurado"
}

# Função para deploy local
function Start-LocalDeploy {
    Write-Info "Iniciando deploy local..."
    
    # Backend
    Write-Info "Iniciando backend..."
    Set-Location "api-eletroon"
    npm install
    npm run build
    Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "start:prod"
    Set-Location ".."
    
    # Aguardar backend inicializar
    Start-Sleep -Seconds 5
    
    # Frontend
    Write-Info "Iniciando frontend..."
    Set-Location "front-eletroon"
    npm install
    npm run build
    Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "start:prod"
    Set-Location ".."
    
    Write-Info "Deploy local concluído!"
    Write-Info "Backend rodando em: http://localhost:3000"
    Write-Info "Frontend rodando em: http://localhost:3001"
    Write-Info "Documentação da API: http://localhost:3000/api/docs"
    
    Write-Info "Para parar as aplicações, feche os terminais ou use Ctrl+C"
}

# Função para deploy com Docker
function Start-DockerDeploy {
    Write-Info "Iniciando deploy com Docker..."
    
    # Verificar se docker-compose está disponível
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error "docker-compose não está instalado"
        exit 1
    }
    
    # Construir e iniciar containers
    Write-Info "Construindo containers..."
    docker-compose build
    
    Write-Info "Iniciando serviços..."
    docker-compose up -d
    
    Write-Info "Deploy Docker concluído!"
    Write-Info "Aplicação rodando em: http://localhost"
    Write-Info "API rodando em: http://localhost/api"
    Write-Info "Documentação da API: http://localhost/api/docs"
    
    Write-Info "Para ver logs: docker-compose logs -f"
    Write-Info "Para parar: docker-compose down"
}

# Função para mostrar status
function Get-Status {
    Write-Info "Verificando status dos serviços..."
    
    if ($script:USE_DOCKER) {
        $dockerStatus = docker-compose ps 2>$null
        if ($dockerStatus -and $dockerStatus -match "Up") {
            Write-Info "Serviços Docker estão rodando"
            docker-compose ps
        } else {
            Write-Warning "Serviços Docker não estão rodando"
        }
    } else {
        # Verificar processos locais
        $backendProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "3000" }
        if ($backendProcesses) {
            Write-Info "Backend está rodando (porta 3000)"
        } else {
            Write-Warning "Backend não está rodando"
        }
        
        $frontendProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "3001" }
        if ($frontendProcesses) {
            Write-Info "Frontend está rodando (porta 3001)"
        } else {
            Write-Warning "Frontend não está rodando"
        }
    }
}

# Função para parar serviços
function Stop-Services {
    Write-Info "Parando serviços..."
    
    if ($script:USE_DOCKER) {
        docker-compose down
        Write-Info "Serviços Docker parados"
    } else {
        # Parar processos locais
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "3000|3001" } | Stop-Process -Force
        Write-Info "Serviços locais parados"
    }
}

# Função para mostrar ajuda
function Show-Help {
    Write-Host "Uso: .\start.ps1 [COMANDO]" -ForegroundColor White
    Write-Host ""
    Write-Host "Comandos:" -ForegroundColor White
    Write-Host "  start     - Iniciar aplicação (local ou Docker)" -ForegroundColor White
    Write-Host "  stop      - Parar aplicação" -ForegroundColor White
    Write-Host "  status    - Mostrar status dos serviços" -ForegroundColor White
    Write-Host "  local     - Deploy local (sem Docker)" -ForegroundColor White
    Write-Host "  docker    - Deploy com Docker" -ForegroundColor White
    Write-Host "  help      - Mostrar esta ajuda" -ForegroundColor White
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor White
    Write-Host "  .\start.ps1 start     # Inicia com método automático" -ForegroundColor White
    Write-Host "  .\start.ps1 local     # Força deploy local" -ForegroundColor White
    Write-Host "  .\start.ps1 docker    # Força deploy com Docker" -ForegroundColor White
}

# Função principal
function Main {
    Write-Header
    
    # Verificar dependências
    Test-Dependencies
    
    # Configurar ambiente
    Initialize-Environment
    
    # Processar argumentos
    switch ($Command) {
        "start" {
            if ($script:USE_DOCKER) {
                Start-DockerDeploy
            } else {
                Start-LocalDeploy
            }
        }
        "local" {
            Start-LocalDeploy
        }
        "docker" {
            if ($script:USE_DOCKER) {
                Start-DockerDeploy
            } else {
                Write-Error "Docker não está disponível"
                exit 1
            }
        }
        "stop" {
            Stop-Services
        }
        "status" {
            Get-Status
        }
        "help" {
            Show-Help
        }
        default {
            Write-Error "Comando inválido: $Command"
            Show-Help
            exit 1
        }
    }
}

# Executar função principal
Main
