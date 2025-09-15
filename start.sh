#!/bin/bash

# Script de inicialização do EletroON
# Este script facilita o deploy em diferentes ambientes

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  EletroON - Sistema de Monitoramento${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Função para verificar dependências
check_dependencies() {
    print_message "Verificando dependências..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js não está instalado"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm não está instalado"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker não está instalado - deploy local será usado"
        USE_DOCKER=false
    else
        USE_DOCKER=true
    fi
    
    print_message "Dependências verificadas com sucesso"
}

# Função para configurar ambiente
setup_environment() {
    print_message "Configurando ambiente..."
    
    # Verificar se arquivos .env existem
    if [ ! -f "api-eletroon/.env" ]; then
        print_warning "Arquivo .env não encontrado no backend"
        print_message "Copiando env.example para .env..."
        cp api-eletroon/env.example api-eletroon/.env
        print_warning "Configure o arquivo api-eletroon/.env antes de continuar"
    fi
    
    if [ ! -f "front-eletroon/.env.local" ]; then
        print_warning "Arquivo .env.local não encontrado no frontend"
        print_message "Copiando env.example para .env.local..."
        cp front-eletroon/env.example front-eletroon/.env.local
        print_warning "Configure o arquivo front-eletroon/.env.local antes de continuar"
    fi
    
    print_message "Ambiente configurado"
}

# Função para deploy local
deploy_local() {
    print_message "Iniciando deploy local..."
    
    # Backend
    print_message "Iniciando backend..."
    cd api-eletroon
    npm install
    npm run build
    npm run start:prod &
    BACKEND_PID=$!
    cd ..
    
    # Aguardar backend inicializar
    sleep 5
    
    # Frontend
    print_message "Iniciando frontend..."
    cd front-eletroon
    npm install
    npm run build
    npm run start:prod &
    FRONTEND_PID=$!
    cd ..
    
    print_message "Deploy local concluído!"
    print_message "Backend rodando em: http://localhost:3000"
    print_message "Frontend rodando em: http://localhost:3001"
    print_message "Documentação da API: http://localhost:3000/api/docs"
    
    # Função para limpeza
    cleanup() {
        print_message "Encerrando aplicações..."
        kill $BACKEND_PID 2>/dev/null || true
        kill $FRONTEND_PID 2>/dev/null || true
        exit 0
    }
    
    trap cleanup SIGINT SIGTERM
    
    print_message "Pressione Ctrl+C para parar as aplicações"
    wait
}

# Função para deploy com Docker
deploy_docker() {
    print_message "Iniciando deploy com Docker..."
    
    # Verificar se docker-compose está disponível
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose não está instalado"
        exit 1
    fi
    
    # Construir e iniciar containers
    print_message "Construindo containers..."
    docker-compose build
    
    print_message "Iniciando serviços..."
    docker-compose up -d
    
    print_message "Deploy Docker concluído!"
    print_message "Aplicação rodando em: http://localhost"
    print_message "API rodando em: http://localhost/api"
    print_message "Documentação da API: http://localhost/api/docs"
    
    print_message "Para ver logs: docker-compose logs -f"
    print_message "Para parar: docker-compose down"
}

# Função para mostrar status
show_status() {
    print_message "Verificando status dos serviços..."
    
    if [ "$USE_DOCKER" = true ]; then
        if docker-compose ps | grep -q "Up"; then
            print_message "Serviços Docker estão rodando"
            docker-compose ps
        else
            print_warning "Serviços Docker não estão rodando"
        fi
    else
        # Verificar processos locais
        if pgrep -f "node.*3000" > /dev/null; then
            print_message "Backend está rodando (porta 3000)"
        else
            print_warning "Backend não está rodando"
        fi
        
        if pgrep -f "next.*3001" > /dev/null; then
            print_message "Frontend está rodando (porta 3001)"
        else
            print_warning "Frontend não está rodando"
        fi
    fi
}

# Função para parar serviços
stop_services() {
    print_message "Parando serviços..."
    
    if [ "$USE_DOCKER" = true ]; then
        docker-compose down
        print_message "Serviços Docker parados"
    else
        # Parar processos locais
        pkill -f "node.*3000" 2>/dev/null || true
        pkill -f "next.*3001" 2>/dev/null || true
        print_message "Serviços locais parados"
    fi
}

# Função para mostrar ajuda
show_help() {
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos:"
    echo "  start     - Iniciar aplicação (local ou Docker)"
    echo "  stop      - Parar aplicação"
    echo "  status    - Mostrar status dos serviços"
    echo "  local     - Deploy local (sem Docker)"
    echo "  docker    - Deploy com Docker"
    echo "  help      - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 start     # Inicia com método automático"
    echo "  $0 local     # Força deploy local"
    echo "  $0 docker    # Força deploy com Docker"
}

# Função principal
main() {
    print_header
    
    # Verificar dependências
    check_dependencies
    
    # Configurar ambiente
    setup_environment
    
    # Processar argumentos
    case "${1:-start}" in
        "start")
            if [ "$USE_DOCKER" = true ]; then
                deploy_docker
            else
                deploy_local
            fi
            ;;
        "local")
            deploy_local
            ;;
        "docker")
            if [ "$USE_DOCKER" = true ]; then
                deploy_docker
            else
                print_error "Docker não está disponível"
                exit 1
            fi
            ;;
        "stop")
            stop_services
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Comando inválido: $1"
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"
