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
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Briefcase,
  Users,
} from "lucide-react";
import styles from "../auth.module.css";

const ROLE_OPTIONS = [
  {
    value: "SEEKER",
    icon: <Users className={styles.iconMd} />,
    label: "Job Seeker",
    desc: "I'm looking for referrals to top companies",
    gradient: "from-violet-500/20 to-indigo-500/10",
    border: "border-violet-500/30",
    check: "bg-violet-500",
  },
  {
    value: "EMPLOYEE",
    icon: <Briefcase className={styles.iconMd} />,
    label: "Employee",
    desc: "I work at a company and want to refer candidates",
    gradient: "from-cyan-500/20 to-teal-500/10",
    border: "border-cyan-500/30",
    check: "bg-cyan-500",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "SEEKER" | "EMPLOYEE";
  }>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "SEEKER",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await auth.signup(form);
      setAuthToken(data.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── LEFT PANEL ── */}
      <div className={styles.leftPanel}>
        <div className={styles.bgGradient} />
        <div className={styles.bgPattern} />
        <div className={styles.glowOrb} />

        <div className={styles.contentWrapper}>
          <Link href="/" className={styles.logoLayout}>
            <div className={styles.logoBox}>
              <Sparkles className={`${styles.iconLg} ${styles.textWhite}`} />
            </div>
            <span className={styles.logoText}>ReferralHub</span>
          </Link>
        </div>

        <div className={styles.contentBody}>
          <h2 className={styles.heroHeading}>
            Join 12,000+
            <br />
            job seekers who
            <br />
            found their role.
          </h2>
          {/* Progress steps */}
          <div className={styles.stepsContainer}>
            {[
              { n: "1", t: "Create account", d: "Name, email & password" },
              { n: "2", t: "Choose your role", d: "Job seeker or employee" },
            ].map(({ n, t, d }, i) => (
              <div
                key={n}
                className={`${styles.stepRow} ${step >= i + 1 ? styles.opacity100 : styles.opacity40}`}
              >
                <div
                  className={`${styles.stepCircle} ${step > i + 1 ? styles.stepCircleActive : step === i + 1 ? styles.stepCircleCurrent : styles.stepCirclePending}`}
                >
                  {step > i + 1 ? "✓" : n}
                </div>
                <div>
                  <p className={styles.stepTitle}>{t}</p>
                  <p className={styles.stepDesc}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.statsRow}>
          {[
            ["Free", "Always"],
            ["5 min", "Setup time"],
            ["✓", "No credit card"],
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
          <Link href="/" className={styles.mobileLogo}>
            <div className={styles.mobileLogoBox}>
              <Sparkles className={`${styles.iconSm} ${styles.textWhite}`} />
            </div>
            <span className={`${styles.fontBold} ${styles.textForeground}`}>
              ReferralHub
            </span>
          </Link>

          {/* Mobile progress */}
          <div className={styles.mobileProgress}>
            {[1, 2].map((n) => (
              <div
                key={n}
                className={`${styles.mobileProgressSegment} ${step >= n ? styles.mobileProgressSegmentActive : ""}`}
              />
            ))}
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <h1 className={styles.formHeading}>
              {step === 1 ? "Create account" : "Choose your role"}
            </h1>
            <p className={styles.formSubtext}>
              {step === 1
                ? "Start for free, no credit card needed"
                : "How do you plan to use ReferralHub?"}
            </p>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.flexCol}>
            {step === 1 ? (
              <>
                <div className={styles.formGroupGrid}>
                  <div>
                    <label className={styles.formGroupLabel}>First name</label>
                    <Input
                      placeholder="John"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm({ ...form, firstName: e.target.value })
                      }
                      icon={<User className={styles.iconSm} />}
                      required
                    />
                  </div>
                  <div>
                    <label className={styles.formGroupLabel}>Last name</label>
                    <Input
                      placeholder="Smith"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formGroupLabel}>Email</label>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    icon={<Mail className={styles.iconSm} />}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formGroupLabel}>Password</label>
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
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
                    minLength={8}
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
                      Continuing...
                    </span>
                  ) : (
                    <>
                      Continue <ArrowRight className={styles.iconSm} />
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className={styles.roleSelector}>
                  {ROLE_OPTIONS.map(({ value, icon, label, desc }) => {
                    const isSelected = form.role === value;
                    const roleClass =
                      value === "SEEKER"
                        ? styles.roleOptionSeeker
                        : styles.roleOptionEmployee;
                    const checkClass =
                      value === "SEEKER"
                        ? styles.roleCheckSeeker
                        : styles.roleCheckEmployee;
                    const iconClass =
                      value === "SEEKER"
                        ? styles.roleIconSeeker
                        : styles.roleIconEmployee;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            role: value as "SEEKER" | "EMPLOYEE",
                          })
                        }
                        className={`${styles.roleOption} ${isSelected ? `${styles.roleOptionSelected} ${roleClass}` : ""}`}
                      >
                        <div className={styles.roleOptionFlex}>
                          <div
                            className={`${styles.roleIconBox} ${isSelected ? `${styles.roleIconBoxSelected} ${iconClass}` : ""}`}
                          >
                            {icon}
                          </div>
                          <div className={styles.roleContent}>
                            <div className={styles.roleHeader}>
                              <p className={styles.roleLabel}>{label}</p>
                              <div
                                className={`${styles.roleCheckCircle} ${isSelected ? `${styles.roleCheckCircleSelected} ${checkClass}` : ""}`}
                              >
                                {isSelected && (
                                  <div className={styles.roleCheckInner} />
                                )}
                              </div>
                            </div>
                            <p className={styles.roleDesc}>{desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
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
                      Creating account…
                    </span>
                  ) : (
                    <span className={styles.loadingWrapper}>
                      Create account <ArrowRight className={styles.iconSm} />
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={styles.submitBtn}
                  style={{ boxShadow: "none", marginTop: 0 }}
                  onClick={() => setStep(1)}
                >
                  ← Back
                </Button>
              </>
            )}
          </form>

          <p className={styles.footerText}>
            Already have an account?{" "}
            <Link href="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
