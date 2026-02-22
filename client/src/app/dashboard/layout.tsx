"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { auth, setAuthToken } from "@/utils/api";
import type { User } from "@/types/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import {
  Sparkles,
  LayoutDashboard,
  Search,
  MessageSquare,
  KanbanSquare,
  BarChart2,
  User as UserIcon,
  Settings,
  LogOut,
  Zap,
  Menu,
  X,
  Calendar,
} from "lucide-react";
import styles from "./layout.module.css";

const NAV_ITEMS = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
    exact: true,
  },
  { icon: Search, label: "Browse", href: "/dashboard/browse", exact: false },
  {
    icon: MessageSquare,
    label: "Messages",
    href: "/dashboard/messages",
    exact: false,
  },
  {
    icon: KanbanSquare,
    label: "Pipeline",
    href: "/dashboard/pipeline",
    exact: false,
  },
  {
    icon: Sparkles,
    label: "AI Match",
    href: "/dashboard/match",
    exact: false,
  },
  {
    icon: BarChart2,
    label: "Analytics",
    href: "/dashboard/analytics",
    exact: false,
  },
];
const NAV_BOTTOM = [
  { icon: UserIcon, label: "Profile", href: "/dashboard/profile" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/browse": "Browse Referrals",
  "/dashboard/messages": "Messages",
  "/dashboard/pipeline": "Pipeline",
  "/dashboard/match": "AI Match",
  "/dashboard/analytics": "Analytics",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
  "/dashboard/my-referrals": "My Referrals",
  "/dashboard/availability": "Availability",
};

function Sidebar({
  user,
  open,
  onClose,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className={styles.sidebarOverlay} onClick={onClose} />}

      <aside
        className={`${styles.sidebar} ${open ? styles.sidebarVisible : styles.sidebarHidden}`}
      >
        {/* Logo */}
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logoLayout}>
            <div className={styles.logoBox}>
              <Sparkles className={styles.logoIcon} />
            </div>
            <span className={styles.logoText}>
              Referral<span className="gradient-text">Hub</span>
            </span>
          </Link>
          <button className={styles.mobileCloseBtn} onClick={onClose}>
            <X className={styles.mobileCloseIcon} />
          </button>
        </div>

        {/* Nav */}
        <nav className={styles.navArea}>
          {NAV_ITEMS.map(({ icon: Icon, label, href, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link key={href} href={href} onClick={onClose}>
                <div
                  className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                >
                  <Icon className={styles.navIcon} />
                  {label}
                  {active && <div className={styles.activeDot} />}
                </div>
              </Link>
            );
          })}

          {user?.role === "EMPLOYEE" && (
            <div className={styles.sectionDiv}>
              <p className={styles.sectionLabel}>Employee</p>
              <Link href="/dashboard/my-referrals" onClick={onClose}>
                <div className={styles.navItem}>
                  <Zap className={styles.navIcon} />
                  My Referrals
                </div>
              </Link>
              <Link href="/dashboard/availability" onClick={onClose}>
                <div className={styles.navItem}>
                  <Calendar className={styles.navIcon} />
                  Availability
                </div>
              </Link>
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div className={styles.bottomArea}>
          {NAV_BOTTOM.map(({ icon: Icon, label, href }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={onClose}>
                <div
                  className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                >
                  <Icon className={styles.navIcon} />
                  {label}
                </div>
              </Link>
            );
          })}
          <button
            onClick={() => {
              setAuthToken(null);
              router.push("/login");
            }}
            className={styles.signOutBtn}
          >
            <LogOut className={styles.signOutIcon} />
            Sign out
          </button>

          {/* Avatar chip */}
          {user && (
            <div className={styles.avatarChip}>
              <div className={styles.avatarCircle}>
                <span className={styles.avatarInitial}>{initials || "?"}</span>
              </div>
              <div className={styles.avatarNameBox}>
                <p className={styles.avatarName}>{name}</p>
                <p className={styles.avatarEmail}>{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebar] = useState(false);

  // Derive page title from current route
  const pageTitle =
    PAGE_TITLES[pathname] ||
    PAGE_TITLES[
      Object.keys(PAGE_TITLES)
        .filter((k) => k !== "/dashboard")
        .find((k) => pathname.startsWith(k)) || "/dashboard"
    ] ||
    "Dashboard";

  const loadUser = useCallback(async () => {
    try {
      const { data } = await auth.getProfile();
      setUser(data);
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // derive initials for topbar
  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={styles.container}>
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebar(false)}
      />

      <div className={styles.mainContent}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setSidebar(true)}
          >
            <Menu className={styles.menuIcon} />
          </button>
          <span className={styles.pageTitle}>{pageTitle}</span>
          <div className={styles.spacer} />
          <ThemeToggle />
          <NotificationBell />
          <div className={styles.topbarAvatar}>
            <span className={styles.topbarAvatarText}>{initials || "?"}</span>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.mainArea}>{children}</main>
      </div>
    </div>
  );
}
