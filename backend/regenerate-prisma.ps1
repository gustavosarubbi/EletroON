# Script para regenerar o Prisma Client
# Execute este script quando o servidor NÃO estiver rodando

Write-Host "Regenerando Prisma Client..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE: Certifique-se de que o servidor está PARADO antes de executar este script!" -ForegroundColor Red
Write-Host ""

# Verificar se o processo do Node está rodando
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "AVISO: Processos Node.js encontrados. Pare o servidor antes de continuar." -ForegroundColor Red
    Write-Host "Processos encontrados:" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object { Write-Host "  PID: $($_.Id) - $($_.ProcessName)" }
    Write-Host ""
    $continue = Read-Host "Deseja continuar mesmo assim? (s/N)"
    if ($continue -ne "s" -and $continue -ne "S") {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Executando: npx prisma generate" -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Prisma Client regenerado com sucesso!" -ForegroundColor Green
    Write-Host "Agora você pode iniciar o servidor novamente." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erro ao regenerar Prisma Client." -ForegroundColor Red
    Write-Host "Certifique-se de que:" -ForegroundColor Yellow
    Write-Host "  1. O servidor está completamente parado" -ForegroundColor Yellow
    Write-Host "  2. Nenhum processo Node.js está usando os arquivos do Prisma" -ForegroundColor Yellow
    Write-Host "  3. Você tem permissões para escrever nos arquivos" -ForegroundColor Yellow
    exit 1
}

