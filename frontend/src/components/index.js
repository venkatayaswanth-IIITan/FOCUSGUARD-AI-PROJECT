/**
 * ============================================================================
 * FOCUSGUARD AI — FRONTEND COMPONENT DIRECTORY & REGISTRY
 * ============================================================================
 * 
 * This file indexes and categorizes all 25 components in FocusGuard AI.
 * When looking for a component to view or edit, consult the categories below:
 * 
 * 1. TAB VIEWS (Rendered inside Dashboard.jsx based on activeTab):
 *    - DashboardOverview     -> Default home tab (KPI cards, live stats, charts)
 *    - ActivityView          -> "Activity" tab (detailed foreground window logs)
 *    - FocusSessionsView     -> "Focus Sessions" tab (session history & pomodoro)
 *    - DistractionsView      -> "Distractions" tab (distraction alerts & penalties)
 *    - RecentTelemetryView   -> "Telemetry" tab (raw desktop agent data stream)
 *    - GoalsView             -> "Goals" tab (daily/weekly targets & progress)
 *    - ReportsView           -> "Reports" tab (PDF export, summary reports)
 *    - AnalyticsView         -> "Analytics" tab (in-depth attention score curves)
 *    - AIInsightsView        -> "AI Insights" tab (predictive ML recommendations)
 *    - SettingsView          -> "Settings" tab (customization & agent keys)
 * 
 * 2. NAVIGATION & LAYOUT:
 *    - Sidebar               -> Main collapsible left navigation menu
 *    - ProfileMenu           -> User profile dropdown in dashboard header
 *    - NotificationsCenter   -> Bell icon dropdown with live alerts
 *    - ThemeToggle           -> Dark/Light theme switcher
 *    - ParticleBackground    -> Ambient glassmorphic particles for landing page
 * 
 * 3. AI & INTERACTIVE AGENTS:
 *    - PersonalFocusBot      -> Floating RAG-powered AI assistant chatbot
 * 
 * 4. WIDGETS & TELEMETRY CARDS:
 *    - MLMetricsCard         -> Machine learning accuracy & model status card
 *    - LiveActivity          -> Real-time active window banner
 *    - AppUsage              -> Bar/Pie chart of top application usage
 *    - AttentionInsights     -> Attention score metrics & focus trends
 *    - SessionAnalytics      -> Session statistics & productivity charts
 *    - SessionsView          -> Session history list component
 *    - RecentActivity        -> Compact recent app switch list
 *    - StatCard              -> Reusable single-metric KPI card
 *    - Notification          -> Individual toast notification popup
 * ============================================================================
 */

// 1. Tab Views
export { default as DashboardOverview } from "./DashboardOverview";
export { default as ActivityView } from "./ActivityView";
export { default as FocusSessionsView } from "./FocusSessionsView";
export { default as DistractionsView } from "./DistractionsView";
export { default as RecentTelemetryView } from "./RecentTelemetryView";
export { default as GoalsView } from "./GoalsView";
export { default as ReportsView } from "./ReportsView";
export { default as AnalyticsView } from "./AnalyticsView";
export { default as AIInsightsView } from "./AIInsightsView";
export { default as SettingsView } from "./SettingsView";

// 2. Navigation & Layout
export { default as Sidebar } from "./Sidebar";
export { default as ProfileMenu } from "./ProfileMenu";
export { default as NotificationsCenter } from "./NotificationsCenter";
export { default as ThemeToggle } from "./ThemeToggle";
export { default as ParticleBackground } from "./ParticleBackground";

// 3. AI & Interactive Agents
export { default as PersonalFocusBot } from "./PersonalFocusBot";

// 4. Analytics Widgets & Sub-components
export { default as MLMetricsCard } from "./MLMetricsCard";
export { default as LiveActivity } from "./LiveActivity";
export { default as AppUsage } from "./AppUsage";
export { default as AttentionInsights } from "./AttentionInsights";
export { default as SessionAnalytics } from "./SessionAnalytics";
export { default as SessionsView } from "./SessionsView";
export { default as RecentActivity } from "./RecentActivity";
export { default as StatCard } from "./StatCard";
export { default as Notification } from "./Notification";
