"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, ai as aiApi } from "@/utils/api";
import type { User } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import styles from "./page.module.css";

export default function MatchPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [resumeText, setResume] = useState("");
  const [step, setStep] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState("");
  const [parsing, setParsing] = useState(false);

  const textRef = useRef<HTMLTextAreaElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    auth
      .getProfile()
      .then(({ data }) => setUser(data))
      .catch(() => router.push("/login"));
  }, [router]);

  const handleFile = async (file: File) => {
    setParsing(true);
    setError("");
    try {
      const name = file.name.toLowerCase();

      if (name.endsWith(".pdf")) {
        // Dynamic import to avoid SSR issues
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text +=
            content.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" ") + "\n";
        }
        setResume(text.trim());
      } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setResume(result.value.trim());
      } else {
        // Plain text / markdown
        const text = await file.text();
        setResume(text);
      }
    } catch (err) {
      setError(
        "Failed to parse file. Try copying and pasting your resume text instead.",
      );
      console.error(err);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const runMatch = async () => {
    if (resumeText.trim().length < 50) {
      setError("Please paste at least 50 characters of your resume.");
      return;
    }
    setError("");
    setStep("loading");

    try {
      // The API returns extracted filters: { role, experienceLevel, skills, remoteType }
      const { data } = await aiApi.match(resumeText);

      const searchParams = new URLSearchParams();

      if (data.role) searchParams.set("q", data.role);
      if (data.experienceLevel)
        searchParams.set("experienceLevel", data.experienceLevel);
      if (data.remoteType) searchParams.set("remoteType", data.remoteType);

      if (data.skills && Array.isArray(data.skills)) {
        data.skills.forEach((skill: string) =>
          searchParams.append("skills", skill),
        );
      }

      // Redirect immediately to the browse page with the filters applied
      router.push("/dashboard/browse?" + searchParams.toString());
    } catch {
      setError(
        "Model extraction failed. Make sure the server is running and the API key is active.",
      );
      setStep("idle");
    }
  };

  return (
    <div className={styles.container}>
      <p className={styles.subHeading}>
        Upload your resume and the AI will analyze your skillset, seniority, and
        preferences to find the perfect job matches for you.
      </p>

      {/* ── Upload step ── */}
      <div className={styles.stepWrap}>
        {/* Drop zone */}
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className={styles.dropZone}
        >
          <Upload className={styles.dropIcon} />
          {parsing ? (
            <>
              <p className={styles.dropTitle}>
                <Loader2
                  className={styles.spinnerSm}
                  style={{ display: "inline", marginRight: "0.375rem" }}
                />
                Extracting text…
              </p>
              <p className={styles.dropSub}>Please wait</p>
            </>
          ) : (
            <>
              <p className={styles.dropTitle}>Drop your resume here</p>
              <p className={styles.dropSub}>
                PDF, DOCX, DOC, TXT, MD · or click to browse
              </p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className={styles.hidden}
            onChange={(e) =>
              e.target.files?.[0] && handleFile(e.target.files[0])
            }
          />
        </div>

        <div className={styles.orDivider}>— or paste directly —</div>

        <textarea
          ref={textRef}
          value={resumeText}
          onChange={(e) => setResume(e.target.value)}
          rows={10}
          placeholder={
            "Paste your resume here...\n\nInclude your skills, experience, and the roles you're targeting for best results."
          }
          className={styles.textArea}
          disabled={step === "loading"}
        />

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle className={styles.errorIcon} /> {error}
          </div>
        )}

        <div className={styles.submitRow}>
          <Button
            variant="gradient"
            size="md"
            className={styles.submitBtn}
            onClick={runMatch}
            disabled={step === "loading"}
          >
            {step === "loading" ? (
              <>
                <Loader2 className={styles.spinnerSm} /> Analyzing profile…
              </>
            ) : (
              <>
                <Sparkles className={styles.iconSm} /> Analyze & Find Matches
              </>
            )}
          </Button>
          {resumeText && (
            <span className={styles.charCount}>
              {resumeText.length} chars ·{" "}
              {resumeText.split(/\s+/).filter(Boolean).length} words
            </span>
          )}
        </div>

        {step === "loading" && (
          <div className={styles.loadingBox}>
            {[
              "Reading resume content",
              "Extracting your core skills",
              "Determining seniority level",
              "Finding the best role match...",
            ].map((s, i) => (
              <div key={s} className={styles.loadingRow}>
                {i < 3 ? (
                  <CheckCircle
                    className={styles.loadingIconDone}
                    style={{ animationDelay: `${i * 0.4}s` }}
                  />
                ) : (
                  <Loader2 className={styles.loadingIconActive} />
                )}
                <span
                  className={
                    i < 3 ? styles.loadingTextDone : styles.loadingTextActive
                  }
                  style={{
                    animation:
                      i < 3
                        ? `fadeIn 0.3s ease-out ${i * 0.4}s forwards`
                        : "none",
                    opacity: i < 3 ? 0 : 1,
                  }}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
