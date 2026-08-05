const { exec } = require("child_process");

const psScript = `
$code = @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinAPI {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
'@

Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue

$hwnd = [WinAPI]::GetForegroundWindow()
if ($hwnd -ne [IntPtr]::Zero) {
    $title = New-Object System.Text.StringBuilder(256)
    [void][WinAPI]::GetWindowText($hwnd, $title, 256)
    
    $processId = 0
    [void][WinAPI]::GetWindowThreadProcessId($hwnd, [ref]$processId)
    
    if ($processId -gt 0) {
        $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($proc) {
            [PSCustomObject]@{
                ProcessName = $proc.ProcessName
                MainWindowTitle = $title.ToString()
            } | ConvertTo-Json
        }
    }
}
`;

function getActiveWindowWindows() {
  return new Promise((resolve) => {
    const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, " ").replace(/"/g, '\\"')}"`;
    exec(cmd, (err, stdout) => {
      if (err || !stdout.trim()) {
        return resolve(null);
      }
      try {
        const data = JSON.parse(stdout.trim());
        resolve({
          owner: { name: data.ProcessName },
          title: data.MainWindowTitle || "",
        });
      } catch (e) {
        resolve(null);
      }
    });
  });
}

getActiveWindowWindows().then((res) => console.log("NATIVE WINDOWS API RESULT:", res));
