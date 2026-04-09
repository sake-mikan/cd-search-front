import { panelClass } from '../utils/uiTheme';

export default function InfoCard({ title = '', description = '', children, className = '' }) {
  return (
    <section className={[panelClass, className].filter(Boolean).join(' ')}>
      {(title || description) && (
        <div className="mb-4 space-y-1">
          {title ? <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2> : null}
          {description ? <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p> : null}
        </div>
      )}
      {children}
    </section>
  );
}
