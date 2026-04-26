export default function MetaGrid({ items, className = 'grid gap-4 md:grid-cols-2' }) {
  const rows = Array.isArray(items) ? items.filter(Boolean) : [];
  return (
    <div className={className}>
      {rows.map((item) => (
        <div key={item.key} className={item.spanClassName || ''}>
          {item.label ? (
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{item.label}</p>
          ) : null}
          <div className={item.valueClassName || 'mt-1 text-base font-semibold text-slate-900 dark:text-slate-100'}>{item.content}</div>
        </div>
      ))}
    </div>
  );
}