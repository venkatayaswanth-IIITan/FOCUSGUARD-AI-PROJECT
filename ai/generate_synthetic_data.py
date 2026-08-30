"""
FocusGuard AI — Synthetic Training Data Generator
===================================================
Generates a realistic 500-row dataset of user activity patterns.
Saved to: data/synthetic_training_data.csv
"""

import random
import csv
import os
from datetime import datetime, timedelta

random.seed(42)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH  = os.path.join(BASE_DIR, "data", "synthetic_training_data.csv")

# ── App profiles ─────────────────────────────────────────────────────────────
# (app_name, productive, base_duration_min, base_switches, url)
PRODUCTIVE_APPS = [
    ("VS Code",          True,  40, 2, ""),
    ("GitHub",           True,  25, 2, "github.com"),
    ("Stack Overflow",   True,  20, 3, "stackoverflow.com"),
    ("LeetCode",         True,  35, 2, "leetcode.com"),
    ("ChatGPT",          True,  30, 2, "chatgpt.com"),
    ("Google Docs",      True,  45, 1, "docs.google.com"),
    ("Notion",           True,  50, 1, "notion.so"),
    ("Postman",          True,  20, 3, ""),
    ("PyCharm",          True,  55, 2, ""),
    ("Figma",            True,  40, 2, "figma.com"),
    ("Coursera",         True,  35, 2, "coursera.org"),
    ("Udemy",            True,  40, 2, "udemy.com"),
    ("LinkedIn",         True,  15, 3, "linkedin.com"),
    ("Google Sheets",    True,  30, 2, "sheets.google.com"),
    ("Slack (work)",     True,  20, 4, "slack.com"),
]

DISTRACTION_APPS = [
    ("YouTube",          False, 18, 6, "youtube.com"),
    ("Instagram",        False, 12, 7, "instagram.com"),
    ("Netflix",          False, 30, 3, "netflix.com"),
    ("Reddit",           False, 15, 8, "reddit.com"),
    ("Twitter",          False, 10, 9, "twitter.com"),
    ("TikTok",           False,  8, 10,"tiktok.com"),
    ("Facebook",         False, 14, 7, "facebook.com"),
    ("Discord (gaming)", False, 25, 5, "discord.com"),
    ("Spotify",          False, 20, 3, "spotify.com"),
    ("Amazon",           False, 12, 6, "amazon.com"),
    ("Snapchat",         False,  9, 9, "snapchat.com"),
]

USER_TYPES = ["Student", "Developer", "Designer", "Analyst", "Manager"]

def jitter(base, pct=0.4):
    """Add ±40% random noise to a value."""
    noise = random.uniform(1 - pct, 1 + pct)
    return max(1, round(base * noise))

rows = []
activity_date = datetime(2026, 7, 29)

for i in range(500):
    # Pick user
    user_id   = random.randint(1, 8)
    user_name = f"User{user_id}"
    user_type = random.choice(USER_TYPES)

    # Tilt: students/developers use more productive apps
    if user_type in ("Developer", "Analyst"):
        pool = PRODUCTIVE_APPS * 3 + DISTRACTION_APPS
    elif user_type == "Student":
        pool = PRODUCTIVE_APPS * 2 + DISTRACTION_APPS
    else:
        pool = PRODUCTIVE_APPS + DISTRACTION_APPS

    app_name, productive, base_dur, base_sw, url = random.choice(pool)

    duration  = jitter(base_dur)
    switches  = jitter(base_sw, pct=0.5)

    # Edge cases: very short sessions on productive apps → sometimes mark not productive
    if productive and duration < 5 and switches > 6:
        productive = False

    # Edge cases: very long productive sessions on distraction apps → keep productive=False
    if not productive and duration > 45:
        productive = False  # still distraction regardless

    hour   = random.randint(8, 21)
    minute = random.randint(0, 59)
    opened = f"{hour:02d}:{minute:02d}:00"
    h2     = hour + duration // 60
    m2     = (minute + duration % 60) % 60
    closed = f"{h2:02d}:{m2:02d}:00"

    rows.append({
        "id":               i + 1,
        "user_id":          user_id,
        "user_name":        user_name,
        "user_type":        user_type,
        "app_website":      app_name,
        "url":              url,
        "activity_date":    activity_date.strftime("%Y-%m-%d"),
        "opened_time":      opened,
        "closed_time":      closed,
        "duration_minutes": duration,
        "switch_tabs":      switches,
        "productive":       str(productive).lower(),
    })

# Write CSV
fields = ["id","user_id","user_name","user_type","app_website","url",
          "activity_date","opened_time","closed_time","duration_minutes",
          "switch_tabs","productive"]

with open(OUT_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)

productive_count = sum(1 for r in rows if r["productive"] == "true")
print(f"Generated {len(rows)} rows -> {OUT_PATH}")
print(f"   Productive    : {productive_count}")
print(f"   Not Productive: {len(rows) - productive_count}")
print(f"   Unique apps   : {len(set(r['app_website'] for r in rows))}")
print(f"   User types    : {set(r['user_type'] for r in rows)}")
