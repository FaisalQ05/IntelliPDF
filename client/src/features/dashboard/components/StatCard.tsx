import React from "react";

export function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  gradient: string;
  delay: string;
}) {
  return (
    <div
      className={`ipdf-animate-slide-up ipdf-card-hover ${delay} relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-zinc-300`}
    >
      <div
        className={`pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full opacity-10 blur-xl ${gradient}`}
      />
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${gradient} shadow-sm`}
        >
          <Icon className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[22px] font-bold tracking-tight text-zinc-900">
            {value}
          </p>
          <p className="text-[12px] font-medium text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
