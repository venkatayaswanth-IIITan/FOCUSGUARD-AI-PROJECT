const getActiveWindowsApp = require("./winApps");
const { io } = require("socket.io-client");
const path = require("path");
const fs = require("fs");

const possibleEnvPaths = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env")
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath });
    break;
  }
}

const API_URL = process.env.API_URL || "http://localhost:5000";

// Connect as background agent to backend Socket.IO server
const socket = io(API_URL, {
  auth: {
    isAgent: true,
  },
  reconnection: true,
  reconnectionDelay: 2000,
});

let currentApp = null;
let currentTitle = null;
let currentStartTime = null;
let isChecking = false;

socket.on("connect", () => {
  console.log("🛡️ FocusGuard Activity Monitor Agent connected to Socket.IO Server");
});

socket.on("disconnect", () => {
  console.log("⚠️ FocusGuard Activity Monitor Agent disconnected from Socket.IO Server");
});

async function checkActiveApplication() {
  if (isChecking) return;
  isChecking = true;

  try {
    const active = await getActiveWindowsApp();

    if (!active || !active.app_name) {
      isChecking = false;
      return;
    }

    const appName = active.app_name;
    const windowTitle = active.window_title || `${appName} Workspace`;
    const now = new Date();

    // 1. FIRST DETECTED APP
    if (!currentApp) {
      currentApp = appName;
      currentTitle = windowTitle;
      currentStartTime = now;

      console.log(`🟢 Detected active app: ${currentApp}`);

      socket.emit("agent:activity_update", {
        app_name: currentApp,
        window_title: currentTitle,
        start_time: currentStartTime.toISOString(),
        previous_app: null,
      });

      isChecking = false;
      return;
    }

    // 2. APPLICATION CHANGED
    if (appName !== currentApp) {
      const previousApp = currentApp;

      console.log(`🔄 Window switch detected: ${previousApp} → ${appName}`);

      currentApp = appName;
      currentTitle = windowTitle;
      currentStartTime = now;

      socket.emit("agent:activity_update", {
        app_name: currentApp,
        window_title: currentTitle,
        start_time: currentStartTime.toISOString(),
        previous_app: previousApp,
      });

      isChecking = false;
      return;
    }

    // 3. HEARTBEAT PING FOR SAME APP
    currentTitle = windowTitle;
    socket.emit("agent:activity_update", {
      app_name: currentApp,
      window_title: currentTitle,
      start_time: currentStartTime ? currentStartTime.toISOString() : now.toISOString(),
      previous_app: null,
    });

  } catch (error) {
    console.error("Monitor agent error:", error.message);
  } finally {
    isChecking = false;
  }
}

// Start continuous foreground application check interval
setInterval(checkActiveApplication, 2000);
checkActiveApplication();
