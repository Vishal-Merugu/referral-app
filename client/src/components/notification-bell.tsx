"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { notifications as notificationsApi } from "@/utils/api";
import type { Notification } from "@/types/api";
import { Bell, BellDot, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./notification-bell.module.css";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        notificationsApi.list(),
        notificationsApi.unreadCount(),
      ]);
      setItems(listRes.data);
      setUnread(countRes.data.count || 0);
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, []);

  const markAll = async () => {
    await notificationsApi.readAll();
    setUnread(0);
    setItems((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
    );
  };

  const TYPE_ICON: Record<string, string> = {
    NEW_MESSAGE: "💬",
    NEW_REVIEW: "⭐",
    APPOINTMENT_BOOKED: "📅",
    APPOINTMENT_CONFIRMED: "✅",
    APPOINTMENT_CANCELLED: "❌",
  };

  return (
    <div className={styles.bellBtn}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen((o) => !o)}
        className={styles.bellBtn}
      >
        {unread > 0 ? (
          <BellDot className={`${styles.bellIcon} ${styles.bellIconUnread}`} />
        ) : (
          <Bell className={styles.bellIcon} />
        )}
        {unread > 0 && (
          <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span>
        )}
      </Button>

      {open && (
        <>
          <div className={styles.overlay} onClick={() => setOpen(false)} />
          <div className={styles.dropdown}>
            <div className={styles.header}>
              <p className={styles.headerTitle}>Notifications</p>
              {unread > 0 && (
                <button onClick={markAll} className={styles.markReadBtn}>
                  <Check className={styles.checkIcon} />
                  Mark all read
                </button>
              )}
            </div>
            <div className={styles.scrollArea}>
              {items.length === 0 ? (
                <div className={styles.emptyState}>
                  <Bell className={styles.emptyIcon} />
                  No notifications yet
                </div>
              ) : (
                items.slice(0, 20).map((n) => (
                  <div
                    key={n.id}
                    className={`${styles.notifyItem} ${!n.readAt ? styles.notifyItemUnread : ""}`}
                  >
                    {n.link ? (
                      <Link href={n.link} onClick={() => setOpen(false)}>
                        <NotificationItem n={n} typeIcon={TYPE_ICON} />
                      </Link>
                    ) : (
                      <NotificationItem n={n} typeIcon={TYPE_ICON} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationItem({
  n,
  typeIcon,
}: {
  n: Notification;
  typeIcon: Record<string, string>;
}) {
  return (
    <div className={styles.itemFlex}>
      <span className={styles.itemIcon}>{typeIcon[n.type] || "🔔"}</span>
      <div className={styles.itemContent}>
        <p className={styles.itemTitle}>{n.title}</p>
        <p className={styles.itemBody}>{n.body}</p>
        <p className={styles.itemTime}>
          {new Date(n.createdAt).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      {!n.readAt && <div className={styles.unreadDot} />}
    </div>
  );
}
