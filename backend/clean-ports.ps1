# Script para limpar processos Node.js travados nas portas do backend
# Uso: .\clean-ports.ps1

Write-Host "🔍 Procurando processos Node.js nas portas 3000, 3001, 3002..." -ForegroundColor Cyan

$ports = @(3000, 3001, 3002)
$foundProcesses = @()

foreach ($port in $ports) {
    try {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connection) {
            $processId = $connection | Select-Object -ExpandProperty OwningProcess -Unique
            if ($processId) {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    $foundProcesses += @{
                        Port = $port
                        PID = $processId
                        Name = $process.ProcessName
                        Path = $process.Path
                    }
                    Write-Host "⚠️  Porta $port ocupada pelo processo $processId ($($process.ProcessName))" -ForegroundColor Yellow
                }
            }
        }
    } catch {
        # Porta não está em uso ou erro ao verificar
    }
}

if ($foundProcesses.Count -eq 0) {
    Write-Host "✅ Nenhum processo encontrado nas portas 3000, 3001, 3002" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "📋 Processos encontrados:" -ForegroundColor Cyan
$foundProcesses | ForEach-Object {
    Write-Host "  - Porta $($_.Port): PID $($_.PID) ($($_.Name))" -ForegroundColor White
}

Write-Host ""
$confirm = Read-Host "Deseja encerrar esses processos? (S/N)"

if ($confirm -eq 'S' -or $confirm -eq 's' -or $confirm -eq 'Y' -or $confirm -eq 'y') {
    foreach ($proc in $foundProcesses) {
        try {
            Write-Host "🛑 Encerrando processo $($proc.PID) na porta $($proc.Port)..." -ForegroundColor Yellow
            Stop-Process -Id $proc.PID -Force -ErrorAction Stop
            Write-Host "✅ Processo $($proc.PID) encerrado com sucesso" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erro ao encerrar processo $($proc.PID): $_" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "⏳ Aguardando 2 segundos para liberar as portas..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    
    Write-Host ""
    Write-Host "✅ Limpeza concluída! As portas devem estar disponíveis agora." -ForegroundColor Green
} else {
    Write-Host "❌ Operação cancelada." -ForegroundColor Red
    exit 0
}

