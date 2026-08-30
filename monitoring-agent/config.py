import os

# Server Connection Config
SERVER_URL = os.getenv("FOCUSGUARD_SERVER_URL", "http://localhost:5000")

# Activity Polling Interval (in seconds)
POLL_INTERVAL = 1.0

# Inactivity / Idle Threshold (in seconds, default 5 minutes = 300s)
IDLE_THRESHOLD_SECONDS = 300

# Privacy Settings
# DEFAULT: Window title collection OFF
COLLECT_WINDOW_TITLE = False

# Known Process Name to User-Friendly App Name Mappings
APP_NAME_MAP = {
    "code.exe": "Visual Studio Code",
    "chrome.exe": "Google Chrome",
    "msedge.exe": "Microsoft Edge",
    "firefox.exe": "Mozilla Firefox",
    "explorer.exe": "File Explorer",
    "windowsterminal.exe": "Windows Terminal",
    "cmd.exe": "Command Prompt",
    "powershell.exe": "Windows PowerShell",
    "notepad.exe": "Notepad",
    "notepad++.exe": "Notepad++",
    "slack.exe": "Slack",
    "discord.exe": "Discord",
    "spotify.exe": "Spotify",
    "teams.exe": "Microsoft Teams",
    "devenv.exe": "Visual Studio",
    "pycharm64.exe": "PyCharm",
    "clion64.exe": "CLion",
    "idea64.exe": "IntelliJ IDEA",
    "wordpad.exe": "WordPad",
    "winword.exe": "Microsoft Word",
    "excel.exe": "Microsoft Excel",
    "powerpnt.exe": "Microsoft PowerPoint",
    "postman.exe": "Postman",
    "figma.exe": "Figma",
    "obs64.exe": "OBS Studio",
    "vlc.exe": "VLC Media Player",
    "taskmgr.exe": "Task Manager",
    "applicationframehost.exe": "Windows App Host",
    "pgadmin4.exe": "pgAdmin 4",
    "pgadmin.exe": "pgAdmin 4",
    "nw.exe": "pgAdmin 4",
}
