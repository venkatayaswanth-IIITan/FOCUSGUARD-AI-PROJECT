from datetime import datetime
from collections import defaultdict


# These categories align with the user's scenario:
# fever -> prescription -> hospital -> sushi restaurant -> health meals
DISTRACTION_CATEGORIES = {
    "productive":      ["code", "visual studio", "vscode", "terminal", "git", "docs", "notion", "jira", "pycharm", "intellij"],
    "health_search":   ["prescription", "fever", "medicine", "symptoms", "hospital", "clinic", "doctor", "health"],
    "food_leisure":    ["sushi", "restaurant", "food", "pizza", "swiggy", "zomato", "uber eats", "doordash", "recipe"],
    "social_media":    ["youtube", "facebook", "twitter", "instagram", "reddit", "tiktok", "x.com"],
    "entertainment":   ["netflix", "gaming", "steam", "spotify", "music", "movies"],
    "shopping":        ["amazon", "flipkart", "shopping", "buy", "cart"],
}


def classify_context(app_or_title: str) -> str:
    """Classify app or window title into a context category."""
    text = (app_or_title or "").lower()
    for category, keywords in DISTRACTION_CATEGORIES.items():
        if any(kw in text for kw in keywords):
            return category
    return "neutral"


class DistractionDetector:
    """Detects behavioral distraction loops from sequential app/window usage.

    Scenario example (fever chain):
        1. Coding (productive)      <- working state
        2. Search: 'fever prescription'  -> health_search
        3. Search: 'better hospital'     -> health_search
        4. Search: 'sushi restaurant'    -> food_leisure    (DERAILMENT)
        5. Search: 'healthy meals fever' -> health_search   (partial return)
        6. Back to coding              <- productive
    """

    def __init__(self, rapid_threshold_seconds: int = 180):
        """
        rapid_threshold_seconds: Switches within this window count as a rapid-switch burst.
        """
        self.rapid_threshold_seconds = rapid_threshold_seconds

    def analyze_sequence(self, activity_log: list) -> dict:
        """Analyze a time-ordered list of activity records for distraction loops.

        Each record: {
            'app_name': str,
            'window_title': str,
            'started_at': ISO datetime str,
            'ended_at': ISO datetime str,
            'duration_seconds': int
        }
        Returns full distraction loop analysis.
        """
        if not activity_log:
            return self._empty_result()

        # Enrich records with context categories
        enriched = []
        for rec in activity_log:
            combined = f"{rec.get('app_name', '')} {rec.get('window_title', '')}"
            enriched.append({
                **rec,
                "context": classify_context(combined),
                "started_at": self._parse_dt(rec.get("started_at")),
                "ended_at": self._parse_dt(rec.get("ended_at")),
            })

        distraction_loops = []
        rapid_switch_events = []
        return_times = []

        i = 0
        while i < len(enriched):
            cur = enriched[i]

            # Detect exit from productive context
            if cur["context"] == "productive":
                work_app = cur.get("app_name", "Work App")
                j = i + 1
                distraction_apps = []
                loop_start = cur.get("ended_at")

                while j < len(enriched) and enriched[j]["context"] != "productive":
                    distraction_apps.append({
                        "app_name": enriched[j].get("app_name", "Unknown"),
                        "window_title": enriched[j].get("window_title", ""),
                        "context": enriched[j]["context"],
                        "duration_seconds": enriched[j].get("duration_seconds", 0)
                    })
                    j += 1

                if len(distraction_apps) >= 2:
                    loop_end = enriched[j].get("started_at") if j < len(enriched) else None
                    away_seconds = 0
                    if loop_start and loop_end:
                        away_seconds = max(0, int((loop_end - loop_start).total_seconds()))

                    # Calculate return time
                    if away_seconds > 0:
                        return_times.append(away_seconds)

                    # Detect derailment: non-related context in the chain
                    contexts_visited = [d["context"] for d in distraction_apps]
                    initial_context = contexts_visited[0] if contexts_visited else "neutral"
                    derailments = [c for c in contexts_visited if c != initial_context and c != "productive"]

                    distraction_loops.append({
                        "work_app": work_app,
                        "apps_visited": [d["app_name"] for d in distraction_apps],
                        "contexts": contexts_visited,
                        "derailments": derailments,
                        "has_derailment": len(derailments) > 0,
                        "switch_count": len(distraction_apps),
                        "away_time_seconds": away_seconds,
                        "returned_to": enriched[j].get("app_name", work_app) if j < len(enriched) else work_app
                    })

                i = max(i + 1, j)
            else:
                i += 1

        # Detect rapid switch bursts: many switches within rapid_threshold_seconds
        timestamps = [e.get("started_at") for e in enriched if e.get("started_at")]
        burst_count = 0
        for k in range(len(timestamps) - 2):
            window = (timestamps[k + 2] - timestamps[k]).total_seconds()
            if window <= self.rapid_threshold_seconds:
                burst_count += 1

        avg_return_seconds = int(sum(return_times) / len(return_times)) if return_times else 0
        latest_return_seconds = return_times[-1] if return_times else 0

        # Top transitions from consecutive pairs
        pairs = []
        for k in range(len(enriched) - 1):
            a = enriched[k].get("app_name", "")
            b = enriched[k + 1].get("app_name", "")
            if a and b and a != b:
                pairs.append(f"{a} -> {b}")

        from collections import Counter
        pair_counts = Counter(pairs)
        top_transitions = [{"pair": pair, "count": count} for pair, count in pair_counts.most_common(5)]

        # Category time breakdown
        category_secs = defaultdict(float)
        total_secs = 0
        for e in enriched:
            dur = e.get("duration_seconds", 0) or 0
            category_secs[e["context"]] += dur
            total_secs += dur

        categories = []
        for cat, secs in sorted(category_secs.items(), key=lambda x: -x[1]):
            pct = round((secs / total_secs * 100), 1) if total_secs > 0 else 0
            categories.append({
                "name": cat.replace("_", " ").title(),
                "seconds": secs,
                "percentage": pct
            })

        return {
            "distraction_loops": distraction_loops,
            "rapid_switch_events": burst_count,
            "avg_return_time_seconds": avg_return_seconds,
            "latest_return_time_seconds": latest_return_seconds,
            "total_switches_today": len(pairs),
            "top_transitions": top_transitions,
            "categories": categories,
            "total_records_analyzed": len(enriched)
        }

    def _parse_dt(self, dt_val):
        if dt_val is None:
            return None
        if isinstance(dt_val, datetime):
            return dt_val
        try:
            return datetime.fromisoformat(str(dt_val).replace("Z", "+00:00"))
        except Exception:
            return None

    def _empty_result(self):
        return {
            "distraction_loops": [],
            "rapid_switch_events": 0,
            "avg_return_time_seconds": 0,
            "latest_return_time_seconds": 0,
            "total_switches_today": 0,
            "top_transitions": [],
            "categories": [],
            "total_records_analyzed": 0
        }


