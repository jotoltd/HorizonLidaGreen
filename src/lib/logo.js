export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 16l5-5 4 4 8-8" />
          <path d="M16 7h4v4" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold text-navy-800 tracking-tight">HORIZON</div>
        <div className="text-[10px] font-semibold text-teal-600 tracking-widest -mt-0.5">LIDA GREEN</div>
      </div>
    </div>
  );
}
