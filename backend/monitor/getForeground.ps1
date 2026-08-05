$code = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class User32Active {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
"@

if (-not ([System.Management.Automation.PSTypeName]'User32Active').Type) {
    try {
        Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
    } catch {}
}

$hwnd = [User32Active]::GetForegroundWindow()

if ($hwnd -and $hwnd -ne [IntPtr]::Zero) {
    $sb = New-Object System.Text.StringBuilder 1024
    [User32Active]::GetWindowText($hwnd, $sb, 1024) | Out-Null
    $title = $sb.ToString()

    [uint32]$pidOut = 0
    [User32Active]::GetWindowThreadProcessId($hwnd, [ref]$pidOut) | Out-Null

    if ($pidOut -gt 0) {
        $p = Get-Process -Id $pidOut -ErrorAction SilentlyContinue
        if ($p) {
            Write-Output "$($p.ProcessName)|||$title"
            exit 0
        }
    }
}

# Fallback: search running processes with non-empty MainWindowTitle ignoring system/bg tasks
$p = Get-Process | Where-Object { 
    $_.MainWindowTitle -ne "" -and 
    $_.ProcessName -notmatch "^(svchost|conhost|system|runtime|service|search|shell|taskhost|explorer|TextInputHost|LockApp|powershell|cmd|node)$" 
} | Select-Object -First 1 ProcessName, MainWindowTitle

if ($p) {
    Write-Output "$($p.ProcessName)|||$($p.MainWindowTitle)"
}
