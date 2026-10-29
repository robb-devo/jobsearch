import { useEffect, useRef, useState, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, X, type LucideIcon } from 'lucide-react';
import { STATUS_LABEL, STATUS_ORDER } from '../lib/content';
import type { Status } from '../lib/types';
import { cls } from '../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonStyleProps {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
}

const iconSize = (size: Size) => (size === 'sm' ? 14 : 16);

export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  loading,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps & { loading?: boolean }) {
  return (
    <button
      type={type}
      className={cls('btn', `btn-${variant}`, `btn-${size}`, !children && 'btn-icon', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="spinner" aria-hidden /> : Icon && <Icon size={iconSize(size)} aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  children,
  className,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & ButtonStyleProps) {
  return (
    <a
      className={cls('btn', `btn-${variant}`, `btn-${size}`, !children && 'btn-icon', className)}
      target="_blank"
      rel="noreferrer"
      {...rest}
    >
      {Icon && <Icon size={iconSize(size)} aria-hidden />}
      {children}
    </a>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cls('card', className)}>
      {(title || actions) && (
        <header className="card-header">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {description && <p className="card-desc">{description}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, full, children }: { label: string; hint?: ReactNode; full?: boolean; children: ReactNode }) {
  return (
    <label className={cls('field', full && 'span-2')}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Progress({ value, max = 100, tone }: { value: number; max?: number; tone?: 'success' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cls('progress', tone && `progress-${tone}`)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm';
}) {
  return (
    <div className={cls('segmented', size)} role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} className={cls(o.value === value && 'active')} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function MatchBadge({ score }: { score: number }) {
  const level = score >= 70 ? 'high' : score >= 45 ? 'mid' : 'low';
  return (
    <span className={cls('match', `match-${level}`)} title="Übereinstimmung mit deinem Profil">
      {score} % Match
    </span>
  );
}

export function StatusSelect({ value, onChange, className }: { value: Status; onChange: (s: Status) => void; className?: string }) {
  return (
    <select
      className={cls('status-select', className)}
      style={{ '--c': `var(--st-${value})` } as CSSProperties}
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      onClick={(e) => e.stopPropagation()}
      aria-label="Status"
    >
      {STATUS_ORDER.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

export function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const add = (raw: string) => {
    const next = [...value];
    for (const part of raw.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)) {
      if (!next.some((v) => v.toLowerCase() === part.toLowerCase())) next.push(part);
    }
    if (next.length !== value.length) onChange(next);
    setDraft('');
  };

  return (
    <div className="tags-input" onClick={() => input.current?.focus()}>
      {value.map((tag) => (
        <span key={tag} className="tag">
          {tag}
          <button type="button" aria-label={`${tag} entfernen`} onClick={() => onChange(value.filter((v) => v !== tag))}>
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        ref={input}
        value={draft}
        placeholder={value.length ? '' : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft.trim() && add(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
      />
    </div>
  );
}

export function Dialog({
  title,
  description,
  onClose,
  children,
  footer,
  variant = 'drawer',
  wide,
}: {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'drawer' | 'modal';
  wide?: boolean;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <div className={cls('overlay', variant === 'modal' && 'overlay-center')} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cls(variant, wide && `${variant}-wide`)} role="dialog" aria-modal="true" aria-label={title}>
        <header className="dialog-header">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <Button variant="ghost" icon={X} onClick={onClose} aria-label="Schließen" />
        </header>
        <div className="dialog-body">{children}</div>
        {footer && <footer className="dialog-footer">{footer}</footer>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={22} />
      </span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

type ToastTone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
}

let pushToast: ((t: ToastItem) => void) | null = null;
let toastId = 0;

export function toast(text: string, tone: ToastTone = 'success') {
  pushToast?.({ id: ++toastId, text, tone });
}

const TOAST_ICONS: Record<ToastTone, LucideIcon> = { success: CircleCheck, error: CircleAlert, info: Info };

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    pushToast = (t) => {
      setItems((list) => [...list.slice(-2), t]);
      setTimeout(() => setItems((list) => list.filter((x) => x.id !== t.id)), t.tone === 'error' ? 6000 : 3500);
    };
    return () => {
      pushToast = null;
    };
  }, []);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => {
        const Icon = TOAST_ICONS[t.tone];
        return (
          <div key={t.id} className={cls('toast', `toast-${t.tone}`)}>
            <Icon size={17} />
            {t.text}
          </div>
        );
      })}
    </div>
  );
}
