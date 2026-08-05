$p = Get-Process | Where-Object { $_.MainWindowTitle -ne "" -and $_.ProcessName -ne "powershell" } | Select-Object -First 1 ProcessName, MainWindowTitle
if ($p) {
    Write-Output "$($p.ProcessName)|||$($p.MainWindowTitle)"
}
