"use client";
import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { themes, type ThemeId } from "@/lib/themes";
export default function ThemePicker({
  value,
  onChange,
}: {
  value: ThemeId;
  onChange: (theme: ThemeId) => Promise<void>;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="theme-picker" aria-label="App theme">
      <div className="theme-picker-heading">
        <Palette size={18} />
        <h2>Your look</h2>
      </div>
      <div className="theme-options">
        {themes.map((theme) => (
          <button
            key={theme.id}
            aria-pressed={value === theme.id}
            disabled={busy}
            onClick={async () => {
              setStatus("");
              setBusy(true);
              try {
                await onChange(theme.id);
              } catch {
                setStatus(
                  "Theme applied on this device. Account sync could not finish.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <span
              className="theme-preview"
              style={{ background: theme.colors[0] }}
            >
              <i style={{ background: theme.colors[2] }} />
              <b style={{ background: theme.colors[1] }} />
              {value === theme.id && (
                <span>
                  <Check size={13} />
                </span>
              )}
            </span>
            <span>{theme.name}</span>
          </button>
        ))}
      </div>
      {status && (
        <p className="small" role="status">
          {status}
        </p>
      )}
    </section>
  );
}
