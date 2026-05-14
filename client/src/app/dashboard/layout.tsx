"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { auth, setAuthToken, messages as messagesApi } from "@/utils/api";
import type { User, Message } from "@/types/api";
import { io, Socket } from "socket.io-client";
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
  unreadMsgs,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  unreadMsgs: number;
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
                  {label === "Messages" && unreadMsgs > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadMsgs}
                    </span>
                  )}
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
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const socketRef = useRef<Socket | null>(null);

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
      const { data: uData } = await auth.getProfile();
      setUser(uData);
      setIsAuthReady(true);

      try {
        const { data: msgData } = await messagesApi.unreadCount();
        setUnreadMsgs(msgData.count);
      } catch (e) {
        console.error("Failed to fetch unread count", e);
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    // If the user navigates into Messages, optimistically zero out unread or refetch
    if (pathname.includes("/dashboard/messages") && user) {
      messagesApi
        .unreadCount()
        .then(({ data }) => setUnreadMsgs(data.count))
        .catch(() => {});
    }
  }, [pathname, user]);

  useEffect(() => {
    if (!user) return;
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    socketRef.current = io(socketUrl);

    socketRef.current.emit("join_global", user.id);

    socketRef.current.on("receive_global_message", (m: Message) => {
      // If the message is pointing at us, and we are NOT actively on the messages view
      if (
        m.receiverId === user.id &&
        !pathname.includes("/dashboard/messages")
      ) {
        messagesApi
          .unreadCount()
          .then(({ data }) => setUnreadMsgs(data.count))
          .catch(() => {});
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user, pathname]);

  // derive initials for topbar
  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebar(false)}
        unreadMsgs={unreadMsgs}
      />

      <div className={styles.mainContent}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setSidebar(true)}
          >
            <div className="relative">
              <Menu className={styles.menuIcon} />
              {unreadMsgs > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {unreadMsgs > 9 ? "9+" : unreadMsgs}
                </span>
              )}
            </div>
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
