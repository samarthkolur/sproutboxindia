import { StatCard } from "@/components/shared/StatCard";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { GrowerDashboardClient } from "./client";
import { auth } from "@/lib/auth";
import { getGrowerDashboard } from "@/actions/dashboard.actions";
import {
  Sprout,
  ClipboardCheck,
  Wallet,
  Star,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
} from "lucide-react";
import {
  CROP_DISPLAY_NAMES,
  type CropType,
} from "@/lib/constants";

export default async function GrowerDashboard() {
  const session = await auth();
  const userId = session?.user?.id || "";
  const data = await getGrowerDashboard(userId);

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  // Build activity from tasks
  const activities = data.tasks.slice(0, 4).map((t) => ({
    text: `${CROP_DISPLAY_NAMES[t.cropType as CropType] || t.cropType} — Day ${t.currentDay} of ${t.totalDays}`,
    time: t.status === "assigned" ? "Awaiting start" : "In progress",
    type: t.status === "assigned" ? "info" : "success",
  }));

  // Weekly earnings chart data
  const earningsData =
    data.weeklyEarnings.length > 0
      ? data.weeklyEarnings.map((e) => ({
          label: e.label,
          value: e.amount,
          tooltip: `₹${e.amount}`,
        }))
      : [320, 450, 380, 500, 420, 550, 500].map((v, i) => ({
          label: `W${i + 8}`,
          value: v,
          tooltip: `₹${v}`,
        }));

  const totalEarnings = earningsData.reduce((s, d) => s + d.value, 0);

  return (
    <GrowerDashboardClient>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          {greeting}
        </h1>
        <p className="text-text-secondary mt-1">
          Here&apos;s your growing overview for today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Trays"
          value={data.activeTrays}
          change="+2 this week"
          icon={<Sprout className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
        <StatCard
          label="Tasks Due"
          value={data.tasksDue}
          change={data.tasksDue > 0 ? `${data.tasksDue} pending` : "All clear"}
          changeType={data.tasksDue > 0 ? "negative" : "positive"}
          icon={<ClipboardCheck className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
        <StatCard
          label="Earnings"
          value={`₹${data.totalEarnings.toLocaleString("en-IN")}`}
          change="+18%"
          icon={<Wallet className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
        <StatCard
          label="QC Score"
          value={`${data.qcScore}%`}
          change={data.qcScore >= 90 ? "Excellent" : "Needs improvement"}
          changeType={data.qcScore >= 90 ? "positive" : "negative"}
          icon={<Star className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Tasks — 2 cols */}
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary">Active Tasks</h2>
              <span className="text-xs font-semibold text-sprout-600 bg-sprout-100 px-3 py-1 rounded-full">
                {data.tasks.length} tasks
              </span>
            </div>

            {data.tasks.length > 0 ? (
              <div className="space-y-3">
                {data.tasks.map((task) => {
                  const progress = task.totalDays > 0
                    ? Math.round((task.currentDay / task.totalDays) * 100)
                    : 0;
                  const cropName = CROP_DISPLAY_NAMES[task.cropType as CropType] || task.cropType;

                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 bg-white/50 rounded-xl p-4 border border-white/40 row-hover cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-text-primary group-hover:text-sprout-800 transition-colors">
                            {cropName}
                          </h3>
                          <StatusBadge
                            status={
                              task.status === "in-progress"
                                ? "growing"
                                : task.status === "assigned"
                                  ? "sowing"
                                  : task.status === "harvest-ready"
                                    ? "ready"
                                    : "active"
                            }
                          />
                        </div>
                        <p className="text-xs text-text-muted">
                          {task.trayCount} trays · Day {task.currentDay} of {task.totalDays}
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="w-32 flex-shrink-0">
                        <div className="w-full bg-sprout-100 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-sprout-600 to-sprout-500 h-1.5 rounded-full progress-bar-animate"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-text-muted mt-1 text-right">
                          {progress}%
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 group-hover:text-sprout-800 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <ClipboardCheck className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-text-muted">No active tasks</p>
                <p className="text-xs text-text-muted mt-1">
                  New tasks will appear here when assigned
                </p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Activity Feed — 1 col */}
        <div>
          <GlassCard>
            <h2 className="text-lg font-bold text-text-primary mb-5">Recent Activity</h2>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((item, i) => {
                  const ActivityIcon =
                    item.type === "success"
                      ? CheckCircle2
                      : item.type === "warning"
                        ? AlertTriangle
                        : Info;
                  const iconColor =
                    item.type === "success"
                      ? "text-sprout-500"
                      : item.type === "warning"
                        ? "text-amber-500"
                        : "text-blue-500";

                  return (
                    <div key={i} className="flex items-start gap-3">
                      <ActivityIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                      <div>
                        <p className="text-sm text-text-primary leading-snug">
                          {item.text}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-text-muted" />
                          <p className="text-[11px] text-text-muted">{item.time}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <Clock className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-text-muted">No recent activity</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Earnings overview row */}
      <div className="mt-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-primary">Weekly Earnings</h2>
            <span className="text-xs text-text-muted">
              Last {earningsData.length} periods
            </span>
          </div>
          <div className="flex items-end gap-3 h-32">
            {earningsData.map((item, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <div className="bg-text-primary text-white text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                    {item.tooltip}
                  </div>
                </div>
                <div
                  className="w-full bg-gradient-to-t from-sprout-600 to-sprout-400 rounded-lg transition-all hover:opacity-80 hover:shadow-lg hover:shadow-sprout-500/20"
                  style={{
                    height: `${(item.value / Math.max(...earningsData.map((d) => d.value), 1)) * 100}%`,
                  }}
                />
                <p className="text-[10px] text-text-muted mt-1.5 font-medium">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/30">
            <span className="text-sm text-text-muted">Total earned</span>
            <span className="text-lg font-black text-sprout-800">
              ₹{totalEarnings.toLocaleString("en-IN")}
            </span>
          </div>
        </GlassCard>
      </div>
    </GrowerDashboardClient>
  );
}
