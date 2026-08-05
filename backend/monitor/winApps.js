const { execFile } = require("child_process");
const path = require("path");

const scriptPath = path.join(__dirname, "getForeground.ps1");

function getActiveWindowsApp() {
  return new Promise((resolve) => {
    execFile(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
      { maxBuffer: 5 * 1024 * 1024 },
      (err, stdout) => {
        if (err || !stdout || !stdout.trim()) {
          return resolve(null);
        }

        const raw = stdout.trim();
        const parts = raw.split("|||");
        const rawProc = (parts[0] || "").trim();
        const rawTitle = (parts[1] || "").trim();

        if (!rawProc) return resolve(null);

        let appName = rawProc;
        const lowerProc = rawProc.toLowerCase();
        const lowerTitle = rawTitle.toLowerCase();

        // 1. Domain / Website Context Detection from Browser Window Titles
        if (lowerTitle.includes("leetcode")) {
          appName = "LeetCode";
        } else if (lowerTitle.includes("instagram")) {
          appName = "Instagram";
        } else if (lowerTitle.includes("youtube")) {
          appName = "YouTube";
        } else if (lowerTitle.includes("netflix")) {
          appName = "Netflix";
        } else if (lowerTitle.includes("reddit")) {
          appName = "Reddit";
        } else if (lowerTitle.includes("twitter") || lowerTitle.includes("x.com") || lowerTitle.includes(" - x")) {
          appName = "X (Twitter)";
        } else if (lowerTitle.includes("facebook")) {
          appName = "Facebook";
        } else if (lowerTitle.includes("linkedin")) {
          appName = "LinkedIn";
        } else if (lowerTitle.includes("twitch")) {
          appName = "Twitch";
        } else if (lowerTitle.includes("tiktok")) {
          appName = "TikTok";
        } else if (lowerTitle.includes("github")) {
          appName = "GitHub";
        } else if (lowerTitle.includes("stackoverflow") || lowerTitle.includes("stack overflow")) {
          appName = "Stack Overflow";
        } else if (lowerTitle.includes("chatgpt") || lowerTitle.includes("openai")) {
          appName = "ChatGPT";
        } else if (lowerTitle.includes("claude.ai") || lowerTitle.includes("claude")) {
          appName = "Claude AI";
        } else if (lowerTitle.includes("coursera")) {
          appName = "Coursera";
        } else if (lowerTitle.includes("udemy")) {
          appName = "Udemy";
        } else if (lowerTitle.includes("notion")) {
          appName = "Notion";
        } else if (lowerTitle.includes("overleaf")) {
          appName = "Overleaf";
        }
        // 2. Process Application Name Mappings
        else if (lowerProc.includes("code") || lowerTitle.includes("visual studio code")) {
          appName = "Visual Studio Code";
        } else if (lowerProc.includes("antigravity")) {
          appName = "Antigravity IDE";
        } else if (lowerProc.includes("cursor")) {
          appName = "Cursor";
        } else if (lowerProc.includes("idea")) {
          appName = "IntelliJ IDEA";
        } else if (lowerProc.includes("pycharm")) {
          appName = "PyCharm";
        } else if (lowerProc.includes("webstorm")) {
          appName = "WebStorm";
        } else if (lowerProc.includes("devenv")) {
          appName = "Visual Studio";
        } else if (lowerProc.includes("chrome")) {
          appName = "Google Chrome";
        } else if (lowerProc.includes("msedge")) {
          appName = "Microsoft Edge";
        } else if (lowerProc.includes("firefox")) {
          appName = "Mozilla Firefox";
        } else if (lowerProc.includes("brave")) {
          appName = "Brave Browser";
        } else if (lowerProc.includes("opera")) {
          appName = "Opera Browser";
        } else if (lowerProc.includes("spotify")) {
          appName = "Spotify";
        } else if (lowerProc.includes("whatsapp")) {
          appName = "WhatsApp";
        } else if (lowerProc.includes("discord")) {
          appName = "Discord";
        } else if (lowerProc.includes("notepad")) {
          appName = "Notepad";
        } else if (lowerProc.includes("pgadmin")) {
          appName = "pgAdmin";
        } else if (lowerProc.includes("teams")) {
          appName = "Microsoft Teams";
        } else if (lowerProc.includes("slack")) {
          appName = "Slack";
        } else if (lowerProc.includes("figma")) {
          appName = "Figma";
        } else if (lowerProc.includes("postman")) {
          appName = "Postman";
        }

        resolve({
          app_name: appName,
          window_title: rawTitle || `${appName} Active Session`,
        });
      }
    );
  });
}

module.exports = getActiveWindowsApp;

if (require.main === module) {
  getActiveWindowsApp().then((res) => console.log("DETECTED ACTIVE CONTEXT:", res));
}
