"use client";

import { PageTransition } from "@/components/animations/page-transition";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useAnalyticsData } from "@/lib/queries";
import { BarChart3, Loader2, CheckSquare, Target, Flame } from "lucide-react";
import dynamic from "next/dynamic";

const AnalyticsCharts = dynamic(() =>
  import("@/components/analytics/analytics-charts").then((m) => m.AnalyticsCharts),
  { loading: () => <div className="h-[240px] rounded-3xl bg-foreground/5 animate-pulse" /> }
);

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

            <AnalyticsCharts weeklyData={data.weeklyData} monthlyData={data.monthlyData} />
          </>
        )}
      </div>
    </PageTransition>
  );
}
