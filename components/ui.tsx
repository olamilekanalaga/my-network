"use client";
import { X, Check, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Avatar({ name, size = "" }: { name: string; size?: string }) {
  return (
    <span
      className={`avatar ${size}`}
      style={{
        background: ["#e5ecff", "#e9e5f8", "#e6f1ec", "#f6eadf"][
          name.length % 4
        ],
      }}
    >
      {name
        .split(" ")
        .slice(0, 2)
        .map((x) => x[0])
        .join("")}
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="overlay" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button className="icon" aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function SafeLink({ url }: { url: string }) {
  let safe = false;
  try {
    safe = ["http:", "https:"].includes(new URL(url).protocol);
  } catch {}
  return safe ? (
    <a
      className="text-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {url.replace(/^https?:\/\//, "")} <ArrowUpRight size={13} />
    </a>
  ) : (
    <span>{url}</span>
  );
}
export function Multi({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button
          type="button"
          key={o}
          className={`chip ${value.includes(o) ? "selected" : ""}`}
          onClick={() =>
            onChange(
              value.includes(o) ? value.filter((x) => x !== o) : [...value, o],
            )
          }
        >
          {value.includes(o) && <Check size={12} />} {o}
        </button>
      ))}
    </div>
  );
}
