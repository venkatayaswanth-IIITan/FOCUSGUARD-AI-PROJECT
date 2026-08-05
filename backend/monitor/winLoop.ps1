$code = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class User32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
"@

Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue

while ($true) {
    try {
        $hwnd = [User32]::GetForegroundWindow()
        if ($hwnd -and $hwnd -ne [IntPtr]::Zero) {
            $sb = New-Object System.Text.StringBuilder 1024
            [User32]::GetWindowText($hwnd, $sb, 1024) | Out-Null
            $pidOut = 0
            [User32]::GetWindowThreadProcessId($hwnd, [ref]$pidOut) | Out-Null
            if ($pidOut -gt 0) {
                $p = Get-Process -Id $pidOut -ErrorAction SilentlyContinue
                if ($p) {
                    $title = $sb.ToString()
                    Write-Output "APP:$($p.ProcessName)|||TITLE:$title"
                }
            }
        }
    } catch {}
    Start-Sleep -Milliseconds 1500
}
