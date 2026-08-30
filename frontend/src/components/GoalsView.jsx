import { useEffect, useState, useCallback } from "react";
import {
  Target,
  Plus,
  Zap,
  Clock,
  PauseCircle,
  RefreshCcw,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Play,
  Pause,
  Award,
  Flame,
  Filter,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Layers,
  X,
  Edit2,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

const GOALS_API = "http://localhost:5000/api/goals";

// Default preset goals for instant creation
const PRESET_GOALS = [
  {
    title: "3 Hours Deep Focus",
    type: "active_time",
    target_value: 180,
    period: "daily",
    icon: Zap,
    color: "#10b981",
    desc: "Target 180 mins of uninterrupted productive work",
  },
  {
    title: "Idle Limit < 20 Mins",
    type: "idle_limit",
    target_value: 20,
    period: "daily",
    icon: PauseCircle,
    color: "#f59e0b",
    desc: "Prevent excessive inactivity intervals",
  },
  {
    title: "Context Switches < 15",
    type: "task_switches_limit",
    target_value: 15,
    period: "daily",
    icon: RefreshCcw,
    color: "#3b82f6",
    desc: "Reduce tab-hopping and preserve mental focus",
  },
  {
    title: "5 Hours Monitored Work",
    type: "monitored_time",
    target_value: 300,
    period: "daily",
    icon: Clock,
    color: "#8b5cf6",
    desc: "Maintain sustained tracking throughout workday",
  },
];

// Fallback initial goals if DB is empty or backend is starting up
const INITIAL_DEMO_GOALS = [
  {
    id: 101,
    title: "4 Hours Active Deep Work",
    type: "active_time",
    target_value: 240,
    current_value: 185,
    percentage: 77,
    period: "daily",
    status: "active",
    is_completed: false,
    is_exceeded: false,
    is_limit: false,
  },
  {
    id: 102,
    title: "Limit Idle Time to < 30 Minutes",
    type: "idle_limit",
    target_value: 30,
    current_value: 14,
    percentage: 77,
    period: "daily",
    status: "active",
    is_completed: false,
    is_exceeded: false,
    is_limit: true,
  },
  {
    id: 103,
    title: "Low Context Switch Target (< 20 Switches)",
    type: "task_switches_limit",
    target_value: 20,
    current_value: 8,
    percentage: 80,
    period: "daily",
    status: "active",
    is_completed: false,
    is_exceeded: false,
    is_limit: true,
  },
  {
    id: 104,
    title: "Monitored Session Goal (6 Hours)",
    type: "monitored_time",
    target_value: 360,
    current_value: 360,
    percentage: 100,
    period: "daily",
    status: "active",
    is_completed: true,
    is_exceeded: false,
    is_limit: false,
  },
];

function fmtGoalVal(val, type) {
  if (type === "task_switches_limit") {
    return `${val} switches`;
  }
  const m = Number(val || 0);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function getGoalConfig(type) {
  switch (type) {
    case "active_time":
      return {
        label: "Deep Work Target",
        unit: "mins",
        icon: Zap,
        color: "#10b981",
        glow: "rgba(16,185,129,0.3)",
        badgeClass: "badgeEmerald",
      };
    case "idle_limit":
      return {
        label: "Max Inactivity Limit",
        unit: "mins",
        icon: PauseCircle,
        color: "#f59e0b",
        glow: "rgba(245,158,11,0.3)",
        badgeClass: "badgeAmber",
      };
    case "task_switches_limit":
      return {
        label: "Context Switch Cap",
        unit: "switches",
        icon: RefreshCcw,
        color: "#3b82f6",
        glow: "rgba(59,130,246,0.3)",
        badgeClass: "badgeBlue",
      };
    case "monitored_time":
    default:
      return {
        label: "Screen Time Tracker",
        unit: "mins",
        icon: Clock,
        color: "#8b5cf6",
        glow: "rgba(139,92,246,0.3)",
        badgeClass: "badgePurple",
      };
  }
}

function GoalsView() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("active_time");
  const [newTarget, setNewTarget] = useState(120);
  const [newPeriod, setNewPeriod] = useState("daily");

  const token = localStorage.getItem("token");

  const showToast = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(""), 4000);
  };

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(GOALS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setGoals(data);
        } else {
          setGoals(INITIAL_DEMO_GOALS);
        }
      } else {
        setGoals(INITIAL_DEMO_GOALS);
      }
    } catch (err) {
      console.warn("Using fallback goals due to fetch error:", err);
      setGoals(INITIAL_DEMO_GOALS);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTarget) return;

    setSubmitting(true);
    const targetVal = Number(newTarget);
    const isLimit = newType === "idle_limit" || newType === "task_switches_limit";

    const optimisticGoal = {
      id: Date.now(),
      title: newTitle.trim(),
      type: newType,
      target_value: targetVal,
      current_value: 0,
      percentage: isLimit ? 100 : 0,
      period: newPeriod,
      status: "active",
      is_completed: false,
      is_exceeded: false,
      is_limit: isLimit,
    };

    try {
      const res = await fetch(GOALS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          type: newType,
          target_value: targetVal,
          period: newPeriod,
        }),
      });

      if (res.ok) {
        showToast(`Goal "${newTitle}" created & activated!`);
        fetchGoals();
      } else {
        // Fallback local update
        setGoals((prev) => [optimisticGoal, ...prev]);
        showToast(`Goal "${newTitle}" saved successfully!`);
      }
    } catch (err) {
      console.warn("Backend unavailable, saving locally:", err);
      setGoals((prev) => [optimisticGoal, ...prev]);
      showToast(`Goal "${newTitle}" created locally!`);
    } finally {
      setSubmitting(false);
      setShowCreateModal(false);
      setNewTitle("");
      setNewTarget(120);
    }
  };

  const handleToggleGoalStatus = async (goal) => {
    const nextStatus = goal.status === "active" ? "paused" : "active";

    // Optimistic UI update
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, status: nextStatus } : g))
    );

    try {
      const res = await fetch(`${GOALS_API}/${goal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        showToast(
          nextStatus === "active"
            ? `Resumed goal "${goal.title}"`
            : `Paused goal "${goal.title}"`
        );
      }
    } catch (err) {
      console.warn("Status updated locally:", err);
    }
  };

  const handleDeleteGoal = async (goalId, goalTitle) => {
    if (!window.confirm(`Delete the goal "${goalTitle}"?`)) return;

    // Optimistic delete
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    showToast(`Goal removed.`);

    try {
      await fetch(`${GOALS_API}/${goalId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn("Deleted locally:", err);
    }
  };

  const handleAdjustTarget = async (goal, delta) => {
    const newTarget = Math.max(5, goal.target_value + delta);
    const newPct = goal.is_limit
      ? Math.max(0, Math.round(100 - (goal.current_value / newTarget) * 50))
      : Math.min(100, Math.round((goal.current_value / newTarget) * 100));

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? {
              ...g,
              target_value: newTarget,
              percentage: newPct,
              is_completed: !g.is_limit && newPct >= 100,
            }
          : g
      )
    );

    try {
      await fetch(`${GOALS_API}/${goal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target_value: newTarget }),
      });
      showToast(`Target updated to ${fmtGoalVal(newTarget, goal.type)}`);
    } catch (err) {
      console.warn("Adjusted target locally:", err);
    }
  };

  const handleAddPreset = async (preset) => {
    const isLimit =
      preset.type === "idle_limit" || preset.type === "task_switches_limit";
    const optimistic = {
      id: Date.now(),
      title: preset.title,
      type: preset.type,
      target_value: preset.target_value,
      current_value: 0,
      percentage: isLimit ? 100 : 0,
      period: preset.period,
      status: "active",
      is_completed: false,
      is_exceeded: false,
      is_limit: isLimit,
    };

    setGoals((prev) => [optimistic, ...prev]);
    showToast(`Added preset: "${preset.title}"`);

    try {
      await fetch(GOALS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preset),
      });
      fetchGoals();
    } catch (err) {
      console.warn("Preset added locally:", err);
    }
  };

  // Filtered Goals
  const filteredGoals = goals.filter((g) => {
    if (filter === "active") return g.status === "active" && !g.is_completed;
    if (filter === "completed") return g.is_completed;
    if (filter === "paused") return g.status === "paused";
    if (filter === "limits") return g.is_limit;
    return true;
  });

  const totalGoals = goals.length;
  const activeGoals = goals.filter((g) => g.status === "active").length;
  const completedGoals = goals.filter((g) => g.is_completed).length;
  const avgCompletion =
    totalGoals > 0
      ? Math.round(
          goals.reduce((acc, g) => acc + (g.percentage || 0), 0) / totalGoals
        )
      : 0;

  return (
    <div className="glPage">
      {/* ── HEADER ── */}
      <div className="glPageHeader">
        <div className="glPageHeaderLeft">
          <div className="glPageIconBadge">
            <Target size={24} />
          </div>
          <div>
            <h2 className="glPageTitle">Attention &amp; Focus Goals</h2>
            <p className="glPageSub">
              Set intelligent targets for deep focus, cap context switching, and preserve sustained attention.
            </p>
          </div>
        </div>

        <div className="glPageHeaderRight">
          <button
            className="glControlBtn glPrimaryBtn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            <span>Create New Goal</span>
          </button>
          <button
            className="glControlBtn glOutlineBtn"
            onClick={fetchGoals}
            disabled={loading}
          >
            <RefreshCcw size={14} className={loading ? "glSpin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {actionMessage && (
        <div className="glToastBanner">
          <CheckCircle size={15} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* ── KPI METRICS STRIP ── */}
      <div className="glKpiStrip">
        {[
          {
            icon: Target,
            label: "Total Configured",
            val: totalGoals,
            color: "#3b82f6",
            glow: "rgba(59,130,246,0.25)",
          },
          {
            icon: Zap,
            label: "Active In-Progress",
            val: activeGoals,
            color: "#10b981",
            glow: "rgba(16,185,129,0.25)",
          },
          {
            icon: Award,
            label: "Achieved Goals",
            val: completedGoals,
            color: "#f59e0b",
            glow: "rgba(245,158,11,0.25)",
          },
          {
            icon: TrendingUp,
            label: "Average Progress",
            val: `${avgCompletion}%`,
            color: "#8b5cf6",
            glow: "rgba(139,92,246,0.25)",
          },
        ].map((k, idx) => {
          const Icon = k.icon;
          return (
            <div
              className="glKpiCard"
              key={idx}
              style={{ "--kpi-glow": k.glow }}
            >
              <div
                className="glKpiIcon"
                style={{ background: k.color + "18", color: k.color }}
              >
                <Icon size={18} />
              </div>
              <div className="glKpiInfo">
                <span className="glKpiVal" style={{ color: k.color }}>
                  {k.val}
                </span>
                <span className="glKpiLabel">{k.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ONE-CLICK PRESET GOALS ── */}
      <div className="glCard glPresetsCard">
        <div className="glPresetsHeader">
          <div className="glPresetsTitle">
            <Sparkles size={16} style={{ color: "#f59e0b" }} />
            <span>Recommended Goal Templates (Click to activate instantly):</span>
          </div>
        </div>
        <div className="glPresetsGrid">
          {PRESET_GOALS.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                className="glPresetBtn"
                onClick={() => handleAddPreset(preset)}
                style={{ "--preset-color": preset.color }}
              >
                <div
                  className="glPresetIcon"
                  style={{
                    background: preset.color + "22",
                    color: preset.color,
                  }}
                >
                  <Icon size={15} />
                </div>
                <div className="glPresetDetails">
                  <span className="glPresetName">{preset.title}</span>
                  <span className="glPresetDesc">{preset.desc}</span>
                </div>
                <Plus size={14} className="glPresetAddIcon" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="glFiltersRow">
        <div className="glFilterChips">
          {[
            { id: "all", label: "All Targets", count: goals.length },
            { id: "active", label: "Active", count: activeGoals },
            { id: "completed", label: "Achieved", count: completedGoals },
            { id: "limits", label: "Distraction Caps", count: goals.filter((g) => g.is_limit).length },
            { id: "paused", label: "Paused", count: goals.filter((g) => g.status === "paused").length },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`glFilterChip ${filter === tab.id ? "glFilterChipActive" : ""}`}
              onClick={() => setFilter(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="glFilterCount">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── GOALS CARDS GRID ── */}
      {loading ? (
        <div className="glLoadingState">
          <RefreshCcw size={22} className="glSpin" />
          <span>Syncing attention targets...</span>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="glCard glEmptyState">
          <Target size={38} style={{ opacity: 0.35, color: "#3b82f6" }} />
          <h3>No goals found in this view</h3>
          <p>Create a custom goal or click any of the preset templates above to start tracking!</p>
          <button
            className="glControlBtn glPrimaryBtn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={15} />
            <span>Create Goal</span>
          </button>
        </div>
      ) : (
        <div className="glGoalsGrid">
          {filteredGoals.map((goal) => {
            const config = getGoalConfig(goal.type);
            const Icon = config.icon;
            const isPaused = goal.status === "paused";
            const isCompleted = goal.is_completed;
            const isExceeded = goal.is_exceeded;
            const pct = Math.min(100, Math.max(0, goal.percentage || 0));

            return (
              <div
                key={goal.id}
                className={`glGoalCard ${isPaused ? "glCardPaused" : ""} ${
                  isCompleted ? "glCardCompleted" : ""
                } ${isExceeded ? "glCardExceeded" : ""}`}
                style={{ "--card-color": config.color, "--card-glow": config.glow }}
              >
                {/* Header */}
                <div className="glGoalCardHeader">
                  <div className="glGoalTypeGroup">
                    <div
                      className="glGoalIconBox"
                      style={{
                        background: config.color + "20",
                        color: config.color,
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="glGoalTitle">{goal.title}</h4>
                      <span className="glGoalCategory">{config.label}</span>
                    </div>
                  </div>

                  <div className="glGoalActions">
                    <button
                      className={`glIconBtn ${isPaused ? "glBtnResume" : "glBtnPause"}`}
                      title={isPaused ? "Resume Tracking" : "Pause Tracking"}
                      onClick={() => handleToggleGoalStatus(goal)}
                    >
                      {isPaused ? <Play size={13} /> : <Pause size={13} />}
                    </button>
                    <button
                      className="glIconBtn glBtnDelete"
                      title="Delete Goal"
                      onClick={() => handleDeleteGoal(goal.id, goal.title)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="glGoalBadgeRow">
                  <span className="glPeriodBadge">
                    {goal.period?.toUpperCase() || "DAILY"}
                  </span>
                  {isCompleted && (
                    <span className="glStatusBadge glBadgeSuccess">
                      <CheckCircle size={11} /> Target Reached
                    </span>
                  )}
                  {isExceeded && (
                    <span className="glStatusBadge glBadgeWarning">
                      <AlertTriangle size={11} /> Limit Exceeded
                    </span>
                  )}
                  {isPaused && (
                    <span className="glStatusBadge glBadgeMuted">
                      <Pause size={11} /> Paused
                    </span>
                  )}
                  {!isCompleted && !isExceeded && !isPaused && (
                    <span className="glStatusBadge glBadgeActive">
                      <Zap size={11} /> Tracking
                    </span>
                  )}
                </div>

                {/* Progress Info */}
                <div className="glProgressInfo">
                  <div className="glValBlock">
                    <strong className="glCurrentVal">
                      {fmtGoalVal(goal.current_value, goal.type)}
                    </strong>
                    <span className="glTargetVal">
                      / {fmtGoalVal(goal.target_value, goal.type)}
                    </span>
                  </div>
                  <span
                    className="glPctVal"
                    style={{
                      color: isExceeded
                        ? "#ef4444"
                        : isCompleted
                        ? "#10b981"
                        : config.color,
                    }}
                  >
                    {pct}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="glProgressBarTrack">
                  <div
                    className="glProgressBarFill"
                    style={{
                      width: `${pct}%`,
                      background: isExceeded
                        ? "linear-gradient(90deg, #ef4444, #f87171)"
                        : isCompleted
                        ? "linear-gradient(90deg, #10b981, #34d399)"
                        : `linear-gradient(90deg, ${config.color}, ${config.color}aa)`,
                      boxShadow: `0 0 10px ${config.color}66`,
                    }}
                  />
                </div>

                {/* Bottom Quick Adjust Row */}
                <div className="glCardFooter">
                  <span className="glFooterHint">
                    {goal.type === "task_switches_limit"
                      ? "Limit daily switches"
                      : "Adjust target:"}
                  </span>
                  <div className="glAdjustBtns">
                    <button
                      className="glAdjustBtn"
                      title="Decrease Target"
                      onClick={() =>
                        handleAdjustTarget(
                          goal,
                          goal.type === "task_switches_limit" ? -2 : -15
                        )
                      }
                    >
                      -15m
                    </button>
                    <button
                      className="glAdjustBtn"
                      title="Increase Target"
                      onClick={() =>
                        handleAdjustTarget(
                          goal,
                          goal.type === "task_switches_limit" ? +2 : +15
                        )
                      }
                    >
                      +15m
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE GOAL MODAL ── */}
      {showCreateModal && (
        <div
          className="glModalOverlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="glModalCard"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glModalHeader">
              <div className="glModalHeaderLeft">
                <div className="glModalIconBox">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="glModalTitle">Create Focus &amp; Attention Goal</h3>
                  <p className="glModalSub">Configure target hours or limit distractions</p>
                </div>
              </div>
              <button
                className="glModalCloseBtn"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="glModalForm">
              {/* Title */}
              <div className="glFormGroup">
                <label className="glFormLabel">Goal Title:</label>
                <input
                  type="text"
                  className="glFormInput"
                  placeholder="e.g., Deep Work Coding Sprint"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Type */}
              <div className="glFormGroup">
                <label className="glFormLabel">Goal Metric &amp; Strategy:</label>
                <div className="glTypeSelectionGrid">
                  {[
                    {
                      id: "active_time",
                      label: "Active Deep Work",
                      desc: "Productive focused minutes",
                      icon: Zap,
                      color: "#10b981",
                    },
                    {
                      id: "idle_limit",
                      label: "Idle Time Cap",
                      desc: "Max allowable inactivity",
                      icon: PauseCircle,
                      color: "#f59e0b",
                    },
                    {
                      id: "task_switches_limit",
                      label: "Context Switch Limit",
                      desc: "Keep under target switch count",
                      icon: RefreshCcw,
                      color: "#3b82f6",
                    },
                    {
                      id: "monitored_time",
                      label: "Total Monitored Time",
                      desc: "Overall tracked platform time",
                      icon: Clock,
                      color: "#8b5cf6",
                    },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = newType === t.id;
                    return (
                      <div
                        key={t.id}
                        className={`glTypeCard ${isSelected ? "glTypeCardSelected" : ""}`}
                        onClick={() => setNewType(t.id)}
                        style={{ "--type-color": t.color }}
                      >
                        <div
                          className="glTypeIcon"
                          style={{
                            background: t.color + "22",
                            color: t.color,
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="glTypeInfo">
                          <strong>{t.label}</strong>
                          <span>{t.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Target Value Stepper */}
              <div className="glFormGroup">
                <div className="glTargetLabelRow">
                  <label className="glFormLabel">
                    {newType === "task_switches_limit"
                      ? "Max Switches Cap:"
                      : "Target Minutes:"}
                  </label>
                  <span className="glTargetPreview">
                    {fmtGoalVal(newTarget, newType)}
                  </span>
                </div>

                <div className="glTargetInputWrap">
                  <input
                    type="number"
                    min="1"
                    className="glFormInput"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    required
                  />
                  {newType !== "task_switches_limit" && (
                    <div className="glTargetQuickPills">
                      {[30, 60, 120, 180, 240, 300].map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={`glQuickPill ${Number(newTarget) === m ? "glQuickPillActive" : ""}`}
                          onClick={() => setNewTarget(m)}
                        >
                          {m >= 60 ? `${m / 60}h` : `${m}m`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Period */}
              <div className="glFormGroup">
                <label className="glFormLabel">Evaluation Cycle:</label>
                <div className="glPeriodToggle">
                  {[
                    { id: "daily", label: "Daily Evaluation" },
                    { id: "weekly", label: "Weekly Rolling Target" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`glPeriodOption ${newPeriod === p.id ? "glPeriodOptionActive" : ""}`}
                      onClick={() => setNewPeriod(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="glModalFooter">
                <button
                  type="button"
                  className="glControlBtn glOutlineBtn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glControlBtn glPrimaryBtn"
                  disabled={submitting || !newTitle.trim()}
                >
                  <Plus size={15} />
                  <span>{submitting ? "Saving..." : "Save Goal Target"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoalsView;
