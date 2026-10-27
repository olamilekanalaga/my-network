"use client";
import {
  Building2,
  BriefcaseBusiness,
  Pencil,
  Plus,
  ArrowUpRight,
  Globe,
  Github,
  Linkedin,
  Instagram,
} from "lucide-react";
import type { SelfProfile } from "@/lib/self-profile";
import { Avatar } from "./ui";
function socialLink(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "linkedin.com" || host.endsWith(".linkedin.com"))
      return { label: "LinkedIn", icon: Linkedin };
    if (host === "github.com") return { label: "GitHub", icon: Github };
    if (host === "instagram.com")
      return { label: "Instagram", icon: Instagram };
    if (["x.com", "twitter.com"].includes(host))
      return { label: "X", icon: ArrowUpRight };
    return { label: host, icon: Globe };
  } catch {
    return { label: "Website", icon: Globe };
  }
}
export default function SelfProfileCard({
  profile,
  onEdit,
}: {
  profile: SelfProfile;
  onEdit?: () => void;
}) {
  const company = profile.workCompany || profile.companyName;
  const position =
    profile.headline ||
    profile.roleDescription ||
    (profile.role !== "Other" ? profile.role : "");
  return (
    <section className="identity-card" aria-label="Your profile">
      <div className="identity-cover" aria-hidden="true">
        <span className="cover-orbit orbit-one" />
        <span className="cover-orbit orbit-two" />
        <span className="cover-symbol">✳</span>
      </div>
      <div className="identity-body">
        <div className="identity-toolbar">
          <Avatar
            name={profile.displayName || profile.name}
            photo={profile.photo}
            size="large"
          />
          {onEdit && (
            <button
              className="secondary identity-edit"
              onClick={onEdit}
              aria-label="Edit my profile"
            >
              <Pencil size={15} />
              Edit
            </button>
          )}
        </div>
        <h1 className="identity-name">{profile.displayName || profile.name}</h1>
        <div className="identity-work">
          <div className="identity-detail">
            <span className="identity-icon">
              <Building2 size={20} />
            </span>
            <div>
              <small>Company</small>
              {company ? (
                <strong>{company}</strong>
              ) : (
                <button className="text-link" onClick={onEdit}>
                  Add your company
                  <Plus size={13} />
                </button>
              )}
            </div>
          </div>
          <div className="identity-detail">
            <span className="identity-icon role-icon">
              <BriefcaseBusiness size={20} />
            </span>
            <div>
              <small>Position / role</small>
              {position ? (
                <strong>{position}</strong>
              ) : (
                <button className="text-link" onClick={onEdit}>
                  Add your role
                  <Plus size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="identity-socials">
          <div className="socials-label">
            Socials<span>Optional</span>
          </div>
          <div className="social-buttons">
            {profile.links.map((url, index) => {
              const { label, icon: Icon } = socialLink(url);
              return (
                <a
                  key={`${url}-${index}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-button"
                  aria-label={`Open ${label}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  <ArrowUpRight size={12} />
                </a>
              );
            })}
            {onEdit && (
              <button className="social-button add-social" onClick={onEdit}>
                <Plus size={17} />
                {profile.links.length ? "Add link" : "Add socials"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
