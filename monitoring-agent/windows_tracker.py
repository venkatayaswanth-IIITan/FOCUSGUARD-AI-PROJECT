import win32gui
import win32process
import psutil
from config import APP_NAME_MAP, COLLECT_WINDOW_TITLE

class WindowsTracker:
    def __init__(self, collect_window_title: bool = COLLECT_WINDOW_TITLE):
        self.collect_window_title = collect_window_title

    def resolve_app_name(self, process_name: str) -> str:
        """
        Resolves a user-friendly application name from the process name.
        If mapped, returns mapped name. Otherwise strips .exe and capitalizes words.
        """
        if not process_name:
            return "Unknown Application"
        
        lower_name = process_name.lower()
        if lower_name in APP_NAME_MAP:
            return APP_NAME_MAP[lower_name]
        
        clean_name = process_name.rsplit('.', 1)[0]
        return clean_name.replace("_", " ").replace("-", " ").title()

    def get_foreground_info(self) -> dict:
        """
        Uses Win32 APIs and psutil to get current real Windows foreground application metadata.
        Returns dict with process_name, app_name, window_title, and hwnd.
        """
        try:
            hwnd = win32gui.GetForegroundWindow()
            if not hwnd:
                return None

            # Get process ID associated with foreground HWND
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            if not pid or pid <= 0:
                return None

            # Retrieve process using psutil
            try:
                proc = psutil.Process(pid)
                process_name = proc.name()
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                process_name = "Unknown"

            # Resolve user-friendly application name
            app_name = self.resolve_app_name(process_name)

            # Retrieve window title if privacy setting is enabled
            window_title = None
            if self.collect_window_title:
                try:
                    title = win32gui.GetWindowText(hwnd)
                    window_title = title.strip() if title else None
                except Exception:
                    window_title = None

            return {
                "hwnd": hwnd,
                "pid": pid,
                "process_name": process_name,
                "app_name": app_name,
                "window_title": window_title
            }

        except Exception as e:
            # Handle potential transient API errors gracefully
            return None
