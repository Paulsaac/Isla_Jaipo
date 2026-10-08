param(
    [Parameter(Position=0, Mandatory=$true)]
    [ValidateSet('status','start','finish')][string]$Action,
    [ValidateSet('Codex','Antigravity')][string]$Agent,
    [string]$Token
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$coordinationDir = Join-Path $projectRoot '.coordination'
$lockPath = Join-Path $coordinationDir 'session.json'

try {
    if ($Action -eq 'status') {
        if (Test-Path -LiteralPath $lockPath) {
            Get-Content -LiteralPath $lockPath -Raw
        } else { Write-Output 'LIBRE: no hay sesion activa en esta copia.' }
        exit 0
    }
    if (-not $Agent) { throw 'Indicar -Agent Codex o -Agent Antigravity.' }
    if ($Action -eq 'start') {
        [System.IO.Directory]::CreateDirectory($coordinationDir) | Out-Null
        $record = [ordered]@{
            agent = $Agent
            token = [guid]::NewGuid().ToString()
            startedUtc = [DateTime]::UtcNow.ToString('o')
            computer = [Environment]::MachineName
            workspace = $projectRoot
        }
        $payload = $record | ConvertTo-Json
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
        $stream = [System.IO.File]::Open($lockPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
        try { $stream.Write($bytes, 0, $bytes.Length) } finally { $stream.Dispose() }
        Write-Output $payload
        exit 0
    }
    if (-not $Token) { throw 'Indicar el -Token recibido al iniciar.' }
    # Mantener acceso exclusivo entre comprobación y liberación.
    $stream = [System.IO.File]::Open($lockPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    try {
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8, $true, 1024, $true)
        try { $record = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
        if ($record.agent -cne $Agent -or $record.token -cne $Token) {
            throw 'Propietario o token incorrectos. No se libero la sesion.'
        }
        # En Windows el archivo sigue protegido hasta cerrar el handle.
    } finally { $stream.Dispose() }
    Remove-Item -LiteralPath $lockPath
    Write-Output "LIBERADA: sesion de $Agent."
} catch {
    Write-Error -Message ("Sesion no modificada o no completada: " + $_.Exception.Message) -ErrorAction Continue
    exit 1
}
