"""
FocusGuard AI — Real-time Productivity Predictor
=================================================
Loads the trained Random Forest model and label encoders from ai/models/
and exposes a simple predict() method called by the monitoring agent.
"""

import os
import sys
import pickle
import logging

logger = logging.getLogger("FocusGuardAgent.MLPredictor")

# Base path: monitoring-agent/ -> project root -> ai/models/
_BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_MODEL_DIR  = os.path.join(_BASE_DIR, "ai", "models")

# Known productive / distraction apps from training vocabulary
_PRODUCTIVE_APPS = {
    "vs code", "visual studio code", "visual studio",
    "leetcode", "stack overflow", "github", "chatgpt",
    "google docs", "pycharm", "intellij idea", "notepad++",
    "postman", "figma", "windows terminal", "command prompt",
    "windows powershell", "code", "devenv",
}
_DISTRACTION_APPS = {
    "youtube", "instagram", "netflix", "spotify",
    "discord", "facebook", "twitter", "tiktok",
    "reddit", "vlc media player",
}


class ProductivityPredictor:
    """
    Wraps the saved Random Forest classifier for real-time inference.
    Falls back to rule-based scoring when the ML model is unavailable.
    """

    def __init__(self):
        self._model         = None
        self._le_user_type  = None
        self._le_app        = None
        self._ready         = False
        self._load()

    # ── Model loading ─────────────────────────────────────────────────────────
    def _load(self):
        rf_path  = os.path.join(_MODEL_DIR, "random_forest.pkl")
        enc_path = os.path.join(_MODEL_DIR, "label_encoders.pkl")

        if not os.path.exists(rf_path) or not os.path.exists(enc_path):
            logger.warning(
                "ML model files not found in ai/models/ — "
                "falling back to rule-based productivity scoring."
            )
            return

        try:
            with open(rf_path, "rb") as f:
                self._model = pickle.load(f)
            with open(enc_path, "rb") as f:
                encoders = pickle.load(f)
            self._le_user_type = encoders.get("user_type")
            self._le_app       = encoders.get("app_website")
            self._ready        = True
            logger.info("ML productivity model loaded successfully (Random Forest).")
        except Exception as e:
            logger.error(f"Failed to load ML model: {e} — using rule-based fallback.")

    # ── Safe encoder ──────────────────────────────────────────────────────────
    def _encode(self, le, value: str) -> int:
        """Encode a label safely; unknown values map to index 0."""
        if le is None:
            return 0
        if value in le.classes_:
            return int(le.transform([value])[0])
        # Unseen label — use fallback index 0 (most frequent class)
        return 0

    # ── Rule-based fallback ───────────────────────────────────────────────────
    def _rule_based(self, app_name: str, duration_minutes: float, switch_tabs: int):
        """Simple heuristic when the ML model is unavailable."""
        name_lower = app_name.lower()

        # Direct match on known apps
        for prod in _PRODUCTIVE_APPS:
            if prod in name_lower:
                confidence = min(95.0, 70.0 + duration_minutes * 0.3)
                return {"productive": True,  "label": "Productive",     "confidence": round(confidence, 1), "model": "Rule-Based"}
        for dist in _DISTRACTION_APPS:
            if dist in name_lower:
                confidence = min(95.0, 65.0 + switch_tabs * 2.0)
                return {"productive": False, "label": "Not Productive", "confidence": round(confidence, 1), "model": "Rule-Based"}

        # Unknown app — use duration & switches as heuristic
        productive = duration_minutes >= 10 and switch_tabs <= 4
        confidence = 55.0
        return {
            "productive": productive,
            "label":      "Productive" if productive else "Not Productive",
            "confidence": confidence,
            "model":      "Rule-Based",
        }

    # ── Main predict API ──────────────────────────────────────────────────────
    def predict(
        self,
        app_name:         str,
        duration_minutes: float = 0.0,
        switch_tabs:      int   = 0,
        user_type:        str   = "Student",
    ) -> dict:
        """
        Returns a dict:
        {
            "productive":  bool,
            "label":       "Productive" | "Not Productive",
            "confidence":  float (0–100),
            "model":       "Random Forest" | "Rule-Based",
        }
        """
        duration_minutes = max(0.0, float(duration_minutes))
        switch_tabs      = max(0,   int(switch_tabs))

        # ML path
        if self._ready and self._model is not None:
            try:
                user_type_enc = self._encode(self._le_user_type, user_type)
                app_enc       = self._encode(self._le_app,       app_name)

                features = [[duration_minutes, switch_tabs, user_type_enc, app_enc]]
                pred     = self._model.predict(features)[0]
                proba    = self._model.predict_proba(features)[0]
                conf     = round(float(max(proba)) * 100, 1)

                return {
                    "productive": bool(pred == 1),
                    "label":      "Productive" if pred == 1 else "Not Productive",
                    "confidence": conf,
                    "model":      "Random Forest",
                }
            except Exception as e:
                logger.error(f"ML prediction failed: {e} — using rule-based fallback.")

        # Fallback
        return self._rule_based(app_name, duration_minutes, switch_tabs)
