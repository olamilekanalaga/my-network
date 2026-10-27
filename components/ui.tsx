"use client";
import { X, Check, ArrowUpRight } from "lucide-react";
import {
  useState,
  useId,
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from "react";
import { safePhotoUrl } from "@/lib/profile-media";
export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Avatar({
  name,
  photo = "",
  size = "",
}: {
  name: string;
  photo?: string;
  size?: string;
}) {
  const [failed, setFailed] = useState("");
  const src = safePhotoUrl(photo);
  if (src && failed !== src)
    return (
      <img
        className={`avatar avatar-photo ${size}`}
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailed(src)}
      />
    );
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
  const labelId = useId();
  return (
    <label className="field">
      <span id={labelId}>{label}</span>
      {Children.map(children, (child) =>
        isValidElement(child) &&
        typeof child.type === "string" &&
        ["input", "textarea", "select"].includes(child.type)
          ? cloneElement(
              child as ReactElement<{ "aria-labelledby"?: string }>,
              { "aria-labelledby": labelId },
            )
          : child,
      )}
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
