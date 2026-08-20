"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brl, formatMonthLabel } from "@/lib/money";

type Series = { month: string; income: number; expense: number; net: number };
type Slice = { name: string; color: string; amount: number };

function tooltipMoney({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-none">
      <div className="font-semibold mb-1">{label ? formatMonthLabel(label) : ""}</div>
      {payload.map((item) => (
        <div key={item.name}>
          {item.name}: {brl(item.value)}
        </div>
      ))}
    </div>
  );
}

export function CashflowChart({ data }: { data: Series[] }) {
  const chart = data.map((d) => ({
    ...d,
    Receitas: d.income / 100,
    Despesas: d.expense / 100,
  }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chart}>
          <CartesianGrid stroke="#eee6d8" vertical={false} />
          <XAxis dataKey="month" tickFormatter={(v) => formatMonthLabel(v).slice(0, 3)} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => brl(Math.round(Number(value) * 100))}
            labelFormatter={(label) => formatMonthLabel(String(label))}
          />
          <Area type="monotone" dataKey="Receitas" stroke="#2A9D6E" fill="#2A9D6E22" />
          <Area type="monotone" dataKey="Despesas" stroke="#C45C4A" fill="#C45C4A18" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({ data }: { data: Slice[] }) {
  if (!data.length) {
    return <p className="text-sm text-muted py-10 text-center">Sem despesas neste mês.</p>;
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => brl(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BudgetBars({
  data,
}: {
  data: { name: string; planned: number; actual: number }[];
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.map((d) => ({ ...d, Planejado: d.planned / 100, Realizado: d.actual / 100 }))}>
          <CartesianGrid stroke="#eee6d8" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => brl(Math.round(Number(value) * 100))} />
          <Bar dataKey="Planejado" fill="#C4A35A" radius={4} />
          <Bar dataKey="Realizado" fill="#12202B" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { tooltipMoney };
