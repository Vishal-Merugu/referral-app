"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, appointments } from "@/utils/api";
import type { User, Appointment } from "@/types/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowLeft,
  Building2,
  Calendar,
  Loader2,
  ChevronRight,
} from "lucide-react";
import styles from "./page.module.css";

const STAGES = [
  "INTRO",
  "SCREENING",
  "INTERVIEW",
  "DECISION",
  "OFFER",
] as const;
type Stage = (typeof STAGES)[number];

const STAGE_COLORS: Record<Stage, string> = {
  INTRO: styles.stageIntro,
  SCREENING: styles.stageScreening,
  INTERVIEW: styles.stageInterview,
  DECISION: styles.stageDecision,
  OFFER: styles.stageOffer,
};

const STAGE_HEADER_COLORS: Record<Stage, string> = {
  INTRO: styles.stageTextIntro,
  SCREENING: styles.stageTextScreening,
  INTERVIEW: styles.stageTextInterview,
  DECISION: styles.stageTextDecision,
  OFFER: styles.stageTextOffer,
};

const STATUS_VARIANTS: Record<
  string,
  "success" | "warning" | "secondary" | "destructive"
> = {
  PENDING: "warning",
  CONFIRMED: "success",
  COMPLETED: "info" as "success",
  CANCELLED: "destructive",
};

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className={`gradient-button ${styles.avatarBox}`}>
      <span className={styles.avatarText}>{initials}</span>
    </div>
  );
}

export default function KanbanPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myAppts, setMyAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [{ data: u }, { data: appts }] = await Promise.all([
        auth.getProfile(),
        appointments.getMy(),
      ]);
      setUser(u);
      setMyAppts(appts);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const advanceStage = async (appt: Appointment) => {
    const idx = STAGES.indexOf((appt.stage || "INTRO") as Stage);
    if (idx < STAGES.length - 1) {
      await appointments.updateStage(appt.id, STAGES[idx + 1]);
      load();
    }
  };

  if (loading)
    return (
      <div className={styles.loaderPage}>
        <Loader2 className={styles.loaderIcon} />
      </div>
    );

  // Group by stage
  const byStage: Record<Stage, Appointment[]> = {
    INTRO: [],
    SCREENING: [],
    INTERVIEW: [],
    DECISION: [],
    OFFER: [],
  };
  myAppts
    .filter((a) => a.status !== "CANCELLED")
    .forEach((a) => {
      const s = (a.stage || "INTRO") as Stage;
      if (STAGES.includes(s)) byStage[s].push(a);
    });

  return (
    <div className={styles.page}>
      <div className={styles.scrollContainer}>
        <div className={styles.board}>
          {STAGES.map((stage) => (
            <div key={stage} className={styles.column}>
              {/* Column header */}
              <div className={styles.colHeader}>
                <div className={styles.colHeaderLeft}>
                  <span
                    className={`${styles.colTitle} ${STAGE_HEADER_COLORS[stage]}`}
                  >
                    {stage}
                  </span>
                  <span className={styles.colCount}>
                    {byStage[stage].length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className={`${styles.colBody} ${STAGE_COLORS[stage]}`}>
                {byStage[stage].map((appt) => {
                  const roleName = appt.referralPost?.jobRole || "Position";
                  const company = appt.referralPost?.employee?.company?.name;
                  const empName =
                    `${appt.referralPost?.employee?.firstName || ""} ${appt.referralPost?.employee?.lastName || ""}`.trim();
                  const daysAgo = appt.createdAt
                    ? Math.floor(
                        (Date.now() - new Date(appt.createdAt).getTime()) /
                          86400000,
                      )
                    : 0;

                  return (
                    <Card key={appt.id} className={styles.cardItem}>
                      <CardContent className={styles.cardContent}>
                        <div className={styles.cardTop}>
                          <CardTitle className={styles.cardTitle}>
                            {roleName}
                          </CardTitle>
                          <Badge
                            variant={
                              STATUS_VARIANTS[appt.status] || "secondary"
                            }
                            className={styles.badgeSm}
                          >
                            {appt.status}
                          </Badge>
                        </div>
                        {company && (
                          <div className={styles.metaRow}>
                            <Building2 className={styles.metaIcon} />
                            {company}
                          </div>
                        )}
                        {appt.scheduledAt && (
                          <div className={styles.metaRow}>
                            <Calendar className={styles.metaIcon} />
                            {new Date(appt.scheduledAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                        <div className={styles.cardFooter}>
                          <div className={styles.empBox}>
                            <Avatar name={empName || "?"} />
                            <span className={styles.empName}>{empName}</span>
                          </div>
                          <span className={styles.timeAgo}>
                            {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
                          </span>
                        </div>
                        {stage !== "OFFER" && appt.status === "CONFIRMED" && (
                          <Button
                            variant="soft"
                            size="sm"
                            className={styles.advanceBtn}
                            onClick={() => advanceStage(appt)}
                          >
                            Move to {STAGES[STAGES.indexOf(stage) + 1]}
                            <ChevronRight className={styles.chevronSm} />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {byStage[stage].length === 0 && (
                  <div className={styles.emptyCol}>No applications here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
