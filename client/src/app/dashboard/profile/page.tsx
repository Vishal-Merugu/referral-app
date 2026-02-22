"use client";

import { useEffect, useState } from "react";
import {
  auth,
  profile as profileApi,
  companies as companiesApi,
  setAuthToken,
} from "@/utils/api";
import type { User } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon,
  LinkIcon,
  Camera,
  CheckCircle,
  Loader2,
  Briefcase,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import styles from "./page.module.css";

type ProfileForm = {
  firstName: string;
  lastName: string;
  bio: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  avatarUrl: string;
  skills: string;
  companyId: string;
};

const TABS = ["About", "Social", "Skills", "Security"] as const;
type Tab = (typeof TABS)[number];

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [form, setForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    bio: "",
    phone: "",
    location: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    avatarUrl: "",
    skills: "",
    companyId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("About");

  const set = (k: keyof ProfileForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    (async () => {
      const [{ data: u }, compRes] = await Promise.all([
        auth.getProfile(),
        companiesApi.list(),
      ]);
      setUser(u);
      setCompanies(compRes.data ?? []);
      setForm({
        firstName: u.firstName ?? "",
        lastName: u.lastName ?? "",
        bio: u.bio ?? "",
        phone: u.phone ?? "",
        location: u.location ?? "",
        linkedinUrl: u.linkedinUrl ?? "",
        githubUrl: u.githubUrl ?? "",
        portfolioUrl: u.portfolioUrl ?? "",
        avatarUrl: u.avatarUrl ?? "",
        skills: Array.isArray(u.skills) ? u.skills.join(", ") : "",
        companyId: u.companyId ?? "",
      });
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileApi.update({
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        bio: form.bio || undefined,
        linkedinUrl: form.linkedinUrl || undefined,
        githubUrl: form.githubUrl || undefined,
        portfolioUrl: form.portfolioUrl || undefined,
        avatarUrl: form.avatarUrl || undefined,
        companyId: form.companyId || undefined,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setSavedAt(new Date().toLocaleTimeString());
    } catch {
      /* noop */
    }
    setSaving(false);
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResetting(true);
    try {
      await auth.resetPassword(user.email);
      alert("Password reset link sent to your email.");
    } catch {
      alert("Failed to send reset email.");
    }
    setResetting(false);
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete your account? This cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    try {
      await auth.deleteAccount();
      setAuthToken(null);
      window.location.href = "/signup";
    } catch {
      alert("Failed to delete account.");
      setDeleting(false);
    }
  };

  if (loading)
    return (
      <div className={styles.loaderPage}>
        <Loader2 className={styles.loaderIcon} />
      </div>
    );

  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.avatarWrapper}>
          <div className={`gradient-button ${styles.avatarBox}`}>
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt={name}
                className={styles.avatarImg}
              />
            ) : (
              <span className={styles.avatarText}>{initials || "?"}</span>
            )}
          </div>
          <button className={styles.avatarEditBtn}>
            <Camera className={styles.avatarEditIcon} />
          </button>
        </div>
        <div className={styles.infoBlock}>
          <h1 className={styles.nameTitle}>{name || "Your Profile"}</h1>
          <p className={styles.emailSubtitle}>{user?.email}</p>
          <div className={styles.badgeRow}>
            <Badge
              variant={user?.role === "EMPLOYEE" ? "info" : "purple"}
              className={styles.badgeSm}
            >
              {user?.role === "EMPLOYEE" ? "Employee" : "Job Seeker"}
            </Badge>
            {user?.isVerified && (
              <Badge
                variant="success"
                className={`${styles.badgeSm} ${styles.badgeGap}`}
              >
                <CheckCircle className="w-2.5 h-2.5" /> Verified
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant="gradient"
          size="sm"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className={styles.spinner} /> : "Save"}
        </Button>
      </div>

      {savedAt && (
        <div className={styles.savedStatus}>
          <CheckCircle className={styles.statusIcon} /> Saved at {savedAt}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${styles.tabItem} ${
              activeTab === tab ? styles.tabActive : styles.tabInactive
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.formArea}>
        {activeTab === "About" && (
          <>
            <div className={styles.gridRow}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>First name</label>
                <Input
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  icon={<UserIcon className="w-3.5 h-3.5" />}
                  placeholder="John"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Last name</label>
                <Input
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="Smith"
                />
              </div>
            </div>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                rows={3}
                placeholder="A short bio…"
                className={styles.textarea}
              />
            </div>
            <div className={styles.gridRow}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Location</label>
                <Input
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  icon={<MapPin className="w-3.5 h-3.5" />}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Avatar URL</label>
                <Input
                  value={form.avatarUrl}
                  onChange={(e) => set("avatarUrl", e.target.value)}
                  icon={<Camera className="w-3.5 h-3.5" />}
                  placeholder="https://…"
                />
              </div>
            </div>
            {user?.role === "EMPLOYEE" && (
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Company</label>
                <select
                  value={form.companyId}
                  onChange={(e) => set("companyId", e.target.value)}
                  className={styles.select}
                >
                  <option value="">No company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {activeTab === "Social" && (
          <>
            {[
              {
                key: "linkedinUrl",
                label: "LinkedIn",
                placeholder: "https://linkedin.com/in/…",
              },
              {
                key: "githubUrl",
                label: "GitHub",
                placeholder: "https://github.com/…",
              },
              {
                key: "portfolioUrl",
                label: "Portfolio",
                placeholder: "https://yoursite.com",
              },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className={styles.formField}>
                <label className={styles.fieldLabel}>{label}</label>
                <Input
                  value={form[key as keyof ProfileForm]}
                  onChange={(e) =>
                    set(key as keyof ProfileForm, e.target.value)
                  }
                  icon={<LinkIcon className="w-3.5 h-3.5" />}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </>
        )}

        {activeTab === "Skills" && (
          <div className={styles.skillsArea}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Skills</label>
              <p className={styles.fieldHint}>
                Comma-separated (e.g. React, TypeScript, Node.js)
              </p>
              <textarea
                value={form.skills}
                onChange={(e) => set("skills", e.target.value)}
                rows={4}
                placeholder="React, TypeScript, Node.js…"
                className={styles.textarea}
              />
            </div>
            <div className={styles.skillsList}>
              {form.skills
                .split(",")
                .filter(Boolean)
                .map((s) => (
                  <Badge key={s} variant="purple" className={styles.badgeSm}>
                    {s.trim()}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {activeTab === "Security" && (
          <div className={styles.skillsArea}>
            <div className={`glass-card ${styles.securityCardFlex}`}>
              <div className={styles.securityIconBox}>
                <Mail className={styles.securityIcon} />
              </div>
              <div>
                <p className={styles.securityTitle}>Email address</p>
                <p className={styles.securityDesc}>{user?.email}</p>
              </div>
            </div>
            <div className={`glass-card ${styles.securityCard}`}>
              <p className={styles.securityCardTitle}>Change password</p>
              <p className={styles.securityCardDesc}>
                We&apos;ll send a reset link to your email.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetPassword}
                disabled={resetting}
              >
                {resetting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  "Send reset email"
                )}
              </Button>
            </div>
            <div className={`glass-card ${styles.dangerCard}`}>
              <p className={styles.dangerCardTitle}>Delete account</p>
              <p className={styles.dangerCardDesc}>
                Permanent. Cannot be undone.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  "Delete my account"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
