from collections import Counter, defaultdict
from datetime import datetime


class SlidingWindowHistory:
    """Variable sliding window storing tuples of (input_x, score_x)

    e.g., input 5 -> |_4, ans_|_3, ans_|_2, ans_|_1, ans_|0, ans_|
    When new input x+1 arrives, oldest entry shifts out.
    """

    def __init__(self, window_size=5):
        self.window_size = window_size
        self.buffer = []

    def push(self, input_val, ans_val):
        """Push new (input, answer) pair into sliding window."""
        self.buffer.append({
            "input": input_val,
            "ans": ans_val,
            "timestamp": datetime.now().isoformat()
        })
        if len(self.buffer) > self.window_size:
            self.buffer.pop(0)

    def get_history(self):
        """Returns window entries most recent first."""
        return list(reversed(self.buffer))

    def set_window_size(self, new_size: int):
        """Resize window; trims oldest entries if smaller."""
        self.window_size = max(1, new_size)
        while len(self.buffer) > self.window_size:
            self.buffer.pop(0)


class DailyWeeklyCacheManager:
    """Manages moving daily attention cache into weekly data storage.

    After rollover, clears daily cache for brand new upcoming calculations.
    """

    def __init__(self):
        self.daily_cache = defaultdict(list)
        self.weekly_data = defaultdict(list)

    def add_daily_entry(self, user_id, entry: dict):
        self.daily_cache[user_id].append(entry)

    def rollover_daily_to_weekly(self, user_id) -> bool:
        """Move daily cache -> weekly storage, then clear daily cache."""
        if user_id in self.daily_cache and self.daily_cache[user_id]:
            self.weekly_data[user_id].extend(self.daily_cache[user_id])
            # Brand new clear for upcoming daily calculations
            self.daily_cache[user_id] = []
            return True
        return False

    def clear_daily_cache(self, user_id):
        self.daily_cache[user_id] = []

    def get_weekly_data(self, user_id):
        return self.weekly_data.get(user_id, [])


class SwitchAnalyzer:
    """Analyzes application transitions into consecutive pairs (AppA -> AppB).

    Calculates:
      - from_frequency: how often each app was switched away from
      - to_frequency:   how often each app was switched into
      - pair_frequency: how often each (from, to) pair occurred
      - Max(Switches_count): the app with the highest total involvement in switches
    """

    def __init__(self, sliding_window_size: int = 5):
        self.window_history = SlidingWindowHistory(window_size=sliding_window_size)
        self.cache_manager = DailyWeeklyCacheManager()

    def build_consecutive_pairs(self, app_sequence: list) -> list:
        """Convert raw app sequence into consecutive transition pairs.

        e.g. [AppA, AppB, AppC, AppB] -> [(AppA,AppB), (AppB,AppC), (AppC,AppB)]
        Only records transitions between different apps.
        """
        pairs = []
        for i in range(len(app_sequence) - 1):
            app_from = app_sequence[i]
            app_to = app_sequence[i + 1]
            if app_from and app_to and app_from != app_to:
                pairs.append((app_from, app_to))
        return pairs

    def analyze_switches(self, app_sequence: list) -> dict:
        """Full switch analysis with Counter-based frequency tables and per-app max count."""
        if not app_sequence or len(app_sequence) < 2:
            return {
                "consecutive_pairs": [],
                "pair_frequency": {},
                "from_frequency": {},
                "to_frequency": {},
                "max_switches_app": None,
                "total_switches": 0
            }

        pairs = self.build_consecutive_pairs(app_sequence)

        pair_counter = Counter(f"{a} -> {b}" for a, b in pairs)
        from_counter = Counter(a for a, _ in pairs)
        to_counter = Counter(b for _, b in pairs)

        # Max(Switches_count) per App: sum of from + to involvement
        app_total = Counter()
        for app, count in from_counter.items():
            app_total[app] += count
        for app, count in to_counter.items():
            app_total[app] += count

        max_switches_app = None
        if app_total:
            top_app, top_count = app_total.most_common(1)[0]
            max_switches_app = {
                "app_name": top_app,
                "max_switches": top_count,
                "from_count": from_counter.get(top_app, 0),
                "to_count": to_counter.get(top_app, 0)
            }

        # Build app-level matrix showing "APP 1 -> APP 2, APP 3, APP 4" with counts
        switch_matrix = defaultdict(dict)
        for (app_from, app_to), count in Counter(pairs).items():
            switch_matrix[app_from][app_to] = count

        result = {
            "consecutive_pairs": [{"from": a, "to": b, "pair": f"{a} -> {b}"} for a, b in pairs],
            "pair_frequency": dict(pair_counter.most_common()),
            "from_frequency": dict(from_counter.most_common()),
            "to_frequency": dict(to_counter.most_common()),
            "switch_matrix": {k: dict(v) for k, v in switch_matrix.items()},
            "max_switches_app": max_switches_app,
            "total_switches": len(pairs)
        }

        # Store in sliding window history
        self.window_history.push(input_val=list(app_sequence), ans_val=result)
        return result

    def get_max_switches_per_app_per_day(self, daily_records: list) -> dict:
        """Aggregates max switch count per app across multiple daily session records.

        Each record in daily_records should have: {'app_sequence': [...]}
        Returns: {app_name: max_daily_switch_count}
        """
        all_switch_counts = defaultdict(list)
        for record in daily_records:
            seq = record.get("app_sequence", [])
            res = self.analyze_switches(seq)
            for app, count in res["from_frequency"].items():
                all_switch_counts[app].append(count)

        return {app: max(counts) for app, counts in all_switch_counts.items()}


