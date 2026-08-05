import sys
import time
import logging
import signal

from api_client import AgentSocketClient
from activity_monitor import ActivityMonitor

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] FocusGuardAgent: %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("FocusGuardAgent.Main")

def main():
    logger.info("Initializing FocusGuard Windows Activity Monitoring Agent...")

    # Instantiate Socket.IO client
    client = AgentSocketClient()

    # Instantiate Monitor engine
    monitor = ActivityMonitor(api_client=client)

    # Handle graceful exit signals
    def signal_handler(sig, frame):
        logger.info("Shutdown signal received. Disconnecting agent...")
        if monitor.is_monitoring:
            monitor.stop_monitoring()
        client.disconnect()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Connect to backend
    client.connect()

    # Run monitor polling loop
    try:
        monitor.run_loop()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt. Stopping agent...")
        client.disconnect()

if __name__ == "__main__":
    main()
