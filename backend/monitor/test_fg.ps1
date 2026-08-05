Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -ne "" } | Select-Object Id, ProcessName, MainWindowTitle, MainWindowHandle | Format-Table -AutoSize
