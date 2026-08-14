"use client";

import { GlassPanel } from "@/components/ui/glass-panel";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";

export function AnalyticsCharts({
  weeklyData,
  monthlyData,
}: {
  weeklyData: { day: string; tasks: number; habits: number }[];
  monthlyData: { month: string; tasks: number; habits: number }[];
}) {
  return (
    <>
      {/* Weekly chart */}
      <GlassPanel className="p-6">
        <h3 className="text-sm font-semibold mb-4">This week</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
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
          <LineChart data={monthlyData}>
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
  );
}