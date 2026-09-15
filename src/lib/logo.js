export function Logo({ variant = "light" }) {
  const titleColor = variant === "dark" ? "text-white" : "text-navy-800";
  const subColor = variant === "dark" ? "text-teal-300" : "text-teal-600";
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 16l5-5 4 4 8-8" />
          <path d="M16 7h4v4" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className={`text-sm font-bold tracking-tight ${titleColor}`}>HORIZON</div>
        <div className={`text-[10px] font-semibold tracking-widest -mt-0.5 ${subColor}`}>LIDA GREEN</div>
      </div>
    </div>
  );
}
