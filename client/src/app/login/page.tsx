"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, setAuthToken } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Star,
} from "lucide-react";
import styles from "../auth.module.css";

const QUOTE = {
  text: "I got referred to my dream job at Google within 3 weeks. ReferralHub completely changed my job search.",
  author: "Sarah K.",
  role: "Software Engineer @ Google",
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await auth.login(form);
      setAuthToken(data.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── LEFT PANEL ── */}
      <div className={styles.leftPanel}>
        {/* Background */}
        <div className={styles.bgGradient} />
        <div className={styles.bgPattern} />
        <div className={styles.glowOrb} />

        {/* Content */}
        <div className={styles.contentWrapper}>
          <Link href="/" className={styles.logoLayout}>
            <div className={styles.logoBox}>
              <Sparkles className={`${styles.iconLg} ${styles.textWhite}`} />
            </div>
            <span className={styles.logoText}>ReferralHub</span>
          </Link>
        </div>

        <div className={styles.contentBody}>
          <div>
            <h2 className={styles.heroHeading}>
              Your next big
              <br />
              role is one
              <br />
              referral away.
            </h2>
            <p className={styles.heroSubtext}>
              Connect with verified employees at top companies and get referred
              in days, not months.
            </p>
          </div>

          {/* Testimonial card */}
          <div className={styles.testimonialBox}>
            <div className={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={styles.starIcon} />
              ))}
            </div>
            <p className={styles.quoteText}>"{QUOTE.text}"</p>
            <div className={styles.authorBox}>
              <div className={styles.authorAvatar}>SK</div>
              <div>
                <p className={styles.authorName}>{QUOTE.author}</p>
                <p className={styles.authorRole}>{QUOTE.role}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.statsRow}>
          {[
            ["12k+", "Job seekers"],
            ["3.4k+", "Employees"],
            ["94%", "Success rate"],
          ].map(([val, lab]) => (
            <div key={lab}>
              <p className={styles.statValue}>{val}</p>
              <p>{lab}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className={styles.rightPanel}>
        <div className={styles.formBox}>
          {/* Mobile logo */}
          <Link href="/" className={styles.mobileLogo}>
            <div className={styles.mobileLogoBox}>
              <Sparkles className={`${styles.iconSm} ${styles.textWhite}`} />
            </div>
            <span className={`${styles.fontBold} ${styles.textForeground}`}>
              ReferralHub
            </span>
          </Link>

          <div style={{ marginBottom: "2rem" }}>
            <h1 className={styles.formHeading}>Welcome back</h1>
            <p className={styles.formSubtext}>Sign in to your account</p>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formGroupLabel}>Email</label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                icon={<Mail className={styles.iconSm} />}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <div className={styles.formGroupHeader}>
                <label
                  className={styles.formGroupLabel}
                  style={{ marginBottom: 0 }}
                >
                  Password
                </label>
                <a
                  href="#"
                  className={styles.link}
                  style={{ fontSize: "0.75rem", fontWeight: "normal" }}
                >
                  Forgot password?
                </a>
              </div>
              <Input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                icon={<Lock className={styles.iconSm} />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className={styles.passToggle}
                  >
                    {showPass ? (
                      <EyeOff className={styles.iconSm} />
                    ) : (
                      <Eye className={styles.iconSm} />
                    )}
                  </button>
                }
                required
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.loadingWrapper}>
                  <span className={styles.spinner} />
                  Signing in…
                </span>
              ) : (
                <span className={styles.loadingWrapper}>
                  Sign in <ArrowRight className={styles.iconSm} />
                </span>
              )}
            </Button>
          </form>

          <p className={styles.footerText}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className={styles.link}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
