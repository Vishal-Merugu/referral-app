"use client";

import { useEffect, useState } from "react";
import { auth } from "@/utils/api";
import type { User } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Shield,
  Palette,
  Globe2,
  Loader2,
  Moon,
  Sun,
  Check,
} from "lucide-react";
import { useTheme } from "next-themes";
import styles from "./page.module.css";

const SECTIONS = [
  {
    title: "Notifications",
    icon: Bell,
    items: [
      {
        id: "email_messages",
        label: "New messages",
        desc: "Email when someone messages you",
        default: true,
      },
      {
        id: "email_appts",
        label: "Appointment updates",
        desc: "Confirmed, cancelled, rescheduled",
        default: true,
      },
      {
        id: "email_referrals",
        label: "New match found",
        desc: "When a referral matches your skills",
        default: false,
      },
      {
        id: "email_digest",
        label: "Weekly digest",
        desc: "Summary of your week on ReferralHub",
        default: true,
      },
    ],
  },
  {
    title: "Privacy",
    icon: Shield,
    items: [
      {
        id: "public_profile",
        label: "Public profile",
        desc: "Allow others to find your profile by name",
        default: true,
      },
      {
        id: "show_activity",
        label: "Show online status",
        desc: "Show when you were last active",
        default: false,
      },
    ],
  },
];

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`${styles.toggleBtn} ${on ? styles.toggleBtnOn : styles.toggleBtnOff}`}
    >
      <span
        className={`${styles.toggleKnob} ${on ? styles.toggleKnobOn : styles.toggleKnobOff}`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    email_messages: true,
    email_appts: true,
    email_referrals: false,
    email_digest: true,
    public_profile: true,
    show_activity: false,
  });

  useEffect(() => {
    auth
      .getProfile()
      .then(({ data }) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className={styles.loaderPage}>
        <Loader2 className={styles.loaderIcon} />
      </div>
    );

  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageSubtitle}>Manage your account preferences</p>
      </div>

      {/* Appearance */}
      <section>
        <div className={styles.sectionHeader}>
          <div className={`gradient-button ${styles.sectionIconBox}`}>
            <Palette className={styles.sectionIcon} />
          </div>
          <h2 className={styles.sectionTitle}>Appearance</h2>
        </div>
        <div className={styles.themeGrid}>
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
            { id: "system", label: "System", icon: Globe2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`${styles.themeOption} ${theme === id ? styles.themeOptionActive : ""}`}
            >
              <Icon
                className={`${styles.themeIcon} ${theme === id ? styles.themeIconActive : ""}`}
              />
              <span
                className={`${styles.themeLabel} ${theme === id ? styles.themeLabelActive : ""}`}
              >
                {label}
              </span>
              {theme === id && (
                <div className={`gradient-button ${styles.themeCheckmark}`}>
                  <Check className={styles.checkIcon} />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Notifications + Privacy */}
      {SECTIONS.map(({ title, icon: Icon, items }) => (
        <section key={title}>
          <div className={styles.sectionHeader}>
            <div className={`gradient-button ${styles.sectionIconBox}`}>
              <Icon className={styles.sectionIcon} />
            </div>
            <h2 className={styles.sectionTitle}>{title}</h2>
          </div>
          <div className={styles.listGroup}>
            {items.map(({ id, label, desc }) => (
              <div key={id} className={styles.listItem}>
                <div>
                  <p className={styles.itemLabel}>{label}</p>
                  <p className={styles.itemDesc}>{desc}</p>
                </div>
                <Toggle
                  on={prefs[id]}
                  onChange={(v) => setPrefs((p) => ({ ...p, [id]: v }))}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Account info */}
      <section>
        <div className={styles.sectionHeader}>
          <div className={`gradient-button ${styles.sectionIconBox}`}>
            <Globe2 className={styles.sectionIcon} />
          </div>
          <h2 className={styles.sectionTitle}>Account</h2>
        </div>
        <div className={styles.listGroup}>
          {[
            { label: "Full name", value: name || "—" },
            { label: "Email", value: user?.email ?? "—" },
            {
              label: "Account type",
              value: user?.role === "EMPLOYEE" ? "Employee" : "Job Seeker",
            },
            {
              label: "Member since",
              value: user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString([], {
                    month: "long",
                    year: "numeric",
                  })
                : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className={styles.accountItem}>
              <p className={styles.accountKey}>{label}</p>
              <p className={styles.accountValue}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="pb-8" />
    </div>
  );
}