# ── VERIFICATION TESTS ────────────────────────────────────────────────────────
if __name__ == "__main__":
    analyzer = SwitchAnalyzer(sliding_window_size=3)

    # Test: {AppA, AppB, AppC, AppB} -> pairs: (A->B), (B->C), (C->B)
    seq = ["AppA", "AppB", "AppC", "AppB"]
    res = analyzer.analyze_switches(seq)

    assert len(res["consecutive_pairs"]) == 3, f"Expected 3 pairs, got {len(res['consecutive_pairs'])}"
    assert res["pair_frequency"]["AppA -> AppB"] == 1
    assert res["pair_frequency"]["AppB -> AppC"] == 1
    assert res["pair_frequency"]["AppC -> AppB"] == 1
    assert res["max_switches_app"]["app_name"] == "AppB"
    print("[PASS] Basic pairs test")

    # Real-world sequence with repetitions
    seq2 = ["Visual Studio Code", "Google Chrome", "Windows Terminal", "Google Chrome", "Visual Studio Code"]
    res2 = analyzer.analyze_switches(seq2)

    assert res2["pair_frequency"]["Visual Studio Code -> Google Chrome"] == 1
    assert res2["pair_frequency"]["Google Chrome -> Windows Terminal"] == 1
    assert res2["pair_frequency"]["Windows Terminal -> Google Chrome"] == 1
    assert res2["pair_frequency"]["Google Chrome -> Visual Studio Code"] == 1
    assert res2["total_switches"] == 4
    print("[PASS] Real-world sequence test")

    # Matrix: APP 1 -> APP 2, APP 3, APP 4 count 2, 1, 1
    seq3 = ["APP1", "APP2", "APP3", "APP2", "APP4"]
    res3 = analyzer.analyze_switches(seq3)
    # APP1->APP2:1, APP2->APP3:1, APP3->APP2:1, APP2->APP4:1
    assert res3["switch_matrix"]["APP2"]["APP3"] == 1
    assert res3["switch_matrix"]["APP2"]["APP4"] == 1
    print("[PASS] Switch matrix test:", res3["switch_matrix"])

    # Sliding window test
    assert len(analyzer.window_history.buffer) == 3
    print("[PASS] Sliding window limit (size=3) test")

    # Cache rollover test
    cm = analyzer.cache_manager
    cm.add_daily_entry(user_id=1, entry=res)
    cm.add_daily_entry(user_id=1, entry=res2)
    assert len(cm.daily_cache[1]) == 2
    cm.rollover_daily_to_weekly(user_id=1)
    assert len(cm.daily_cache[1]) == 0, "Daily cache should be cleared after rollover"
    assert len(cm.weekly_data[1]) == 2, "Weekly data should have 2 entries"
    print("[PASS] Daily -> Weekly cache rollover test")

    print("\n[SUCCESS] SwitchAnalyzer & SlidingWindowHistory ALL TESTS PASSED!")
