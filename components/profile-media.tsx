"use client";
import { useState } from "react";
import { Camera, X, ChevronDown, Plus } from "lucide-react";
import { Avatar, Field } from "./ui";
async function preparePhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    try {
      await img.decode();
    } catch {
      throw new Error(
        "This image could not be opened. Try another JPG or PNG.",
      );
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Photo editing is unavailable in this browser.");
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    if (!side) throw new Error("Choose a valid image.");
    for (const size of [192, 160, 128, 96]) {
      canvas.width = canvas.height = size;
      context.fillStyle = "#f6f5ed";
      context.fillRect(0, 0, size, size);
      context.drawImage(
        img,
        (img.naturalWidth - side) / 2,
        (img.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size,
      );
      for (const quality of [0.85, 0.65, 0.45]) {
        const encoded = canvas.toDataURL("image/jpeg", quality);
        if (encoded.length <= 18000) return encoded;
      }
    }
    throw new Error("Could not prepare this photo. Try a different image.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function PhotoPicker({
  name,
  value,
  onChange,
  onBusyChange,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="photo-picker">
      <Avatar name={name || "Your photo"} photo={value} size="large" />
      <div>
        <label className="secondary photo-upload">
          <Camera size={16} />
          {busy ? "Preparing photo…" : "Choose photo"}
          <input
            type="file"
            aria-label="Upload photo"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              onBusyChange?.(true);
              setError("");
              try {
                onChange(await preparePhoto(file));
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
                onBusyChange?.(false);
              }
            }}
          />
        </label>
        <small>Optional · JPG, PNG, or WebP</small>
        {value && (
          <button
            type="button"
            className="text-link"
            disabled={busy}
            onClick={() => {
              onChange("");
              setError("");
            }}
          >
            <X size={12} />
            Remove photo
          </button>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

const linkTypes = [
  { name: "Website", prefix: "https://" },
  { name: "LinkedIn", prefix: "https://linkedin.com/in/" },
  { name: "X", prefix: "https://x.com/" },
  { name: "Instagram", prefix: "https://instagram.com/" },
  { name: "GitHub", prefix: "https://github.com/" },
  { name: "Facebook", prefix: "https://facebook.com/" },
  { name: "TikTok", prefix: "https://tiktok.com/@" },
  { name: "YouTube", prefix: "https://youtube.com/@" },
  { name: "Other", prefix: "https://" },
];
function linkType(value: string) {
  try {
    const host = new URL(value.startsWith("http") ? value : `https://${value}`)
      .hostname;
    return (
      linkTypes.find(
        (t) =>
          t.name !== "Website" &&
          t.name !== "Other" &&
          new URL(t.prefix).hostname === host.replace(/^www\./, ""),
      )?.name || "Website"
    );
  } catch {
    return "Website";
  }
}
export function ProfileLinks({
  value,
  onChange,
}: {
  value: string[];
  onChange: (links: string[]) => void;
}) {
  const [types, setTypes] = useState<Record<number, string>>({});
  return (
    <details className="links-dropdown">
      <summary>
        Website or social links{" "}
        <span>
          Optional
          {value.filter((v) => v.trim()).length
            ? ` · ${value.filter((v) => v.trim()).length}`
            : ""}
        </span>
        <ChevronDown size={16} />
      </summary>
      <div className="links-editor">
        {value.map((url, index) => {
          const selected = types[index] || linkType(url);
          const config = linkTypes.find((t) => t.name === selected)!;
          function update(next: string) {
            onChange(value.map((v, i) => (i === index ? next : v)));
          }
          return (
            <div className="link-editor-row" key={index}>
              <Field label={`Link type ${index + 1}`}>
                <select
                  value={selected}
                  onChange={(e) =>
                    setTypes((t) => ({ ...t, [index]: e.target.value }))
                  }
                >
                  {linkTypes.map((type) => (
                    <option key={type.name}>{type.name}</option>
                  ))}
                </select>
              </Field>
              <Field label={`Link URL ${index + 1}`}>
                <input
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder={
                    config.prefix +
                    (selected === "Website" ? "your-website.com" : "your-name")
                  }
                  value={url}
                  onChange={(e) => update(e.target.value)}
                  onBlur={() => {
                    if (
                      url.trim() &&
                      !/[.:/]/.test(url) &&
                      !["Website", "Other"].includes(selected)
                    )
                      update(config.prefix + url.trim().replace(/^@/, ""));
                  }}
                />
              </Field>
              <button
                type="button"
                className="icon"
                aria-label={`Remove link ${index + 1}`}
                onClick={() => {
                  onChange(value.filter((_, i) => i !== index));
                  setTypes({});
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          className="secondary"
          disabled={value.length >= 10}
          onClick={() => onChange([...value, ""])}
        >
          <Plus size={15} />
          Add link
        </button>
      </div>
    </details>
  );
}
