"use client";

import { PageTransition } from "@/components/animations/page-transition";
import { Card } from "@/components/ui/card";
import { useAnalyticsData } from "@/lib/queries";
import { BarChart3, CheckSquare, Target, Flame, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";

const AnalyticsCharts = dynamic(() =>
  import("@/components/analytics/analytics-charts").then((m) => m.AnalyticsCharts),
  { loading: () => <div className="h-[220px] rounded-3xl bg-foreground/5 shimmer-sweep animate-pulse" /> }
);

function StatCard({ icon, label, value, gradient }: { icon: React.ReactNode; label: string; value: string | number; gradient: string }) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg shadow-black/20`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-display text-2xl font-bold leading-tight truncate">{value}</div>
        <div className="text-xs text-muted-foreground truncate">{label}</div>
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalyticsData();

  return (
    <PageTransition>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="font-display text-2xl font-bold">Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">Your productivity at a glance</p>
        </div>

        {isLoading ? (
          <Card className="p-6 flex justify-center">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Crunching the numbers…</span>
            </div>
          </Card>
        ) : !data || data.totalTasks === 0 ? (
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-white/10 p-4 shadow-inner">
                <TrendingUp className="h-10 w-10 text-primary-400" />
              </div>
              <h3 className="font-display mb-2 text-lg font-semibold">No data yet</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Analytics will appear here as you use the app. Start by creating
                tasks, logging habits, and tracking your productivity.
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<CheckSquare className="w-5 h-5 text-white" />} label="Tasks completed" value={data.completedTasks} gradient="from-success-500 to-emerald-600" />
              <StatCard icon={<Target className="w-5 h-5 text-white" />} label="Completion rate" value={`${data.completionRate}%`} gradient="from-primary-500 to-indigo-600" />
              <StatCard icon={<BarChart3 className="w-5 h-5 text-white" />} label="Total tasks" value={data.totalTasks} gradient="from-secondary-500 to-violet-600" />
              <StatCard icon={<Flame className="w-5 h-5 text-white" />} label="Total habits" value={data.totalHabits} gradient="from-accent-500 to-cyan-600" />
            </div>

            <AnalyticsCharts weeklyData={data.weeklyData} monthlyData={data.monthlyData} />
          </>
        )}
      </div>
    </PageTransition>
  );
}