import {
  AlertTriangle,
  Zap,
  RotateCcw,
  ArrowRight,
  PieChart,
  BrainCircuit,
  TrendingDown,
} from "lucide-react";

function formatMinutes(seconds) {
  if (!seconds || seconds <= 0) return "0m";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function AttentionInsights({ insights }) {
  if (!insights) return null;

  const {
    topTransitions = [],
    categories = [],
    distractionLoops = [],
    rapidSwitchEvents = 0,
    avgReturnTimeSeconds = 0,
    latestReturnTimeSeconds = 0,
    totalSwitchesToday = 0,
  } = insights;

  return (
    <div className="attentionInsightsContainer">
      {/* ── HEADER BANNER ── */}
      <div className="panel insightsHeader">
        <div className="insightsTitle">
          <div className="insightsIcon">
            <BrainCircuit size={24} />
          </div>
          <div>
            <span className="eyebrow">BEHAVIORAL INTELLIGENCE</span>
            <h3>Attention &amp; Interruption Insights</h3>
          </div>
        </div>
        <div className="insightsBadges">
          <div className="insightBadge badgeAmber">
            <Zap size={13} />
            <span>{rapidSwitchEvents} Rapid Switch Events</span>
          </div>
          <div className="insightBadge badgeBlue">
            <RotateCcw size={13} />
            <span>Avg Return: {formatMinutes(avgReturnTimeSeconds)}</span>
          </div>
        </div>
      </div>

      {/* ── INTELLIGENCE GRID ── */}
      <div className="insightsGrid">
        {/* 1. RECOVERY & RAPID SWITCHING CARD */}
        <div className="panel insightCard">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">ATTENTION RECOVERY</span>
              <h3>Return-to-Work Time</h3>
            </div>
            <RotateCcw size={18} className="iconMuted" />
          </div>

          <div className="metricHighlight">
            <h2>{formatMinutes(avgReturnTimeSeconds)}</h2>
            <p>Average time taken to return to coding after interruption</p>
          </div>

          <div className="metricSubGroup">
            <div className="subMetric">
              <span>Last Recovery Time</span>
              <strong>{formatMinutes(latestReturnTimeSeconds)}</strong>
            </div>
            <div className="subMetric">
              <span>Total Switches Today</span>
              <strong>{totalSwitchesToday} switches</strong>
            </div>
          </div>
        </div>

        {/* 2. RAPID SWITCHING DETECTOR */}
        <div className="panel insightCard">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">CONTEXT STABILITY</span>
              <h3>Rapid Switching Events</h3>
            </div>
            <Zap size={18} className="iconAmber" />
          </div>

          <div className="metricHighlight">
            <h2>{rapidSwitchEvents}</h2>
            <p>High-frequency switching bursts (3+ switches in &lt; 3 mins)</p>
          </div>

          <div className="rapidStatus">
            {rapidSwitchEvents > 0 ? (
              <div className="rapidAlert alertWarning">
                <AlertTriangle size={16} />
                <span>Context fragmenting! Focus degradation detected today.</span>
              </div>
            ) : (
              <div className="rapidAlert alertSuccess">
                <span>✓ Attention workflow is stable and focused.</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. CATEGORY DISTRIBUTION */}
        <div className="panel insightCard">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">APP CATEGORIES</span>
              <h3>Time Allocation</h3>
            </div>
            <PieChart size={18} className="iconMuted" />
          </div>

          <div className="categoryList">
            {categories.length === 0 && (
              <div className="emptyState">No category data logged today.</div>
            )}
            {categories.map((cat) => (
              <div className="catItem" key={cat.name}>
                <div className="catHeader">
                  <span className="catName">{cat.name}</span>
                  <span className="catPct">{cat.percentage}%</span>
                </div>
                <div className="progressTrack">
                  <div
                    className="progressFill"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DISTRACTION LOOPS & TOP TRANSITIONS ── */}
      <div className="insightsSecondaryGrid">
        {/* DISTRACTION LOOPS DETECTED */}
        <div className="panel distractionLoopsPanel">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">BEHAVIORAL SEQUENCE DETECTOR</span>
              <h3>Quick Distraction Loops</h3>
            </div>
            <TrendingDown size={18} className="iconRed" />
          </div>

          <div className="loopsList">
            {distractionLoops.length === 0 ? (
              <div className="emptyState">
                No major distraction loops detected today! Keep coding!
              </div>
            ) : (
              distractionLoops.map((loop, idx) => (
                <div className="loopCard" key={idx}>
                  <div className="loopTop">
                    <div className="loopBadge">
                      <AlertTriangle size={13} />
                      <span>Distraction Loop Detected</span>
                    </div>
                    <span className="loopTime">
                      {formatMinutes(loop.awayTimeSeconds)} away
                    </span>
                  </div>

                  <div className="loopSequence">
                    <span className="workApp">{loop.workApp}</span>
                    <ArrowRight size={14} className="arrowIcon" />
                    <span className="distractApps">
                      {loop.appsVisited.join(" → ")}
                    </span>
                    <ArrowRight size={14} className="arrowIcon" />
                    <span className="workApp">{loop.returnedTo}</span>
                  </div>

                  <div className="loopFooter">
                    <small>
                      Left {loop.workApp} for {formatMinutes(loop.awayTimeSeconds)}{" "}
                      and switched {loop.switchCount} times before returning.
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TOP CONTEXT SWITCHES */}
        <div className="panel topSwitchesPanel">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">TRANSITION FREQUENCY</span>
              <h3>Top Context Switches</h3>
            </div>
          </div>

          <div className="transitionsList">
            {topTransitions.length === 0 ? (
              <div className="emptyState">No app switch history recorded yet.</div>
            ) : (
              topTransitions.map((t, idx) => (
                <div className="transitionRow" key={idx}>
                  <div className="transPair">
                    <span className="pairNum">{String(idx + 1).padStart(2, "0")}</span>
                    <strong>{t.pair}</strong>
                  </div>
                  <span className="transCount">{t.count} times</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttentionInsights;
