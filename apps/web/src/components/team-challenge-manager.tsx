"use client";

import { useState } from "react";
import { Copy, LockKeyhole, RefreshCw, Users } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type ManagedTeam = { id: string; slug: string; name: string; description: string; isPublic: boolean; isOwner: boolean; role: "owner" | "member"; memberCount: number };

export function TeamChallengeManager({ team, initialInvite = "", locale, teamPath, dashboardPath }: { team: ManagedTeam | null; initialInvite?: string; locale: Locale; teamPath: string; dashboardPath: string }) {
  const [message, setMessage] = useState("");
  const [inviteCode, setInviteCode] = useState(initialInvite);
  const [createdSlug, setCreatedSlug] = useState("");
  const [settings, setSettings] = useState(team ? { name: team.name, description: team.description, isPublic: team.isPublic } : null);

  async function createTeam(formData: FormData) {
    setMessage(t(locale, "Creating team…"));
    const response = await fetch("/api/teams", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: formData.get("name"), slug: formData.get("slug"), description: formData.get("description"), isPublic: formData.get("isPublic") === "on" }) });
    const data = await response.json() as { error?: string; inviteCode?: string; team?: { slug: string } };
    if (!response.ok) return setMessage(data.error || t(locale, "Could not create team."));
    setInviteCode(data.inviteCode || "");
    setCreatedSlug(data.team?.slug || "");
    setMessage(t(locale, "Team created. Save the invite code now or rotate it later."));
    if (data.team?.slug) window.history.replaceState(null, "", `${dashboardPath}?created=${data.team.slug}`);
  }

  async function joinTeam(formData: FormData) {
    setMessage(t(locale, "Joining team…"));
    const response = await fetch("/api/teams/join", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ inviteCode: formData.get("inviteCode") }) });
    const data = await response.json() as { error?: string; team?: { slug: string } };
    if (!response.ok) return setMessage(data.error || t(locale, "Could not join team."));
    window.location.assign(data.team?.slug ? teamPath.replace("__slug__", data.team.slug) : dashboardPath);
  }

  async function saveSettings() {
    if (!team || !settings) return;
    setMessage(t(locale, "Saving…"));
    const response = await fetch(`/api/teams/${team.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) });
    const data = await response.json().catch(() => ({})) as { error?: string };
    setMessage(response.ok ? t(locale, "Team settings saved.") : data.error || t(locale, "Could not save."));
  }

  async function rotateInvite() {
    if (!team) return;
    setMessage(t(locale, "Generating a new invite…"));
    const response = await fetch(`/api/teams/${team.id}/invite`, { method: "POST" });
    const data = await response.json().catch(() => ({})) as { error?: string; inviteCode?: string };
    if (!response.ok) return setMessage(data.error || t(locale, "Could not generate invite."));
    setInviteCode(data.inviteCode || "");
    setMessage(t(locale, "Previous invite codes no longer work."));
  }

  async function leaveTeam() {
    if (!team || !window.confirm(t(locale, "Leave this team challenge?"))) return;
    const response = await fetch(`/api/teams/${team.id}/members/me`, { method: "DELETE" });
    const data = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) return setMessage(data.error || t(locale, "Could not leave team."));
    window.location.assign(dashboardPath);
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteCode);
    setMessage(t(locale, "Invite code copied."));
  }

  if (!team) return <div className="team-manager-grid">
    <form action={createTeam} className="panel team-manager-card"><span className="team-manager-icon"><Users size={20} /></span><h2>{t(locale, "Start a team challenge")}</h2><p>{t(locale, "You become the owner. Usage starts counting for each member on the day they join.")}</p><label>{t(locale, "Team name")}<input className="text-input" maxLength={48} minLength={2} name="name" required /></label><label>{t(locale, "Team URL")}<input className="text-input" maxLength={32} minLength={3} name="slug" pattern="[a-z0-9][a-z0-9-]*[a-z0-9]" placeholder="agent-builders" required /></label><label>{t(locale, "Description")}<textarea className="text-input" maxLength={160} name="description" rows={3} /></label><label className="team-privacy-toggle"><span><strong>{t(locale, "Public team")}</strong><small>{t(locale, "Enter the public team ranking and expose aggregate totals.")}</small></span><input name="isPublic" type="checkbox" /></label><button className="primary-button" type="submit">{t(locale, "Create challenge")}</button></form>
    <form action={joinTeam} className="panel team-manager-card"><span className="team-manager-icon"><LockKeyhole size={20} /></span><h2>{t(locale, "Join with an invite")}</h2><p>{t(locale, "Joining shares your challenge-period totals with teammates. You can belong to one team at a time.")}</p><label>{t(locale, "Invite code")}<input className="text-input" defaultValue={initialInvite} maxLength={36} minLength={36} name="inviteCode" required /></label><button className="secondary-button" type="submit">{t(locale, "Join challenge")}</button></form>
    {inviteCode && <div className="team-invite-result"><strong>{t(locale, "Your one-time invite code")}</strong><code>{inviteCode}</code><span className="team-invite-actions"><button onClick={copyInvite} type="button"><Copy size={14} />{t(locale, "Copy invite")}</button>{createdSlug && <a href={teamPath.replace("__slug__", createdSlug)}>{t(locale, "Open team")}</a>}</span></div>}{message && <p className="form-message team-manager-message">{message}</p>}
  </div>;

  return <div className="team-manager-grid team-manager-existing">
    <section className="panel team-manager-card"><span className="team-manager-icon"><Users size={20} /></span><h2>{team.name}</h2><p>{team.memberCount} {t(locale, "members")} · {team.isPublic ? t(locale, "Public team") : t(locale, "Private team")}</p><a className="primary-button" href={teamPath.replace("__slug__", team.slug)}>{t(locale, "Open member ranking")}</a>{!team.isOwner && <button className="danger-text-button" onClick={leaveTeam} type="button">{t(locale, "Leave team")}</button>}</section>
    {team.isOwner && settings && <section className="panel team-manager-card"><h2>{t(locale, "Challenge settings")}</h2><label>{t(locale, "Team name")}<input className="text-input" value={settings.name} onChange={(event) => setSettings({ ...settings, name: event.target.value })} /></label><label>{t(locale, "Description")}<textarea className="text-input" rows={3} value={settings.description} onChange={(event) => setSettings({ ...settings, description: event.target.value })} /></label><label className="team-privacy-toggle"><span><strong>{t(locale, "Public team")}</strong><small>{t(locale, "Private teams never appear on the public team board.")}</small></span><input checked={settings.isPublic} onChange={(event) => setSettings({ ...settings, isPublic: event.target.checked })} type="checkbox" /></label><button className="primary-button" onClick={saveSettings} type="button">{t(locale, "Save changes")}</button><button className="secondary-button" onClick={rotateInvite} type="button"><RefreshCw size={14} />{t(locale, "Generate new invite")}</button></section>}
    {inviteCode && <div className="team-invite-result"><strong>{t(locale, "New invite code")}</strong><code>{inviteCode}</code><button onClick={copyInvite} type="button"><Copy size={14} />{t(locale, "Copy invite")}</button></div>}{message && <p className="form-message team-manager-message">{message}</p>}
  </div>;
}
