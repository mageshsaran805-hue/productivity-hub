"use client";

import { PageTransition } from "@/components/animations/page-transition";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useAnalyticsData } from "@/lib/queries";
import { BarChart3, Loader2, CheckSquare, Target, Flame } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <GlassPanel className="p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </GlassPanel>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalyticsData();

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        <h2 className="text-2xl font-bold">Analytics</h2>

        {isLoading ? (
          <GlassPanel className="p-6 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </GlassPanel>
        ) : !data || data.totalTasks === 0 ? (
          <GlassPanel className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-secondary-500 p-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No data yet</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Analytics will appear here as you use the app. Start by creating
                tasks, logging habits, and tracking your productivity.
              </p>
            </div>
          </GlassPanel>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<CheckSquare className="w-5 h-5 text-white" />} label="Tasks completed" value={data.completedTasks} color="bg-success-500" />
              <StatCard icon={<Target className="w-5 h-5 text-white" />} label="Completion rate" value={`${data.completionRate}%`} color="bg-primary-500" />
              <StatCard icon={<BarChart3 className="w-5 h-5 text-white" />} label="Total tasks" value={data.totalTasks} color="bg-secondary-500" />
              <StatCard icon={<Flame className="w-5 h-5 text-white" />} label="Total habits" value={data.totalHabits} color="bg-accent-500" />
            </div>

            {/* Weekly chart */}
            <GlassPanel className="p-6">
              <h3 className="text-sm font-semibold mb-4">This week</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 13 }}
                    labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                  />
                  <Bar dataKey="tasks" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Tasks" />
                  <Bar dataKey="habits" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Habits" />
                </BarChart>
              </ResponsiveContainer>
            </GlassPanel>

            {/* Monthly trend */}
            <GlassPanel className="p-6">
              <h3 className="text-sm font-semibold mb-4">Monthly trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 13 }}
                    labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                  />
                  <Line type="monotone" dataKey="tasks" stroke="#4F46E5" strokeWidth={2} dot={{ fill: "#4F46E5", r: 4 }} name="Tasks" />
                  <Line type="monotone" dataKey="habits" stroke="#06B6D4" strokeWidth={2} dot={{ fill: "#06B6D4", r: 4 }} name="Habits" />
                </LineChart>
              </ResponsiveContainer>
            </GlassPanel>
          </>
        )}
      </div>
    </PageTransition>
  );
}
