"use client";

import { Card } from "@/components/ui/card";
import { useReducedMotion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";

const AXIS_TICK = { fontSize: 12, fill: "rgba(148, 163, 184, 0.7)" };
const GRID_STROKE = "rgba(148, 163, 184, 0.08)";
const TOOLTIP_STYLE: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.92)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 13,
  boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
};
const TOOLTIP_LABEL: React.CSSProperties = { color: "rgba(248, 250, 252, 0.7)" };

export function AnalyticsCharts({
  weeklyData,
  monthlyData,
}: {
  weeklyData: { day: string; tasks: number; habits: number }[];
  monthlyData: { month: string; tasks: number; habits: number }[];
}) {
  const reduceMotion = useReducedMotion();

  return (
    <>
      {/* Weekly chart */}
      <Card className="p-6">
        <h3 className="font-display text-sm font-semibold text-foreground mb-1">This week</h3>
        <p className="text-xs text-muted-foreground mb-4">Tasks completed vs habits logged</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL}
              cursor={{ fill: "rgba(148, 163, 184, 0.06)" }}
              isAnimationActive={!reduceMotion}
            />
            <Bar dataKey="tasks" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Tasks" maxBarSize={22} />
            <Bar dataKey="habits" fill="#06B6D4" radius={[6, 6, 0, 0]} name="Habits" maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Monthly trend */}
      <Card className="p-6">
        <h3 className="font-display text-sm font-semibold text-foreground mb-1">Monthly trend</h3>
        <p className="text-xs text-muted-foreground mb-4">Your productivity over time</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL}
              isAnimationActive={!reduceMotion}
            />
            <Line type="monotone" dataKey="tasks" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: "#4F46E5", r: 4, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Tasks" />
            <Line type="monotone" dataKey="habits" stroke="#06B6D4" strokeWidth={2.5} dot={{ fill: "#06B6D4", r: 4, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Habits" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
}