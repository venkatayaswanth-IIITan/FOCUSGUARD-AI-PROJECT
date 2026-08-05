-- ==========================================
-- USER MONITORING SYSTEM
-- PostgreSQL Mock Database
-- ==========================================

DROP TABLE IF EXISTS user_activity;

CREATE TABLE user_activity (
    id SERIAL PRIMARY KEY,

    user_id INT NOT NULL,
    user_name VARCHAR(100) NOT NULL,

    user_type VARCHAR(30) NOT NULL,

    app_website VARCHAR(100) NOT NULL,
    url VARCHAR(255),

    activity_date DATE NOT NULL,

    opened_time TIME NOT NULL,
    closed_time TIME NOT NULL,

    duration_minutes INT NOT NULL,

    switch_tabs INT DEFAULT 0,

    productive BOOLEAN NOT NULL
);


-- ==========================================
-- USER 1
-- ==========================================

INSERT INTO user_activity
(user_id, user_name, user_type, app_website, url,
 activity_date, opened_time, closed_time,
 duration_minutes, switch_tabs, productive)
VALUES

(1, 'Yaswanth', 'Student', 'VS Code', NULL,
 '2026-07-29', '10:00:00', '10:40:00',
 40, 2, TRUE),

(1, 'Yaswanth', 'Student', 'YouTube', 'youtube.com',
 '2026-07-29', '10:40:00', '11:00:00',
 20, 5, FALSE),

(1, 'Yaswanth', 'Student', 'LeetCode', 'leetcode.com',
 '2026-07-29', '11:00:00', '11:45:00',
 45, 3, TRUE),

(1, 'Yaswanth', 'Student', 'Instagram', 'instagram.com',
 '2026-07-29', '11:45:00', '12:00:00',
 15, 6, FALSE);


-- ==========================================
-- USER 2
-- ==========================================

INSERT INTO user_activity
(user_id, user_name, user_type, app_website, url,
 activity_date, opened_time, closed_time,
 duration_minutes, switch_tabs, productive)
VALUES

(2, 'Rahul', 'Developer', 'VS Code', NULL,
 '2026-07-29', '10:00:00', '10:50:00',
 50, 3, TRUE),

(2, 'Rahul', 'Developer', 'Stack Overflow', 'stackoverflow.com',
 '2026-07-29', '10:50:00', '11:20:00',
 30, 4, TRUE),

(2, 'Rahul', 'Developer', 'Instagram', 'instagram.com',
 '2026-07-29', '11:20:00', '11:40:00',
 20, 7, FALSE),

(2, 'Rahul', 'Developer', 'GitHub', 'github.com',
 '2026-07-29', '11:40:00', '12:30:00',
 50, 3, TRUE);


-- ==========================================
-- USER 3
-- ==========================================

INSERT INTO user_activity
(user_id, user_name, user_type, app_website, url,
 activity_date, opened_time, closed_time,
 duration_minutes, switch_tabs, productive)
VALUES

(3, 'Hema', 'Student', 'ChatGPT', 'chatgpt.com',
 '2026-07-29', '10:00:00', '10:35:00',
 35, 3, TRUE),

(3, 'Hema', 'Student', 'YouTube', 'youtube.com',
 '2026-07-29', '10:35:00', '11:00:00',
 25, 5, FALSE),

(3, 'Hema', 'Student', 'Google Docs', 'docs.google.com',
 '2026-07-29', '11:00:00', '11:45:00',
 45, 2, TRUE),

(3, 'Hema', 'Student', 'Netflix', 'netflix.com',
 '2026-07-29', '11:45:00', '12:15:00',
 30, 4, FALSE);


-- ==========================================
-- DISPLAY ALL DATA
-- ==========================================

SELECT * 
FROM user_activity
ORDER BY user_id, opened_time;


-- ==========================================
-- USER SUMMARY
-- ==========================================

SELECT
    user_id,
    user_name,
    user_type,

    SUM(duration_minutes) AS total_time_minutes,

    SUM(
        CASE
            WHEN productive = TRUE
            THEN duration_minutes
            ELSE 0
        END
    ) AS productive_minutes,

    SUM(
        CASE
            WHEN productive = FALSE
            THEN duration_minutes
            ELSE 0
        END
    ) AS non_productive_minutes,

    SUM(switch_tabs) AS total_tab_switches

FROM user_activity

GROUP BY
    user_id,
    user_name,
    user_type

ORDER BY user_id;


-- ==========================================
-- PRODUCTIVITY PERCENTAGE
-- ==========================================

SELECT
    user_name,

    SUM(duration_minutes) AS total_minutes,

    SUM(
        CASE
            WHEN productive = TRUE
            THEN duration_minutes
            ELSE 0
        END
    ) AS productive_minutes,

    ROUND(
        (
            SUM(
                CASE
                    WHEN productive = TRUE
                    THEN duration_minutes
                    ELSE 0
                END
            )::DECIMAL
            /
            NULLIF(SUM(duration_minutes), 0)
        ) * 100,
        2
    ) AS productivity_percentage,

    SUM(switch_tabs) AS total_switch_tabs

FROM user_activity

GROUP BY user_name
ORDER BY user_name;


-- ==========================================
-- ONLY PRODUCTIVE ACTIVITY
-- ==========================================

SELECT *
FROM user_activity
WHERE productive = TRUE
ORDER BY user_id, opened_time;


-- ==========================================
-- ONLY NON-PRODUCTIVE ACTIVITY
-- ==========================================

SELECT *
FROM user_activity
WHERE productive = FALSE
ORDER BY user_id, opened_time;


-- ==========================================
-- ACTIVITY OF PARTICULAR USER
-- ==========================================

SELECT *
FROM user_activity
WHERE user_id = 1
ORDER BY opened_time;
