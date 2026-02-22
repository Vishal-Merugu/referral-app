"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, referrals as referralsApi } from "@/utils/api";
import type { ReferralPost, User } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Briefcase,
  MapPin,
  Clock,
  Plus,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import styles from "./page.module.css";

export default function MyReferralsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<ReferralPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data: userData } = await auth.getProfile();
        if (userData.role !== "EMPLOYEE") {
          router.push("/dashboard");
          return;
        }
        if (mounted) setUser(userData);

        const { data: postsData } = await referralsApi.getMy();
        if (mounted) setPosts(postsData);
      } catch (err) {
        if (mounted) router.push("/login");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className={styles.loaderPage}>
        <div className={styles.loaderSpinner} />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerArea}>
        <div>
          <h1 className={styles.pageTitle}>
            <Briefcase className={styles.titleIcon} />
            My Referrals
          </h1>
          <p className={styles.pageSubtitle}>
            Manage the job referrals you have posted.
          </p>
        </div>
        <Button variant="gradient" size="md" asChild>
          <Link href="/dashboard/my-referrals/create">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {posts.length === 0 && !error ? (
        <div className={styles.emptyState}>
          <Briefcase className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No referrals posted</h3>
          <p className={styles.emptyDesc}>
            You haven&apos;t created any referral opportunities yet. Help
            candidates find their dream jobs and earn potential bonuses.
          </p>
          <Button variant="gradient" size="md" asChild>
            <Link href="/dashboard/my-referrals/create">
              <Plus className="w-4 h-4 mr-2" />
              Create your first post
            </Link>
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {posts.map((post) => (
            <Card key={post.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.role}>{post.jobRole}</h3>
                  <div className={styles.companyLine}>
                    {user?.company?.name || "Unknown Company"}
                    {post.department && ` • ${post.department}`}
                  </div>
                </div>
                <Badge
                  variant={post.status === "ACTIVE" ? "success" : "secondary"}
                >
                  {post.status}
                </Badge>
              </div>

              <div className={styles.badgesRow}>
                <Badge variant="soft">
                  <MapPin className="w-3 h-3 mr-1" />
                  {post.remoteType || "ANY"}
                </Badge>
                <Badge variant="soft">
                  <Clock className="w-3 h-3 mr-1" />
                  {post.experienceLevel || "ANY"}
                </Badge>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.priceBox}>
                  <DollarSign className="w-4 h-4 text-primary" />
                  {Number(post.referralPrice) > 0
                    ? `$${Number(post.referralPrice).toLocaleString()}`
                    : "No Bonus"}
                </div>
                <div>{post.viewCount || 0} views</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
