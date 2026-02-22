"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { referrals as referralsApi } from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Briefcase, AlertCircle, Loader2 } from "lucide-react";
import styles from "./page.module.css";

const POPULAR_SKILLS = [
  "React",
  "Node.js",
  "TypeScript",
  "Python",
  "Go",
  "Java",
  "C++",
  "AWS",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "GraphQL",
];

export default function CreateReferralPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    jobRole: "",
    department: "",
    experienceLevel: "MID",
    remoteType: "REMOTE" as "REMOTE" | "HYBRID" | "ONSITE",
    description: "",
    referralPrice: 0,
    salaryMin: 0,
    salaryMax: 0,
    skills: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jobRole || !form.description) {
      setError("Job role and description are required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await referralsApi.create({
        ...form,
        referralPrice: form.referralPrice || 0,
        salaryMin: form.salaryMin || 0,
        salaryMax: form.salaryMax || 0,
      });
      router.push("/dashboard/my-referrals");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Failed to create referral post. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    if (form.skills.includes(skill)) {
      setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
    } else {
      if (form.skills.length >= 5) return;
      setForm({ ...form, skills: [...form.skills, skill] });
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <Briefcase className={styles.titleIcon} />
          <h1 className={styles.titleText}>New Referral Post</h1>
        </div>
        <p className={styles.subtitle}>
          Create a public referral post for an open role at your company to
          invite candidate applications.
        </p>
      </div>

      <div className={styles.formCard}>
        {error && (
          <div className={styles.errorBox}>
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basics */}
          <div className={styles.fieldset}>
            <div className={styles.fieldRow}>
              <div>
                <label className={styles.label}>Job Title *</label>
                <Input
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={form.jobRole}
                  onChange={(e) =>
                    setForm({ ...form, jobRole: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={styles.label}>Department</label>
                <Input
                  placeholder="e.g. Product Engineering"
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Level & Location */}
          <div className={styles.fieldset}>
            <div className={styles.fieldRow}>
              <div>
                <label className={styles.label}>Experience Level</label>
                <select
                  className={styles.select}
                  value={form.experienceLevel}
                  onChange={(e) =>
                    setForm({ ...form, experienceLevel: e.target.value })
                  }
                >
                  <option value="JUNIOR">Junior (1-3 yrs)</option>
                  <option value="MID">Mid-Level (3-5 yrs)</option>
                  <option value="SENIOR">Senior (5-8 yrs)</option>
                  <option value="STAFF">Staff / Principal (8+ yrs)</option>
                </select>
              </div>
              <div>
                <label className={styles.label}>Work Type</label>
                <select
                  className={styles.select}
                  value={form.remoteType}
                  onChange={(e) =>
                    setForm({ ...form, remoteType: e.target.value as any })
                  }
                >
                  <option value="REMOTE">Fully Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-site</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={styles.fieldset}>
            <label className={styles.label}>Role Description *</label>
            <textarea
              required
              className={styles.textarea}
              placeholder="Describe the responsibilities, what the candidate will be working on, and why they should join..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* Compensation */}
          <div className={styles.fieldset}>
            <div className={styles.fieldRow}>
              <div>
                <label className={styles.label}>
                  Referral Bonus (if candidate is hired)
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="$"
                  value={form.referralPrice || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      referralPrice: parseInt(e.target.value, 10),
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className={styles.fieldset}>
            <label className={styles.label}>Core Skills Needed (Max 5)</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {POPULAR_SKILLS.map((skill) => {
                const isSelected = form.skills.includes(skill);
                const disabled = !isSelected && form.skills.length >= 5;
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    disabled={disabled}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors
                      ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground-muted border-border hover:border-primary/50"
                      }
                      ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.actions}>
            <Button variant="ghost" type="button" asChild>
              <Link href="/dashboard/my-referrals">Cancel</Link>
            </Button>
            <Button variant="gradient" type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Publish Post
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
