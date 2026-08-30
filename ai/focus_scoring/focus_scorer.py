import pandas as pd
from datetime import datetime, timedelta

# List of default productive app classifications
PRODUCTIVE_KEYWORDS = [
    "code", "visual studio", "vscode", "pycharm", "intellij", "sublime", 
    "terminal", "cmd", "powershell", "git", "github", "gitlab", "bitbucket", 
    "stack overflow", "documentation", "notion", "obsidian", "jira", 
    "confluence", "slack", "teams", "zoom", "word", "excel", "focusguard"
]

NON_PRODUCTIVE_KEYWORDS = [
    "youtube", "netflix", "facebook", "twitter", "x.com", "instagram", 
    "reddit", "tiktok", "gaming", "steam", "sushi", "restaurant", "shopping", "amazon"
]

def classify_app(app_name: str) -> str:
    """Classifies application as 'Productive' or 'Non-Productive' based on keywords."""
    if not app_name:
        return "Non-Productive"
    
    app_lower = app_name.lower()
    
    for kw in PRODUCTIVE_KEYWORDS:
        if kw in app_lower:
            return "Productive"
            
    for kw in NON_PRODUCTIVE_KEYWORDS:
        if kw in app_lower:
            return "Non-Productive"
            
    # Default fallback: Development / Work tools are productive, general browsing evaluated
    return "Productive" if any(w in app_lower for w in ["dev", "build", "doc", "spec", "ai"]) else "Non-Productive"


class FocusScorer:
    """Calculates focus score percentage, productive minutes, total minutes,

    and session counts resampled by Daily ('D'), Weekly ('W'), and Monthly ('M').
    """

    def __init__(self, custom_productive_apps=None):
        self.custom_productive_apps = custom_productive_apps or []

    def calculate_session_duration(self, opened_datetime, closed_datetime) -> float:
        """duration_minutes per session = (closed_datetime - opened_datetime).total_seconds() / 60"""
        if isinstance(opened_datetime, str):
            opened_datetime = pd.to_datetime(opened_datetime)
        if isinstance(closed_datetime, str):
            closed_datetime = pd.to_datetime(closed_datetime)
            
        delta_seconds = (closed_datetime - opened_datetime).total_seconds()
        return max(0.0, delta_seconds / 60.0)

    def calculate_focus_score(self, session_records: list) -> dict:
        """Calculates total focus score for a list of session records.

        Each record: {'app_name': str, 'opened_datetime': datetime/str, 'closed_datetime': datetime/str}
        """
        if not session_records:
            return {
                "total_minutes": 0.0,
                "productive_minutes": 0.0,
                "non_productive_minutes": 0.0,
                "focus_score_pct": 0.0,
                "session_count": 0
            }

        total_minutes = 0.0
        productive_minutes = 0.0
        non_productive_minutes = 0.0

        for s in session_records:
            dur = self.calculate_session_duration(s["opened_datetime"], s["closed_datetime"])
            category = classify_app(s["app_name"])
            
            total_minutes += dur
            if category == "Productive":
                productive_minutes += dur
            else:
                non_productive_minutes += dur

        focus_score_pct = (productive_minutes / total_minutes * 100.0) if total_minutes > 0 else 0.0

        return {
            "total_minutes": round(total_minutes, 2),
            "productive_minutes": round(productive_minutes, 2),
            "non_productive_minutes": round(non_productive_minutes, 2),
            "focus_score_pct": round(focus_score_pct, 2),
            "session_count": len(session_records)
        }

    def resample_bucket_scores(self, dataframe: pd.DataFrame, freq='D') -> pd.DataFrame:
        """Resamples session dataframe into 'D' (Daily), 'W' (Weekly), or 'M' (Monthly) buckets

        and reports session_count and focus_score_pct per bucket.
        DataFrame must have: ['opened_datetime', 'closed_datetime', 'app_name']
        """
        if dataframe.empty:
            return pd.DataFrame()

        df = dataframe.copy()
        df['opened_datetime'] = pd.to_datetime(df['opened_datetime'])
        df['closed_datetime'] = pd.to_datetime(df['closed_datetime'])
        
        df['duration_minutes'] = df.apply(
            lambda r: self.calculate_session_duration(r['opened_datetime'], r['closed_datetime']), axis=1
        )
        df['category'] = df['app_name'].apply(classify_app)
        df['productive_minutes'] = df.apply(
            lambda r: r['duration_minutes'] if r['category'] == 'Productive' else 0.0, axis=1
        )

        df.set_index('opened_datetime', inplace=True)

        resampled = df.resample(freq).agg(
            total_minutes=('duration_minutes', 'sum'),
            productive_minutes=('productive_minutes', 'sum'),
            session_count=('duration_minutes', 'count')
        )

        resampled['focus_score_pct'] = resampled.apply(
            lambda r: round((r['productive_minutes'] / r['total_minutes'] * 100.0), 2)
            if r['total_minutes'] > 0 else 0.0,
            axis=1
        )

        return resampled.reset_index()


# ── WORKED EXAMPLE TEST VERIFICATION ─────────────────────────────────────────
if __name__ == "__main__":
    scorer = FocusScorer()
    
    # User worked example:
    # ProductA (Productive), 45 min
    # ProductB (Non-Productive), 240 min
    # ProductD (Productive), 210 min
    now = datetime.now()
    
    sessions = [
        {"app_name": "ProductA (Visual Studio Code)", "opened_datetime": now, "closed_datetime": now + timedelta(minutes=45)},
        {"app_name": "ProductB (YouTube & Reddit)", "opened_datetime": now + timedelta(minutes=45), "closed_datetime": now + timedelta(minutes=285)},
        {"app_name": "ProductD (PyCharm & Terminal)", "opened_datetime": now + timedelta(minutes=285), "closed_datetime": now + timedelta(minutes=495)},
    ]

    result = scorer.calculate_focus_score(sessions)
    print("Worked Example Focus Score Result:")
    print(f"  Total Minutes: {result['total_minutes']} (Expected: 495)")
    print(f"  Productive Minutes: {result['productive_minutes']} (Expected: 255)")
    print(f"  Focus Score %: {result['focus_score_pct']}% (Expected: 51.52%)")
    print(f"  Session Count: {result['session_count']} (Expected: 3)")

    assert result['total_minutes'] == 495.0, f"Expected 495, got {result['total_minutes']}"
    assert result['productive_minutes'] == 255.0, f"Expected 255, got {result['productive_minutes']}"
    assert result['focus_score_pct'] == 51.52, f"Expected 51.52, got {result['focus_score_pct']}"
    print("[SUCCESS] FocusScorer verification PASSED!")
