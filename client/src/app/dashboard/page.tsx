"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, referrals, appointments } from "@/utils/api";
import type { User, ReferralPost, Appointment } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Zap,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  ChevronRight,
  ArrowRight,
  Plus,
  Building2,
  Loader2,
  Sparkles,
} from "lucide-react";
import styles from "./page.module.css";

interface ExtendedReferralPost extends ReferralPost {
  remoteType?: "REMOTE" | "HYBRID" | "ONSITE";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myReferrals, setMyReferrals] = useState<ExtendedReferralPost[]>([]);
  const [myAppts, setMyAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: u }, apptRes] = await Promise.all([
          auth.getProfile(),
          appointments.getMy(),
        ]);
        setUser(u);
        setMyAppts(apptRes.data);
        if (u.role === "EMPLOYEE") {
          const refs = await referrals.getMy();
          setMyReferrals(refs.data);
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.loaderOverlay}>
        <div className={styles.loaderBody}>
          <div
            className={`gradient-button shadow-primary ${styles.loaderIconBox}`}
          >
            <Sparkles className={styles.sparklesPulse} />
          </div>
          <Loader2 className={styles.loaderSpinner} />
        </div>
      </div>
    );
  }

  const name =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const activeAppts = myAppts.filter((a) => a.status !== "CANCELLED");
  const pending = myAppts.filter((a) => a.status === "PENDING").length;
  const confirmed = myAppts.filter((a) => a.status === "CONFIRMED").length;
  const completed = myAppts.filter((a) => a.status === "COMPLETED").length;

  const STATS =
    user?.role === "EMPLOYEE"
      ? [
          {
            label: "Active posts",
            value: myReferrals.filter((r) => r.status === "ACTIVE").length,
            icon: Zap,
            color: styles.colorViolet,
            bg: styles.bgViolet,
          },
          {
            label: "Appointments",
            value: activeAppts.length,
            icon: Calendar,
            color: styles.colorCyan,
            bg: styles.bgCyan,
          },
          {
            label: "Pending review",
            value: pending,
            icon: Clock,
            color: styles.colorAmber,
            bg: styles.bgAmber,
          },
          {
            label: "Confirmed",
            value: confirmed,
            icon: Star,
            color: styles.colorEmerald,
            bg: styles.bgEmerald,
          },
        ]
      : [
          {
            label: "Appointments",
            value: activeAppts.length,
            icon: Calendar,
            color: styles.colorViolet,
            bg: styles.bgViolet,
          },
          {
            label: "Pending",
            value: pending,
            icon: Clock,
            color: styles.colorAmber,
            bg: styles.bgAmber,
          },
          {
            label: "Confirmed",
            value: confirmed,
            icon: Star,
            color: styles.colorEmerald,
            bg: styles.bgEmerald,
          },
          {
            label: "Completed",
            value: completed,
            icon: TrendingUp,
            color: styles.colorCyan,
            bg: styles.bgCyan,
          },
        ];

  return (
    <div className={styles.container}>
      {/* Welcome */}
      <div className={styles.headerRow}>
        <div>
          <p className={styles.subText}>
            {greeting},{" "}
            <span className="gradient-text">{user?.firstName || name}</span> 👋
            {" · "}
            {user?.role === "EMPLOYEE"
              ? "Here's how your referral posts are performing."
              : "Here's your job hunt at a glance."}
          </p>
        </div>
        {user?.role === "EMPLOYEE" && (
          <Link href="/dashboard/my-referrals/create">
            <Button variant="gradient" size="sm" className={styles.newPostBtn}>
              <Plus className={styles.icon3_5} />
              New post
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {STATS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={styles.statCard}>
            <div className={`${styles.statIconBox} ${bg}`}>
              <Icon className={`${styles.icon4} ${color}`} />
            </div>
            <p className={styles.statValue}>{value}</p>
            <p className={styles.statLabel}>{label}</p>
          </div>
        ))}
      </div>

      <div className={styles.contentGrid}>
        {/* Recent activity */}
        <div className={styles.activityColumn}>
          <div className={styles.sectionHeaderRow}>
            <h2 className={styles.sectionTitle}>
              {user?.role === "EMPLOYEE"
                ? "Your referral posts"
                : "Recent appointments"}
            </h2>
            <Link
              href={
                user?.role === "EMPLOYEE"
                  ? "/dashboard/my-referrals"
                  : "/dashboard/pipeline"
              }
            >
              <Button variant="ghost" size="xs" className={styles.viewAllBtn}>
                View all <ChevronRight className={styles.icon3} />
              </Button>
            </Link>
          </div>

          {activeAppts.length === 0 && myReferrals.length === 0 ? (
            <div className={styles.emptyStateCard}>
              <div className={styles.emptyStateIconBox}>
                <Search className={`${styles.icon5} ${styles.textWhite}`} />
              </div>
              <h3 className={styles.emptyStateTitle}>
                {user?.role === "EMPLOYEE"
                  ? "No referral posts yet"
                  : "No appointments yet"}
              </h3>
              <p className={styles.emptyStateDesc}>
                {user?.role === "EMPLOYEE"
                  ? "Create your first referral post to start helping candidates."
                  : "Browse referrals and book your first appointment."}
              </p>
              <Link
                href={
                  user?.role === "EMPLOYEE"
                    ? "/dashboard/my-referrals/create"
                    : "/dashboard/browse"
                }
              >
                <Button
                  variant="gradient"
                  size="sm"
                  className={styles.emptyStateBtn}
                >
                  {user?.role === "EMPLOYEE"
                    ? "Create post"
                    : "Browse referrals"}{" "}
                  <ArrowRight className={styles.icon3_5} />
                </Button>
              </Link>
            </div>
          ) : (
            <div className={styles.listContainer}>
              {(user?.role === "EMPLOYEE"
                ? myReferrals.slice(0, 6)
                : activeAppts.slice(0, 6)
              ).map((item: ExtendedReferralPost | Appointment) => {
                const isAppt = "referralPostId" in item;
                const appt = item as Appointment;
                const ref = item as ExtendedReferralPost;
                return (
                  <div key={item.id} className={styles.listItemCard}>
                    <div className={styles.listItemIconBox}>
                      {isAppt ? (
                        <Building2
                          className={`${styles.icon4} ${styles.textWhite}`}
                        />
                      ) : (
                        <Zap
                          className={`${styles.icon4} ${styles.textWhite}`}
                        />
                      )}
                    </div>
                    <div className={styles.listItemContent}>
                      <p className={styles.listItemTitle}>
                        {isAppt
                          ? appt.referralPost?.jobRole || "Position"
                          : ref.jobRole}
                      </p>
                      <p className={styles.listItemDesc}>
                        {isAppt
                          ? `${appt.referralPost?.employee?.company?.name ?? ""}${appt.scheduledAt ? ` · ${new Date(appt.scheduledAt).toLocaleDateString([], { month: "short", day: "numeric" })}` : ""}`
                          : `${ref.experienceLevel} · ${(ref as ExtendedReferralPost).remoteType ?? "Any"}`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        (isAppt ? appt.status : ref.status) === "ACTIVE" ||
                        (isAppt ? appt.status : ref.status) === "CONFIRMED"
                          ? "success"
                          : (isAppt ? appt.status : ref.status) === "PENDING"
                            ? "warning"
                            : "secondary"
                      }
                      className={styles.listItemBadge}
                    >
                      {isAppt ? appt.status : ref.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2
            className={styles.sectionTitle}
            style={{ marginBottom: "0.75rem" }}
          >
            Quick actions
          </h2>
          <div className={styles.quickActionsList}>
            {[
              {
                icon: Search,
                label: "Browse referrals",
                desc: "Find opportunities",
                href: "/dashboard/browse",
                color: styles.colorViolet,
                bg: styles.bgViolet,
              },
              {
                icon: Building2,
                label: "Messages",
                desc: "Chat with referrers",
                href: "/dashboard/messages",
                color: styles.colorCyan,
                bg: styles.bgCyan,
              },
              {
                icon: TrendingUp,
                label: "Pipeline",
                desc: "Track applications",
                href: "/dashboard/pipeline",
                color: styles.colorAmber,
                bg: styles.bgAmber,
              },
              {
                icon: Star,
                label: "Analytics",
                desc: "View your stats",
                href: "/dashboard/analytics",
                color: styles.colorEmerald,
                bg: styles.bgEmerald,
              },
            ].map(({ icon: Icon, label, desc, href, color, bg }) => (
              <Link key={href} href={href}>
                <div className={styles.quickActionCard}>
                  <div className={`${styles.quickActionIconBox} ${bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                  </div>
                  <div className={styles.quickActionContent}>
                    <p className={styles.quickActionTitle}>{label}</p>
                    <p className={styles.quickActionDesc}>{desc}</p>
                  </div>
                  <ChevronRight className={styles.quickActionChevron} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
