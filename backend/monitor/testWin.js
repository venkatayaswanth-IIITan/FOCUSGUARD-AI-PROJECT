const { exec } = require("child_process");

exec('powershell -Command "Get-Process | Where-Object MainWindowTitle | Select-Object ProcessName, MainWindowTitle | Format-List"', (err, stdout) => {
  console.log("PROCS WITH WINDOW TITLES:\n", stdout);
});
