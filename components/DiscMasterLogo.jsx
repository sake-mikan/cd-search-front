export default function DiscMasterLogo({ compact = false, iconOnly = false, animate = true }) {
  const iconSizeClass = compact ? 'h-12 w-12' : 'h-14 w-14';
  const wordmarkClass = compact ? 'text-[1.78rem]' : 'text-[2.18rem]';
  const straplineClass = compact ? 'text-[10px]' : 'text-[11px]';

  const logoIcon = (
    <span
      className={`relative inline-flex ${iconSizeClass} shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] bg-[linear-gradient(155deg,rgba(14,165,233,0.6),rgba(255,255,255,0.8)_26%,rgba(186,230,253,0.8)_56%,rgba(14,165,233,0.5)_100%)] p-[1px] shadow-[0_8px_25px_-8px_rgba(14,165,233,0.4)] dark:bg-[linear-gradient(155deg,rgba(56,189,248,0.3),rgba(148,163,184,0.1)_26%,rgba(14,165,233,0.2)_54%,rgba(2,6,23,0.95)_100%)] dark:shadow-[0_20px_50px_-20px_rgba(14,165,233,0.6)]`}
      aria-hidden="true"
    >
      <span className="absolute inset-[1px] rounded-[1.28rem] bg-[linear-gradient(145deg,rgba(255,255,255,1),rgba(224,242,254,0.9)_30%,rgba(186,230,253,0.7)_90%)] dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(14,165,233,0.15)_30%,rgba(2,6,23,0.98)_90%)]" />
      <span className="absolute inset-[1px] rounded-[1.28rem] ring-1 ring-sky-200/50 dark:ring-sky-400/20" />
      
      {/* ネオンの光の反射 */}
      <span className="pointer-events-none absolute inset-[1px] rounded-[1.28rem] bg-[radial-gradient(circle_at_30%_30%,rgba(14,165,233,0.15),transparent_50%)]" />

      <svg
        viewBox="0 0 64 64"
        className={`relative z-10 h-[72%] w-[72%] transition-all duration-700 ${animate ? 'animate-[pulse_3s_ease-in-out_infinite]' : ''}`}
        fill="none"
      >
        {/* DB Symbol (Neon Cyan) */}
        <g className="opacity-95">
          <ellipse cx="43" cy="18" rx="10" ry="4" className="fill-sky-500/80 dark:fill-sky-400/80 stroke-slate-900 dark:stroke-white" strokeWidth="1.2" />
          <path d="M33 18v5.5c0 2.2 4.5 4 10 4s10-1.8 10-4V18" className="stroke-sky-600 dark:stroke-sky-400/90" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M33 23.5v5.5c0 2.2 4.5 4 10 4s10-1.8 10-4v-5.5" className="stroke-slate-900 dark:stroke-white" strokeWidth="1.2" strokeLinejoin="round" />
        </g>

        {/* Disc Symbol (Neon White/Blue) */}
        <g className="opacity-100">
          <circle cx="22" cy="40" r="13" className="stroke-slate-900 dark:stroke-white drop-shadow-[0_0_2px_rgba(14,165,233,0.3)] dark:drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]" strokeWidth="3" />
          <circle cx="22" cy="40" r="6.5" className="stroke-sky-600 dark:stroke-sky-200/70" strokeWidth="1.5" />
          <circle cx="22" cy="40" r="2.5" className="fill-sky-600 dark:fill-white" />
        </g>

        {/* Cyber Connectors */}
        <path d="M32 29l6-6" className="stroke-sky-600 dark:stroke-sky-400/90" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M28 25l4-4" className="stroke-slate-900 dark:stroke-white" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M34 32l6-6" className="stroke-sky-400/50 dark:stroke-sky-400/50" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );

  if (iconOnly) {
    return logoIcon;
  }

  return (
    <div className="inline-flex items-center gap-3 sm:gap-4">
      {logoIcon}

      <span className="min-w-0 space-y-0.5">
        <span className={`hidden font-bold uppercase tracking-[0.25em] text-sky-600/70 dark:text-sky-400/50 sm:block ${straplineClass}`}>
          Accurate CD knowledge
        </span>
        <span className={`block font-black uppercase tracking-tight ${wordmarkClass}`}>
          <span className="text-slate-950 dark:text-white">DISC</span>
          <span className="bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-500 bg-clip-text text-transparent dark:from-sky-300 dark:via-cyan-300 dark:to-blue-400 drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]">
            MASTER
          </span>
        </span>
      </span>
    </div>
  );
}