# ── FEVER DERAILMENT SCENARIO VERIFICATION ────────────────────────────────────
if __name__ == "__main__":
    from datetime import timedelta

    base = datetime(2026, 8, 18, 9, 0, 0)

    def make_record(app, title, start_offset_min, dur_min):
        s = base + timedelta(minutes=start_offset_min)
        e = s + timedelta(minutes=dur_min)
        return {
            "app_name": app,
            "window_title": title,
            "started_at": s.isoformat(),
            "ended_at": e.isoformat(),
            "duration_seconds": dur_min * 60
        }

    # Scenario: coding -> fever search -> hospital -> sushi -> health meals -> back to coding
    log = [
        make_record("Visual Studio Code", "main.py - FocusGuard", 0, 45),
        make_record("Google Chrome", "fever prescription treatment", 45, 5),
        make_record("Google Chrome", "better hospital near me", 50, 5),
        make_record("Google Chrome", "best sushi restaurant near me", 55, 10),   # DERAILMENT
        make_record("Google Chrome", "healthy meals for fever recovery", 65, 5),
        make_record("Visual Studio Code", "main.py - FocusGuard", 70, 30),
    ]

    detector = DistractionDetector(rapid_threshold_seconds=180)
    result = detector.analyze_sequence(log)

    print("\nDistraction Detection Scenario:")
    print(f"  Distraction Loops Found: {len(result['distraction_loops'])}")
    for loop in result["distraction_loops"]:
        print(f"    Work: {loop['work_app']}")
        print(f"    Apps Visited: {loop['apps_visited']}")
        print(f"    Contexts: {loop['contexts']}")
        print(f"    Derailments: {loop['derailments']}")
        print(f"    Has Derailment (sushi): {loop['has_derailment']}")
        print(f"    Away Time: {loop['away_time_seconds']}s")
    print(f"  Rapid Switch Events: {result['rapid_switch_events']}")
    print(f"  Avg Return Time: {result['avg_return_time_seconds']}s")
    print(f"  Categories: {result['categories']}")

    assert len(result["distraction_loops"]) == 1
    loop = result["distraction_loops"][0]
    assert loop["has_derailment"] == True
    assert "food_leisure" in loop["derailments"]

    print("\n[SUCCESS] DistractionDetector fever scenario PASSED!")
