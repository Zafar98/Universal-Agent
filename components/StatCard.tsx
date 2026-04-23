import React from "react";

interface StatCardProps {
  value: string;
  label: string;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label }) => (
  <div className="rounded-2xl border border-slate-400/20 bg-slate-900/80 p-4 backdrop-blur-sm">
    <div className="text-3xl font-extrabold text-sky-100 tracking-tight mb-1">{value}</div>
    <div className="text-xs text-slate-400 font-sans">{label}</div>
  </div>
);
