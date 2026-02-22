"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, analytics } from "@/utils/api";
import type { User } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowLeft,
  TrendingUp,
  Eye,
  Bookmark,
  Calendar,
  Loader2,
  BarChart2,
  CheckCircle,
} from "lucide-react";
import styles from "./page.module.css";

interface PostAnalytics {
  id: string;
  jobRole: string;
  status: string;
  remoteType: string;
  viewCount: number;
  bookmarkCount: number;
  appointmentCount: number;
  byStatus: {
    PENDING: number;
    CONFIRMED: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  conversionRate: number;
  createdAt: string;
}
interface Totals {
  posts: number;
  views: number;
  bookmarks: number;
  appointments: number;
  completed: number;
}

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PostAnalytics[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await auth.getProfile();
        setUser(u);
        if (u.role === "EMPLOYEE") {
          const { data: analyticsData } = await analytics.myReferrals();
          setPosts(analyticsData.posts || []);
          setTotals(analyticsData.totals || null);
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading)
    return (
      <div className={styles.loaderPage}>
        <Loader2 className={styles.loaderIcon} />
      </div>
    );

  // Seeker view — show their pipeline stats
  if (user?.role !== "EMPLOYEE") {
    return (
      <div className={styles.seekerContainer}>
        <div className={styles.seekerCard}>
          <BarChart2 className={styles.seekerIcon} />
          <h3 className={styles.seekerTitle}>Seeker analytics coming soon</h3>
          <p className={styles.seekerDesc}>
            Track your application funnel, response rates, and weekly activity
            here.
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total posts",
      value: totals?.posts || 0,
      icon: BarChart2,
      color: styles.textPrimary,
      bg: styles.bgPrimary,
    },
    {
      label: "Total views",
      value: totals?.views || 0,
      icon: Eye,
      color: styles.textAccent,
      bg: styles.bgAccent,
    },
    {
      label: "Bookmarks",
      value: totals?.bookmarks || 0,
      icon: Bookmark,
      color: styles.textSecondary,
      bg: styles.bgSecondary,
    },
    {
      label: "Appointments",
      value: totals?.appointments || 0,
      icon: Calendar,
      color: styles.textWarning,
      bg: styles.bgWarning,
    },
    {
      label: "Completed",
      value: totals?.completed || 0,
      icon: CheckCircle,
      color: styles.textSuccess,
      bg: styles.bgSuccess,
    },
    {
      label: "Avg. conversion",
      value: posts.length
        ? `${Math.round(posts.reduce((s, p) => s + p.conversionRate, 0) / posts.length)}%`
        : "—",
      icon: TrendingUp,
      color: styles.textPrimary,
      bg: styles.bgPrimary,
    },
  ];

  return (
    <div className={styles.empContainer}>
      <div className={styles.headerBox}>
        <p className={styles.pageSubtitle}>
          Performance across your referral posts
        </p>
      </div>
      {/* Stats */}
      <div className={styles.statsGrid}>
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className={styles.statCard}>
            <CardContent className={styles.statContent}>
              <div className={`${styles.statIconBox} ${bg}`}>
                <Icon className={`${styles.iconSm} ${color}`} />
              </div>
              <p className={styles.statValue}>{value}</p>
              <p className={styles.statLabel}>{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-post breakdown */}
      <div>
        <h2 className={styles.sectionTitle}>Post performance</h2>
        {posts.length === 0 ? (
          <Card className={styles.emptyCard}>
            <CardContent>
              <BarChart2 className={styles.emptyIcon} />
              <p className={styles.emptyText}>No referral posts yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className={styles.postList}>
            {posts.map((p) => (
              <Card key={p.id} className={styles.postCard}>
                <CardContent className={styles.postCardContent}>
                  <div className={styles.postHeaderRow}>
                    <div className={styles.postTitleBox}>
                      <h3 className={styles.postTitle}>{p.jobRole}</h3>
                      <div className={styles.postMetaRow}>
                        <Badge
                          variant={
                            p.status === "ACTIVE" ? "success" : "secondary"
                          }
                          className={styles.badgeSm}
                        >
                          {p.status}
                        </Badge>
                        <Badge variant="secondary" className={styles.badgeSm}>
                          {p.remoteType}
                        </Badge>
                        <span className={styles.postDate}>
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className={styles.conversionBox}>
                      <p className={styles.convRate}>{p.conversionRate}%</p>
                      <p className={styles.convLabel}>conversion</p>
                    </div>
                  </div>
                  <div className={styles.metricsGrid}>
                    {[
                      { label: "Views", value: p.viewCount, icon: Eye },
                      {
                        label: "Saves",
                        value: p.bookmarkCount,
                        icon: Bookmark,
                      },
                      {
                        label: "Booked",
                        value: p.appointmentCount,
                        icon: Calendar,
                      },
                      {
                        label: "Done",
                        value: p.byStatus.COMPLETED,
                        icon: CheckCircle,
                      },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className={styles.metricItem}>
                        <p className={styles.metricValue}>{value}</p>
                        <p className={styles.metricLabel}>{label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Mini funnel */}
                  <div className={styles.funnelBox}>
                    <p className={styles.funnelTitle}>Appointment breakdown</p>
                    <div className={styles.funnelStages}>
                      {Object.entries(p.byStatus).map(([status, count]) => (
                        <div key={status} className={styles.funnelStageItem}>
                          <div className={styles.barTrack}>
                            <div
                              className={styles.barFill}
                              style={{
                                width: `${p.appointmentCount ? (count / p.appointmentCount) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <p className={styles.stageLabel}>{status}</p>
                          <p className={styles.stageCount}>{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
