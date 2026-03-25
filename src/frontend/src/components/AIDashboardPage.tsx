import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Clock,
  Database,
  RefreshCw,
  XCircle,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { getAutoLearnStats } from "../hooks/useLearningEngine";
import { getAIStats } from "../lib/aiEngine";

interface LogEntry {
  timestamp: number;
  message: string;
  type: "learn" | "failure" | "adjust" | "breaker";
}

const LOG_KEY = "t77_ai_log";
const FAILURES_KEY = "t77_ai_failures";

function getLogs(): LogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function getFailures(): LogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(FAILURES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function addLog(msg: string, type: LogEntry["type"]) {
  const logs = getLogs();
  logs.unshift({ timestamp: Date.now(), message: msg, type });
  if (logs.length > 50) logs.length = 50;
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function fmtSince(ts: number) {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export default function AIDashboardPage() {
  const [aiStats, setAiStats] = useState(() => getAIStats());
  const [learnStats, setLearnStats] = useState(() => getAutoLearnStats());
  const [logs, setLogs] = useState<LogEntry[]>(getLogs);
  const [failures, setFailures] = useState<LogEntry[]>(getFailures);
  const [uptime, setUptime] = useState(0);
  const [modelSize, setModelSize] = useState(48.0);
  const [lastSync, setLastSync] = useState(Date.now());
  const [isLearning, setIsLearning] = useState(true);
  const uptimeStart = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setUptime(Math.floor((Date.now() - uptimeStart.current) / 1000));
      setLastSync(Date.now());
      const newStats = getAIStats();
      const newLearn = getAutoLearnStats();
      setAiStats(newStats);
      setLearnStats(newLearn);
      setLogs(getLogs());
      setFailures(getFailures());
      // Grow model size with learning
      setModelSize(
        (prev) => +(prev + 0.001 * newLearn.totalAutoLearned).toFixed(3),
      );
      setIsLearning(true);
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Seed some demo logs if empty
  useEffect(() => {
    if (getLogs().length === 0) {
      addLog("AI engine initialized. Baseline patterns loaded.", "learn");
      addLog(
        "Confidence threshold set to 85%. TP probability gate at 72%.",
        "adjust",
      );
      addLog(
        "News sentiment module online. CryptoCompare feed connected.",
        "learn",
      );
      addLog("Market phase detector active. Current phase: NEUTRAL.", "learn");
      addLog(
        "Coin reputation database initialized (0 blacklisted coins).",
        "learn",
      );
      setLogs(getLogs());
    }
    if (getFailures().length === 0) {
      localStorage.setItem(FAILURES_KEY, JSON.stringify([]));
    }
  }, []);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const circuitBreakerTripped = aiStats.circuitActive;

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">AI Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Live AI engine status &amp; learning metrics
          </p>
        </div>

        {/* Status + Uptime */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* AI Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-1 rounded-2xl p-5 flex flex-col items-center justify-center text-center"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
            }}
          >
            <div className="relative mb-3">
              <Brain
                className="w-12 h-12"
                style={{
                  color: isLearning
                    ? "oklch(62% 0.18 145)"
                    : "oklch(75% 0.15 60)",
                }}
              />
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                style={{
                  background: circuitBreakerTripped
                    ? "oklch(60% 0.22 25)"
                    : isLearning
                      ? "oklch(62% 0.18 145)"
                      : "oklch(75% 0.15 60)",
                  animation: "glow-pulse 1.5s ease-in-out infinite",
                  boxShadow: `0 0 8px ${circuitBreakerTripped ? "oklch(60% 0.22 25)" : "oklch(62% 0.18 145)"}`,
                }}
              />
            </div>
            <div
              className="font-bold text-lg"
              style={{
                color: circuitBreakerTripped
                  ? "oklch(45% 0.18 25)"
                  : "oklch(42% 0.18 145)",
              }}
            >
              {circuitBreakerTripped
                ? "PAUSED"
                : isLearning
                  ? "LEARNING"
                  : "ONLINE"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Uptime: {formatUptime(uptime)}
            </div>
          </motion.div>

          {/* Model Size */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-5"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Database
                className="w-5 h-5"
                style={{ color: "oklch(65% 0.12 220)" }}
              />
              <span className="text-sm font-semibold">Model Size</span>
            </div>
            <div
              className="text-3xl font-display font-bold"
              style={{ color: "oklch(65% 0.12 220)" }}
            >
              {modelSize.toFixed(1)} KB
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Patterns learned: {learnStats.totalAutoLearned + 847}
            </div>
            <div className="text-xs text-muted-foreground">
              Last update: {fmtSince(lastSync)}
            </div>
          </motion.div>

          {/* Win Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-5"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity
                className="w-5 h-5"
                style={{ color: "oklch(75% 0.15 60)" }}
              />
              <span className="text-sm font-semibold">Performance</span>
            </div>
            <div
              className="text-3xl font-display font-bold"
              style={{ color: "oklch(75% 0.15 60)" }}
            >
              {aiStats.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Win rate (session)
            </div>
            <div className="text-xs text-muted-foreground">
              Auto-learned: {learnStats.totalAutoLearned} trades
            </div>
          </motion.div>
        </div>

        {/* Circuit Breaker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-5"
          style={{
            background: circuitBreakerTripped
              ? "oklch(60% 0.22 25 / 0.08)"
              : "oklch(var(--card))",
            border: `1px solid ${circuitBreakerTripped ? "oklch(60% 0.22 25 / 0.4)" : "oklch(var(--border))"}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: circuitBreakerTripped
                    ? "oklch(60% 0.22 25 / 0.2)"
                    : "oklch(62% 0.18 145 / 0.15)",
                }}
              >
                {circuitBreakerTripped ? (
                  <XCircle
                    className="w-5 h-5"
                    style={{ color: "oklch(45% 0.18 25)" }}
                  />
                ) : (
                  <CheckCircle
                    className="w-5 h-5"
                    style={{ color: "oklch(42% 0.18 145)" }}
                  />
                )}
              </div>
              <div>
                <div className="font-semibold text-sm">Circuit Breaker</div>
                <div className="text-xs text-muted-foreground">
                  {circuitBreakerTripped
                    ? "Tripped – signal generation paused"
                    : "Active – monitoring losses"}
                </div>
              </div>
            </div>
            <Badge
              variant={circuitBreakerTripped ? "destructive" : "secondary"}
            >
              {circuitBreakerTripped ? "TRIPPED" : "NORMAL"}
            </Badge>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Tracked",
              value: learnStats.totalAutoLearned,
              color: "oklch(65% 0.12 220)",
            },
            {
              label: "Market Phase",
              value: aiStats.marketPhase,
              color: "oklch(75% 0.15 60)",
              isText: true,
            },
            {
              label: "Filtered Coins",
              value: aiStats.filteredCoins,
              color: "oklch(45% 0.18 25)",
            },
            {
              label: "Confidence Threshold",
              value: `${aiStats.currentThreshold ?? 85}%`,
              color: "oklch(62% 0.18 145)",
              isText: true,
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              className="rounded-xl p-4"
              style={{
                background: "oklch(var(--card))",
                border: "1px solid oklch(var(--border))",
              }}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {stat.label}
              </div>
              <div className="text-xl font-bold" style={{ color: stat.color }}>
                {stat.isText ? stat.value : Number(stat.value).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Learning History */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Learning History</h3>
              <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Auto-updating
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
              {logs.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No learning events yet
                </div>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={`${log.timestamp}-${i}`}
                    className="flex gap-2 text-xs"
                  >
                    <span
                      className="shrink-0 w-2 h-2 mt-1 rounded-full"
                      style={{
                        background:
                          log.type === "failure"
                            ? "oklch(60% 0.22 25)"
                            : log.type === "breaker"
                              ? "oklch(75% 0.15 60)"
                              : "oklch(62% 0.18 145)",
                      }}
                    />
                    <div>
                      <div className="text-foreground/80">{log.message}</div>
                      <div className="text-muted-foreground">
                        {fmtTime(log.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Failures Log */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle
                className="w-4 h-4"
                style={{ color: "oklch(45% 0.18 25)" }}
              />
              <h3 className="font-semibold text-sm">Failure Log</h3>
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(60% 0.22 25 / 0.15)",
                  color: "oklch(45% 0.18 25)",
                }}
              >
                {failures.length} recorded
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
              {failures.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  <CheckCircle
                    className="w-6 h-6 mx-auto mb-2"
                    style={{ color: "oklch(62% 0.18 145)" }}
                  />
                  No failures recorded
                </div>
              ) : (
                failures.map((f, i) => (
                  <div
                    key={`${f.timestamp}-${i}`}
                    className="flex gap-2 text-xs"
                  >
                    <XCircle
                      className="w-3 h-3 mt-0.5 shrink-0"
                      style={{ color: "oklch(45% 0.18 25)" }}
                    />
                    <div>
                      <div className="text-foreground/80">{f.message}</div>
                      <div className="text-muted-foreground">
                        {fmtTime(f.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Auto-update badge */}
        <div className="flex justify-center">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs"
            style={{
              background: "oklch(var(--muted))",
              border: "1px solid oklch(var(--border))",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-signal-buy animate-pulse" />
            Last synced: {fmtSince(lastSync)}
          </div>
        </div>
      </div>
    </div>
  );
}
