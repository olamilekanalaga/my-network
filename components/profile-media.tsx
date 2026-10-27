"use client";
import { useState, useId } from "react";
import { Camera, X } from "lucide-react";
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
export function ProfileLinks({
  value,
  onChange,
}: {
  value: string[];
  onChange: (links: string[]) => void;
}) {
  const hintId = useId();
  return (
    <>
      <Field label="Website or social links (optional)">
        <textarea
          aria-describedby={hintId}
          rows={3}
          placeholder={"linkedin.com/in/your-name\nyour-website.com"}
          value={value.join("\n")}
          onChange={(e) => onChange(e.target.value.split("\n"))}
        />
      </Field>
      <p className="small muted" id={hintId}>
        One link per line. Add a portfolio, website, LinkedIn, or another
        profile—only if useful.
      </p>
    </>
  );
}
