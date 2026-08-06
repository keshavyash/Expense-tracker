"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { formatMoney } from "@/lib/format";

const INK_SOFT = "#5B6B69";
const LINE = "#DAD9D0";

export function CategoryBarChart({ data }: { data: { name: string; total: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-soft">No data yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid horizontal={false} stroke={LINE} />
        <XAxis type="number" tickFormatter={(v) => formatMoney(v)} stroke={INK_SOFT} fontSize={12} />
        <YAxis type="category" dataKey="name" width={110} stroke={INK_SOFT} fontSize={12} />
        <Tooltip // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter={(v: any) => formatMoney(Number(v ?? 0))} contentStyle={{ fontSize: 12, borderRadius: 4 }} />
        <Bar dataKey="total" fill="#2F6F5E" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const SPLIT_COLORS = ["#2F6F5E", "#B9852E", "#A8485B", "#4A6FA5"];

export function SplitPieChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) {
    return <p className="py-10 text-center text-sm text-ink-soft">No data yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={SPLIT_COLORS[i % SPLIT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter={(v: any) => formatMoney(Number(v ?? 0))} contentStyle={{ fontSize: 12, borderRadius: 4 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Enough visually distinct colors to cover a typical category list;
// cycles if there are more categories than colors.
const CATEGORY_COLORS = [
  "#2F6F5E",
  "#B9852E",
  "#A8485B",
  "#4A6FA5",
  "#7A5C61",
  "#8A9A5B",
  "#6B5B95",
  "#C97B63",
  "#3E7C8C",
  "#9C6644",
];

export function MonthlyTrendChart({
  data,
  categories,
}: {
  data: Record<string, string | number>[];
  categories: string[];
}) {
  if (data.length === 0 || categories.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-soft">No data yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 0, right: 8 }}>
        <CartesianGrid vertical={false} stroke={LINE} />
        <XAxis dataKey="month" stroke={INK_SOFT} fontSize={12} />
        <YAxis tickFormatter={(v) => formatMoney(v)} stroke={INK_SOFT} fontSize={12} width={70} />
        <Tooltip // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter={(v: any) => formatMoney(Number(v ?? 0))} contentStyle={{ fontSize: 12, borderRadius: 4 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {categories.map((cat, i) => (
          <Bar
            key={cat}
            dataKey={cat}
            stackId="months"
            fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
            radius={i === categories.length - 1 ? [3, 3, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
