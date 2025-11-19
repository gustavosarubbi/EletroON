# Script para atualizar DATABASE_URL com parâmetros de pool
# Este script adiciona parâmetros de pool à DATABASE_URL para evitar timeouts

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Atualizando DATABASE_URL com Pool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "❌ Erro: Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "   Crie o arquivo .env na raiz do projeto backend" -ForegroundColor Yellow
    exit 1
}

# Ler o conteúdo atual do .env
$envContent = Get-Content .env -Raw

# Verificar se DATABASE_URL existe
if ($envContent -notmatch 'DATABASE_URL=') {
    Write-Host "❌ Erro: DATABASE_URL não encontrada no arquivo .env!" -ForegroundColor Red
    exit 1
}

# Extrair a DATABASE_URL atual
if ($envContent -match 'DATABASE_URL=(.+)') {
    $currentUrl = $matches[1].Trim()
    
    # Remover quebras de linha e espaços extras
    $currentUrl = $currentUrl -replace '\s+', ''
    
    Write-Host "DATABASE_URL atual encontrada:" -ForegroundColor Yellow
    Write-Host $currentUrl -ForegroundColor Gray
    Write-Host ""
    
    # Verificar se já tem parâmetros de pool
    if ($currentUrl -match '\?') {
        # Já tem parâmetros, verificar se tem os de pool
        if ($currentUrl -match 'connection_limit|pool_timeout|connect_timeout') {
            Write-Host "⚠️  DATABASE_URL já contém parâmetros de pool." -ForegroundColor Yellow
            Write-Host "   Deseja atualizar mesmo assim? (S/N)" -ForegroundColor Yellow
            $response = Read-Host
            if ($response -ne 'S' -and $response -ne 's') {
                Write-Host "Operação cancelada." -ForegroundColor Yellow
                exit 0
            }
        }
        
        # Adicionar parâmetros de pool se não existirem
        $newUrl = $currentUrl
        if ($newUrl -notmatch 'connection_limit=') {
            $newUrl += '&connection_limit=10'
        }
        if ($newUrl -notmatch 'pool_timeout=') {
            $newUrl += '&pool_timeout=20'
        }
        if ($newUrl -notmatch 'connect_timeout=') {
            $newUrl += '&connect_timeout=10'
        }
    } else {
        # Não tem parâmetros, adicionar
        $newUrl = $currentUrl + '?connection_limit=10&pool_timeout=20&connect_timeout=10'
    }
    
    # Substituir no conteúdo
    $newEnvContent = $envContent -replace 'DATABASE_URL=.+', "DATABASE_URL=$newUrl"
    
    # Fazer backup do .env original
    $backupFile = ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item .env $backupFile
    Write-Host "✓ Backup criado: $backupFile" -ForegroundColor Green
    
    # Salvar o novo conteúdo
    $newEnvContent | Set-Content .env -NoNewline
    
    Write-Host ""
    Write-Host "✅ DATABASE_URL atualizada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Nova DATABASE_URL:" -ForegroundColor Yellow
    Write-Host $newUrl -ForegroundColor Gray
    Write-Host ""
    Write-Host "Parâmetros adicionados:" -ForegroundColor Cyan
    Write-Host "  - connection_limit=10  (máximo de conexões no pool)" -ForegroundColor Gray
    Write-Host "  - pool_timeout=20      (timeout do pool em segundos)" -ForegroundColor Gray
    Write-Host "  - connect_timeout=10   (timeout de conexão em segundos)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  Reinicie o backend para aplicar as mudanças:" -ForegroundColor Yellow
    Write-Host "   pnpm start:dev" -ForegroundColor White
} else {
    Write-Host "❌ Erro: Não foi possível extrair DATABASE_URL do arquivo .env" -ForegroundColor Red
    exit 1
}

