import socketio
import logging
from config import SERVER_URL

logger = logging.getLogger("FocusGuardAgent.APIClient")

class AgentSocketClient:
    def __init__(self, server_url: str = SERVER_URL):
        self.server_url = server_url
        self.sio = socketio.Client(reconnection=True, reconnection_delay=2)
        self.on_start_monitoring_cb = None
        self.on_stop_monitoring_cb = None
        self.on_config_update_cb = None

        self._register_events()

    def _register_events(self):
        @self.sio.on("connect")
        def on_connect():
            logger.info(f"Connected to FocusGuard backend at {self.server_url}")

        @self.sio.on("disconnect")
        def on_disconnect():
            logger.warning("Disconnected from FocusGuard backend")

        @self.sio.on("agent:start_monitoring")
        def on_start(data=None):
            logger.info("Received start_monitoring command from backend")
            if self.on_start_monitoring_cb:
                self.on_start_monitoring_cb(data)

        @self.sio.on("agent:stop_monitoring")
        def on_stop(data=None):
            logger.info("Received stop_monitoring command from backend")
            if self.on_stop_monitoring_cb:
                self.on_stop_monitoring_cb(data)

        @self.sio.on("agent:config_update")
        def on_config(data):
            logger.info(f"Received config_update: {data}")
            if self.on_config_update_cb:
                self.on_config_update_cb(data)

    def connect(self):
        try:
            logger.info(f"Connecting to {self.server_url} as monitoring agent...")
            self.sio.connect(self.server_url, auth={"isAgent": True})
        except Exception as e:
            logger.error(f"Failed to connect to FocusGuard backend: {e}")

    def is_connected(self) -> bool:
        return self.sio.connected

    def send_ping(self):
        if self.is_connected():
            self.sio.emit("agent:ping")

    def send_activity_update(self, activity_data: dict):
        if self.is_connected():
            self.sio.emit("agent:activity_update", activity_data)

    def send_app_switch(self, switch_data: dict):
        if self.is_connected():
            self.sio.emit("agent:app_switch", switch_data)

    def send_idle_event(self, event_type: str, idle_data: dict):
        if self.is_connected():
            self.sio.emit(f"agent:{event_type}", idle_data)

    def disconnect(self):
        if self.is_connected():
            self.sio.disconnect()
