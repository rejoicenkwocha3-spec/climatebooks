"use client";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
const COLORS = ["#174D36", "#D9AD55", "#8BAF91", "#0B352B", "#5E8F6E", "#B88A2C", "#A9C7AE", "#3B6B52"];
const fmt = (v: any) => `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO2e`;

export function BarCard({ data, xKey = "name", yKey = "value", horizontal = false }: { data: any[]; xKey?: string; yKey?: string; horizontal?: boolean }) {
  return (
    <div className="h-64 w-full"><ResponsiveContainer>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: horizontal ? 40 : 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#174D3615" />
        {horizontal ? (<><XAxis type="number" fontSize={11} /><YAxis type="category" dataKey={xKey} fontSize={11} width={110} /></>) : (<><XAxis dataKey={xKey} fontSize={11} /><YAxis fontSize={11} /></>)}
        <Tooltip formatter={fmt} /><Bar dataKey={yKey} fill="#174D36" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer></div>
  );
}
export function PieCard({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-64 w-full"><ResponsiveContainer>
      <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
        <Tooltip formatter={fmt} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart>
    </ResponsiveContainer></div>
  );
}
export function TargetChart({ data, target }: { data: { year: number; actual?: number; pathway?: number }[]; target?: number }) {
  return (
    <div className="h-64 w-full"><ResponsiveContainer>
      <LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#174D3615" />
        <XAxis dataKey="year" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={fmt} /><Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="actual" name="Recorded" stroke="#174D36" strokeWidth={2.5} connectNulls dot />
        <Line type="monotone" dataKey="pathway" name="Target pathway" stroke="#D9AD55" strokeWidth={2} strokeDasharray="5 4" dot={false} />
        {target !== undefined && <ReferenceLine y={target} stroke="#D9AD55" strokeDasharray="2 2" />}
      </LineChart>
    </ResponsiveContainer></div>
  );
}
