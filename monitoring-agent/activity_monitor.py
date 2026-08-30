import time
import logging
from datetime import datetime, timezone
from windows_tracker import WindowsTracker
from idle_detector import IdleDetector
from api_client import AgentSocketClient
from config import POLL_INTERVAL
from ml_predictor import ProductivityPredictor

logger = logging.getLogger("FocusGuardAgent.ActivityMonitor")

class ActivityMonitor:
    def __init__(self, api_client: AgentSocketClient):
        self.api_client = api_client
        self.windows_tracker = WindowsTracker()
        self.idle_detector = IdleDetector()

        self.is_monitoring = False
        self.current_session_id = None

        self.current_app = None  # { process_name, app_name, window_title, start_time }
        self.idle_start_time = None

        # ML productivity predictor (loads trained model from ai/models/)
        self.predictor = ProductivityPredictor()

        # Session-level counters for ML feature computation
        self.session_switch_count = 0

        # Bind remote commands from Socket.IO client
        self.api_client.on_start_monitoring_cb = self.start_monitoring
        self.api_client.on_stop_monitoring_cb = self.stop_monitoring
        self.api_client.on_config_update_cb = self.update_config

    def start_monitoring(self, data=None):
        logger.info(f"Starting foreground monitoring... data={data}")
        self.is_monitoring = True
        self.current_session_id = data.get("sessionId") if data else None
        self.current_app = None
        self.idle_start_time = None
        self.session_switch_count = 0  # reset switch counter for new session

        # Instantly poll initial foreground window
        self._check_activity()

    def stop_monitoring(self, data=None):
        logger.info("Stopping foreground monitoring...")
        if self.is_monitoring and self.current_app:
            # End current application session cleanly
            now_iso = datetime.now(timezone.utc).isoformat()
            start_dt = datetime.fromisoformat(self.current_app["start_time"])
            now_dt = datetime.now(timezone.utc)
            duration = max(1, int((now_dt - start_dt).total_seconds()))

            self.api_client.send_app_switch({
                "from_app": self.current_app["app_name"],
                "to_app": None,
                "process_name": self.current_app["process_name"],
                "app_name": self.current_app["app_name"],
                "window_title": self.current_app.get("window_title"),
                "start_time": self.current_app["start_time"],
                "end_time": now_iso,
                "duration_seconds": duration,
                "is_final": True
            })

        self.is_monitoring = False
        self.current_session_id = None
        self.current_app = None
        self.idle_start_time = None

    def update_config(self, config_data: dict):
        if "collect_window_title" in config_data:
            self.windows_tracker.collect_window_title = bool(config_data["collect_window_title"])
            logger.info(f"Updated collect_window_title setting: {self.windows_tracker.collect_window_title}")
        if "idle_threshold_seconds" in config_data:
            self.idle_detector.idle_threshold_seconds = int(config_data["idle_threshold_seconds"])
            logger.info(f"Updated idle_threshold_seconds: {self.idle_detector.idle_threshold_seconds}")

    def _check_activity(self):
        if not self.is_monitoring:
            return

        now_utc = datetime.now(timezone.utc)
        now_iso = now_utc.isoformat()

        # 1. Foreground Window Check
        fg_info = self.windows_tracker.get_foreground_info()
        if fg_info:
            process_name = fg_info["process_name"]
            app_name = fg_info["app_name"]
            window_title = fg_info["window_title"]

            if self.current_app is None:
                # First app detected after monitoring start
                self.current_app = {
                    "process_name": process_name,
                    "app_name": app_name,
                    "window_title": window_title,
                    "start_time": now_iso
                }
                logger.info(f"Initial application detected: {app_name} ({process_name})")

                # ML prediction for initial app (0 seconds so far)
                productivity = self.predictor.predict(
                    app_name=app_name,
                    duration_minutes=0.0,
                    switch_tabs=self.session_switch_count,
                )
                logger.info(f"ML prediction: {app_name} -> {productivity['label']} ({productivity['confidence']}% confidence)")

                self.api_client.send_activity_update({
                    **self.current_app,
                    "productivity": productivity,
                })

            elif self.current_app["process_name"] != process_name or self.current_app["app_name"] != app_name:
                # Foreground context switch occurred
                start_dt = datetime.fromisoformat(self.current_app["start_time"])
                duration = max(1, int((now_utc - start_dt).total_seconds()))
                duration_minutes = round(duration / 60.0, 2)

                logger.info(f"Context switch detected: {self.current_app['app_name']} -> {app_name} (Duration: {duration}s)")

                self.api_client.send_app_switch({
                    "from_app": self.current_app["app_name"],
                    "to_app": app_name,
                    "process_name": self.current_app["process_name"],
                    "app_name": self.current_app["app_name"],
                    "window_title": self.current_app.get("window_title"),
                    "start_time": self.current_app["start_time"],
                    "end_time": now_iso,
                    "duration_seconds": duration,
                    "is_final": False
                })

                # Increment switch counter
                self.session_switch_count += 1

                # Start new application session
                self.current_app = {
                    "process_name": process_name,
                    "app_name": app_name,
                    "window_title": window_title,
                    "start_time": now_iso
                }

                # ML prediction for new app
                productivity = self.predictor.predict(
                    app_name=app_name,
                    duration_minutes=0.0,
                    switch_tabs=self.session_switch_count,
                )
                logger.info(f"ML prediction: {app_name} -> {productivity['label']} ({productivity['confidence']}% confidence)")

                self.api_client.send_activity_update({
                    **self.current_app,
                    "productivity": productivity,
                })

            else:
                # Same app — heartbeat: recalculate duration for fresh ML prediction
                if self.current_app.get("window_title") != window_title:
                    self.current_app["window_title"] = window_title

                start_dt = datetime.fromisoformat(self.current_app["start_time"])
                duration_minutes = round((now_utc - start_dt).total_seconds() / 60.0, 2)

                productivity = self.predictor.predict(
                    app_name=app_name,
                    duration_minutes=duration_minutes,
                    switch_tabs=self.session_switch_count,
                )

                self.api_client.send_activity_update({
                    **self.current_app,
                    "productivity": productivity,
                })

        # 2. Idle Detection Check
        idle_info = self.idle_detector.check_idle_state()

        if idle_info["transition_to_idle"]:
            self.idle_start_time = now_iso
            logger.info("System user idle threshold reached. Idle started.")
            self.api_client.send_idle_event("idle_start", {
                "started_at": self.idle_start_time
            })
        elif idle_info["transition_to_active"]:
            idle_end_time = now_iso
            idle_duration = idle_info["idle_duration_seconds"]
            logger.info(f"User resumed activity. Idle duration: {idle_duration}s")
            self.api_client.send_idle_event("idle_end", {
                "started_at": self.idle_start_time,
                "ended_at": idle_end_time,
                "duration_seconds": idle_duration
            })
            self.idle_start_time = None

    def run_loop(self):
        logger.info("Starting Activity Monitor polling loop...")
        last_ping_time = 0

        while True:
            try:
                now = time.time()
                # Send agent heartbeat ping every 3 seconds to keep backend status alive
                if now - last_ping_time >= 3.0:
                    self.api_client.send_ping()
                    last_ping_time = now

                if self.is_monitoring:
                    self._check_activity()
            except Exception as e:
                logger.error(f"Error in activity monitor loop: {e}")
            time.sleep(POLL_INTERVAL)
