const { execFile } = require("child_process");

function getActiveWindow() {
  return new Promise((resolve) => {
    const psScript = `
    $code = @"
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
"@
    try {
      Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
    } catch {}

    $hwnd = [WinAPI]::GetForegroundWindow()
    if ($hwnd -and $hwnd -ne [IntPtr]::Zero) {
        $title = New-Object System.Text.StringBuilder(512)
        [void][WinAPI]::GetWindowText($hwnd, $title, 512)
        
        $processId = 0
        [void][WinAPI]::GetWindowThreadProcessId($hwnd, [ref]$processId)
        
        if ($processId -gt 0) {
            $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Output "$($proc.ProcessName)|||$($title.ToString())"
            }
        }
    }
    `;

    execFile("powershell", ["-NoProfile", "-NonInteractive", "-Command", psScript], (err, stdout) => {
      if (err || !stdout || !stdout.trim()) {
        // Fallback using Get-Process
        execFile("powershell", ["-NoProfile", "-Command", 'Get-Process | Where-Object { $_.MainWindowTitle -ne "" } | Select-Object -First 1 ProcessName, MainWindowTitle | ForEach-Object { "$($_.ProcessName)|||$($_.MainWindowTitle)" }'], (e, out2) => {
          if (e || !out2 || !out2.trim()) return resolve(null);
          const parts = out2.trim().split("|||");
          resolve({ owner: { name: parts[0] }, title: parts[1] || "" });
        });
        return;
      }
      const parts = stdout.trim().split("|||");
      resolve({ owner: { name: parts[0] }, title: parts[1] || "" });
    });
  });
}

module.exports = getActiveWindow;

if (require.main === module) {
  getActiveWindow().then((res) => console.log("DETECTED WINDOW:", res));
}
