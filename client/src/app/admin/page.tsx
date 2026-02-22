"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, companies, admin } from "@/utils/api";
import type { User, Company } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Search,
  Building2,
  Users,
  Loader2,
  Globe,
  Shield,
  Ban,
  CheckCircle,
} from "lucide-react";
import styles from "./page.module.css";

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isBanned: boolean;
  isVerified: boolean;
  createdAt: string;
  company?: { name: string } | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeReferrals: number;
    appointmentsToday: number;
  } | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "users">("stats");

  const load = async () => {
    try {
      const [{ data: u }, statsRes, usersRes] = await Promise.all([
        auth.getProfile(),
        admin.stats(),
        admin.users(),
      ]);
      if (u.role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }
      setUser(u);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBan = async (id: string, banned: boolean) => {
    if (banned) await admin.unbanUser(id);
    else await admin.banUser(id);
    load();
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <div className={styles.loaderPage}>
        <Loader2 className={styles.loaderIcon} />
      </div>
    );

  return (
    <div className={styles.page}>
      <nav className={`glass ${styles.nav}`}>
        <div className={styles.navInner}>
          <div className={styles.navIconBox}>
            <Shield className={`${styles.iconSm} ${styles.textWhite}`} />
          </div>
          <span className={styles.navTitle}>Admin Panel</span>
          <Badge variant="destructive" className={styles.badgeDestructive}>
            Admin
          </Badge>
        </div>
      </nav>

      <div className={styles.mainContent}>
        {/* Stats */}
        {stats && (
          <div className={styles.statsGrid}>
            {[
              {
                label: "Total users",
                value: stats.totalUsers,
                icon: Users,
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                label: "Active referrals",
                value: stats.activeReferrals,
                icon: Building2,
                color: "text-success",
                bg: "bg-success/10",
              },
              {
                label: "Appointments today",
                value: stats.appointmentsToday,
                icon: CheckCircle,
                color: "text-accent",
                bg: "bg-accent/10",
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className={styles.statCard}>
                <CardContent className={styles.statCardContent}>
                  <div
                    className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}
                  >
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <p className={styles.statValue}>{value}</p>
                  <p className={styles.statLabel}>{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabsList}>
          {(["stats", "users"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${activeTab === t ? "bg-primary text-white" : "text-foreground-muted hover:text-foreground hover:bg-surface-hover"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Users table */}
        {activeTab === "users" && (
          <Card>
            <CardHeader className={styles.cardHeader}>
              <div className={styles.cardHeaderFlex}>
                <CardTitle>All users ({filtered.length})</CardTitle>
                <div className={styles.searchWrap}>
                  <Search className={styles.searchIcon} />
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className={styles.cardContent}>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeaderRow}>
                      <th className={styles.tableHeaderCell}>User</th>
                      <th className={styles.tableHeaderCell}>Role</th>
                      <th className={styles.tableHeaderCell}>Company</th>
                      <th className={styles.tableHeaderCell}>Status</th>
                      <th className={styles.tableHeaderCell}>Joined</th>
                      <th className={styles.tableHeaderCell} />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          <div>
                            <p className={styles.userName}>
                              {u.firstName} {u.lastName}
                            </p>
                            <p className={styles.userEmail}>{u.email}</p>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <Badge
                            variant={
                              u.role === "ADMIN"
                                ? "destructive"
                                : u.role === "EMPLOYEE"
                                  ? "info"
                                  : "secondary"
                            }
                            className={styles.userText}
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className={styles.tableCell}>
                          <span className={styles.userText}>
                            {u.company?.name || "—"}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          {u.isBanned ? (
                            <Badge
                              variant="destructive"
                              className={styles.userText}
                            >
                              Banned
                            </Badge>
                          ) : u.isVerified ? (
                            <Badge
                              variant="success"
                              className={styles.userText}
                            >
                              Verified
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className={styles.userText}
                            >
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className={styles.tableCell}>
                          <span className={styles.userText}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.actionFlex}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={
                                u.isBanned
                                  ? "text-success hover:text-success"
                                  : "text-destructive hover:text-destructive"
                              }
                              onClick={() => handleBan(u.id, u.isBanned)}
                            >
                              {u.isBanned ? (
                                <>
                                  <CheckCircle className={styles.iconXs} />
                                  Unban
                                </>
                              ) : (
                                <>
                                  <Ban className={styles.iconXs} />
                                  Ban
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
