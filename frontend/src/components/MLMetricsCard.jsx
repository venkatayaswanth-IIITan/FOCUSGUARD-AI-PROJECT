import { useEffect, useState } from "react";
import { Brain, CheckCircle, BarChart3, ShieldCheck, Cpu } from "lucide-react";
import { API_MONITORING } from "../services/api";

function MLMetricsCard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch(`${API_MONITORING}/ml-metrics`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to fetch ML metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="panel mlMetricsPanel">
        <div className="emptyState">Loading AI Model Accuracy Metrics...</div>
      </div>
    );
  }

  const models = metrics?.models || {};

  return (
    <div className="panel mlMetricsPanel">
      <div className="panelHeader">
        <div>
          <span className="eyebrow">MACHINE LEARNING PERFORMANCE</span>
          <h3>AI Productivity Model Metrics</h3>
        </div>
        <span className="liveBadge badgeGreen">
          <Brain size={13} style={{ marginRight: 4 }} />
          70% Train / 30% Test Split
        </span>
      </div>

      <div className="mlMetricsOverview">
        <div className="mlDatasetInfo">
          <p>
            <strong>Training Dataset:</strong> {metrics?.dataset || "Synthetic Activity Dataset (500 samples)"}
          </p>
          <p>
            <strong>Best Model:</strong> <span className="highlightBest">{metrics?.best_model || "Random Forest"}</span> ({metrics?.train_samples || 350} train / {metrics?.test_samples || 150} test)
          </p>
        </div>
      </div>

      <div className="mlModelsGrid">
        {Object.entries(models).map(([modelName, m]) => {
          const isBest = metrics?.best_model === modelName;
          return (
            <div className={`mlModelCard ${isBest ? "bestModelCard" : ""}`} key={modelName}>
              <div className="mlModelCardHeader">
                <div className="mlModelTitleRow">
                  <Cpu size={18} className="iconBlue" />
                  <h4>{modelName}</h4>
                </div>
                {isBest && <span className="bestTag"><CheckCircle size={12} /> Best Model</span>}
              </div>

              <div className="mlMainAccuracyDisplay">
                <span className="accNumber">{m.accuracy}%</span>
                <span className="accLabel">Test Accuracy</span>
              </div>

              <div className="mlSubMetricsGrid">
                <div className="subMetric">
                  <span className="subMetricLabel">Precision</span>
                  <strong className="subMetricVal">{m.precision}%</strong>
                </div>
                <div className="subMetric">
                  <span className="subMetricLabel">Recall</span>
                  <strong className="subMetricVal">{m.recall}%</strong>
                </div>
                <div className="subMetric">
                  <span className="subMetricLabel">F1 Score</span>
                  <strong className="subMetricVal">{m.f1_score}%</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MLMetricsCard;
