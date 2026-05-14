"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth, messages as messagesApi } from "@/utils/api";
import type { User, Message } from "@/types/api";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  ArrowLeft,
  Send,
  Loader2,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import styles from "./page.module.css";

function Avatar({
  name,
  src,
  className = "",
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  if (src)
    return (
      <img
        src={src}
        alt={name}
        className={`${styles.avatarImg} ${className}`}
      />
    );
  return (
    <div className={`gradient-button ${styles.avatarFallback} ${className}`}>
      <span className={styles.avatarFallbackText}>{initials || "?"}</span>
    </div>
  );
}

interface ConversationPartner {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  lastMessage?: string;
  lastTime?: string;
  unread?: boolean;
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initPartnerId = searchParams.get("partnerId");

  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<ConversationPartner[]>([]);
  const [thread, setThread] = useState<Message[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(
    initPartnerId,
  );
  const [activePartner, setActivePartner] =
    useState<ConversationPartner | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Derive unified room ID alphabetically based on IDs
  const getRoomId = (pId: string) => {
    if (!user) return "";
    return [user.id, pId].sort().join("_");
  };

  const loadConversations = useCallback(async () => {
    const { data } = (await messagesApi.getThread)
      ? await messagesApi.getThread("")
      : { data: [] };
    // get all messages to find unique partners
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/messages`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const convs: Message[] = await res.json();
      const seen = new Set<string>();
      const partners: ConversationPartner[] = [];
      if (user && Array.isArray(convs)) {
        convs.forEach((m) => {
          const partner = m.senderId === user.id ? m.receiver : m.sender;
          if (partner && !seen.has(partner.id)) {
            seen.add(partner.id);
            partners.push({
              id: partner.id,
              firstName: partner.firstName,
              lastName: partner.lastName,
              avatarUrl: partner.avatarUrl,
              lastMessage: m.content,
              lastTime: m.createdAt,
            });
          }
        });
      }
      setConversations(partners);
    } catch {
      /* noop */
    }
  }, [user]);

  const loadThread = useCallback(async (partnerId: string) => {
    const { data } = await messagesApi.getThread(partnerId);
    setThread(data);
    setTimeout(
      () => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await auth.getProfile();
        setUser(userData);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  useEffect(() => {
    if (activePartnerId) {
      loadThread(activePartnerId);
      // Optimistically create a placeholder if it's a completely new chat
      if (
        !conversations.find((c) => c.id === activePartnerId) &&
        activePartnerId !== user?.id
      ) {
        setActivePartner({
          id: activePartnerId,
          firstName: "New",
          lastName: "Message",
          avatarUrl: null,
        });
      } else {
        const p = conversations.find((c) => c.id === activePartnerId);
        if (p) setActivePartner(p);
      }
    }
  }, [activePartnerId, loadThread, conversations, user?.id]);

  useEffect(() => {
    if (!user) return;
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    socketRef.current = io(socketUrl);

    socketRef.current.on("receive_message", (m: Message) => {
      // If the incoming message belongs to our currently active conversation room
      if (m.senderId === activePartnerId || m.receiverId === activePartnerId) {
        setThread((prev) => {
          if (prev.find((x) => x.id === m.id)) return prev;
          return [...prev, m];
        });
        setTimeout(
          () => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          50,
        );
      }
      loadConversations();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user, activePartnerId, loadConversations]);

  useEffect(() => {
    if (activePartnerId && socketRef.current) {
      socketRef.current.emit("join_room", getRoomId(activePartnerId));
    }
  }, [activePartnerId, user]);

  const selectPartner = (p: ConversationPartner) => {
    setActivePartnerId(p.id);
    setActivePartner(p);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activePartnerId || !user) return;
    setSending(true);
    try {
      const { data: sentMsg } = await messagesApi.send({
        receiverId: activePartnerId,
        content: input.trim(),
      });
      setInput("");
      // Add instantly to UI
      setThread((prev) => [...prev, sentMsg]);
      setTimeout(
        () => threadEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
      // Broadcast over network
      if (socketRef.current) {
        socketRef.current.emit("send_message", {
          roomId: getRoomId(activePartnerId),
          message: sentMsg,
        });
      }
      loadConversations();
    } catch {
      /* noop */
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className={styles.loaderPage}>
        <Loader2 className={styles.loaderIcon} />
      </div>
    );

  const partnerName = activePartner
    ? `${activePartner.firstName || ""} ${activePartner.lastName || ""}`.trim()
    : "";

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.mainContent}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div
            className={`${styles.sidebarHeader} flex items-center justify-between`}
          >
            <p className={styles.sidebarTitle}>Conversations</p>
            <button
              onClick={loadConversations}
              className="p-1.5 hover:bg-surface-hover rounded-full transition-colors text-foreground-muted hover:text-foreground"
              title="Refresh conversations"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className={styles.threadList}>
            {conversations.length === 0 ? (
              <div className={styles.emptySidebar}>
                <MessageSquare className={styles.emptySidebarIcon} />
                <p className={styles.emptySidebarText}>No conversations yet</p>
              </div>
            ) : (
              conversations.map((p) => {
                const name = `${p.firstName || ""} ${p.lastName || ""}`.trim();
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPartner(p)}
                    className={`${styles.partnerBtn} ${activePartnerId === p.id ? styles.partnerBtnActive : ""}`}
                  >
                    <Avatar
                      name={name}
                      src={p.avatarUrl}
                      className={styles.avatarLg}
                    />
                    <div className={styles.partnerInfo}>
                      <p className={styles.partnerName}>{name}</p>
                      <p
                        className={`${styles.partnerMsg} truncate text-xs text-foreground-muted mt-0.5`}
                      >
                        {p.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={styles.chatArea}>
          {activePartnerId && activePartner ? (
            <>
              {/* Chat header */}
              <div className={styles.chatHeader}>
                <Avatar
                  name={partnerName}
                  src={activePartner.avatarUrl}
                  className={styles.avatarMd}
                />
                <div>
                  <p className={styles.chatHeaderName}>{partnerName}</p>
                </div>
              </div>

              {/* Messages */}
              <div className={styles.messagesList}>
                {thread.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`${styles.msgRow} ${isMe ? styles.msgRowMe : ""}`}
                    >
                      {!isMe && (
                        <Avatar
                          name={partnerName}
                          src={activePartner.avatarUrl}
                          className={styles.avatarSm}
                        />
                      )}
                      <div
                        className={`${styles.msgBubble} ${isMe ? `gradient-button ${styles.msgBubbleMe}` : styles.msgBubbleThem}`}
                      >
                        {msg.content}
                        <p
                          className={`${styles.msgTime} ${isMe ? styles.msgTimeMe : styles.msgTimeThem}`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={threadEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className={styles.inputForm}>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className={styles.flex1}
                  disabled={sending}
                />
                <Button
                  type="submit"
                  variant="gradient"
                  size="icon"
                  className={styles.sendBtn}
                  disabled={!input.trim() || sending}
                >
                  {sending ? (
                    <Loader2 className={styles.spinner} />
                  ) : (
                    <Send className={styles.iconSm} />
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className={styles.emptyChat}>
              <div
                dangerouslySetInnerHTML={{
                  __html: `<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-foreground-muted/30 mb-6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
                }}
              />
              <div className="text-center">
                <h3
                  className={`${styles.emptyChatTitle} text-xl font-semibold text-foreground mb-2`}
                >
                  Your messages
                </h3>
                <p
                  className={`${styles.emptyChatDesc} text-sm text-foreground-muted max-w-xs mx-auto`}
                >
                  Select a conversation from the sidebar to view your messages
                  and continue the discussion.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loaderPage}>
          <Loader2 className={styles.loaderIcon} />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
