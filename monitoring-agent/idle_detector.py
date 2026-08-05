import ctypes
from config import IDLE_THRESHOLD_SECONDS

class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [
        ('cbSize', ctypes.c_uint),
        ('dwTime', ctypes.c_uint)
    ]

class IdleDetector:
    def __init__(self, idle_threshold_seconds: int = IDLE_THRESHOLD_SECONDS):
        self.idle_threshold_seconds = idle_threshold_seconds
        self.is_idle = False

    def get_idle_duration(self) -> float:
        """
        Returns the duration in seconds since the last system user input (keyboard/mouse).
        """
        try:
            lastInputInfo = LASTINPUTINFO()
            lastInputInfo.cbSize = ctypes.sizeof(LASTINPUTINFO)
            if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lastInputInfo)):
                millis = ctypes.windll.kernel32.GetTickCount() - lastInputInfo.dwTime
                return max(0.0, float(millis) / 1000.0)
        except Exception:
            pass
        return 0.0

    def check_idle_state(self) -> dict:
        """
        Checks current system idle time against the configured threshold.
        Returns state dictionary with is_idle, idle_duration, and transition flags.
        """
        idle_secs = self.get_idle_duration()
        previously_idle = self.is_idle
        now_idle = idle_secs >= self.idle_threshold_seconds

        transition_to_idle = False
        transition_to_active = False

        if now_idle and not previously_idle:
            self.is_idle = True
            transition_to_idle = True
        elif not now_idle and previously_idle:
            self.is_idle = False
            transition_to_active = True

        return {
            "is_idle": self.is_idle,
            "idle_duration_seconds": round(idle_secs, 1),
            "transition_to_idle": transition_to_idle,
            "transition_to_active": transition_to_active
        }
