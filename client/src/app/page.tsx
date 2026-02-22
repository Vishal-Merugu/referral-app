"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Star,
  Users,
  TrendingUp,
  Building2,
  CheckCircle,
  ChevronRight,
  Globe,
} from "lucide-react";
import styles from "./page.module.css";

const COMPANIES = [
  "Google",
  "Meta",
  "Apple",
  "Stripe",
  "OpenAI",
  "Figma",
  "Notion",
  "Airbnb",
  "Uber",
  "Netflix",
  "Shopify",
  "Discord",
  "Twitch",
  "GitHub",
  "Vercel",
  "Linear",
  "Loom",
  "Airtable",
  "Asana",
  "Atlassian",
];

const STATS = [
  { value: "12,000+", label: "Job seekers" },
  { value: "3,400+", label: "Verified employees" },
  { value: "850+", label: "Companies" },
  { value: "94%", label: "Referral success rate" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Browse referrals",
    desc: "Search thousands of open referral slots at top companies filtered by role, skills, and work type.",
  },
  {
    step: "02",
    title: "Book an appointment",
    desc: "Schedule a 1:1 meeting with a verified employee who will guide you through the application process.",
  },
  {
    step: "03",
    title: "Get referred & hired",
    desc: "Receive your internal referral, track your pipeline, and land your dream job faster.",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah K.",
    role: "SWE @ Google",
    avatar: "SK",
    text: "Got referred by a Googler in 24 hours. Landed my dream job within 6 weeks. ReferralHub is insane.",
    rating: 5,
  },
  {
    name: "Marcus L.",
    role: "PM @ Meta",
    avatar: "ML",
    text: "As an employee, I love being able to help people and get compensated for quality referrals. 10/10.",
    rating: 5,
  },
  {
    name: "Priya S.",
    role: "Designer @ Figma",
    avatar: "PS",
    text: "The tracked pipeline feature is brilliant. Knew exactly where I stood at every step.",
    rating: 5,
  },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className={styles.container}>
      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.navLogoWrap}>
            <div className={styles.navLogoIcon}>
              <Sparkles className={styles.iconSm} />
            </div>
            <span className={styles.navLogoText}>
              Referral<span className={styles.gradientText}>Hub</span>
            </span>
          </Link>

          <div className={styles.navLinks}>
            {["Browse", "Companies", "Resources", "Pricing"].map((item) => (
              <Link
                href={
                  item === "Browse"
                    ? "/dashboard/browse"
                    : `/${item.toLowerCase()}`
                }
                key={item}
              >
                <Button variant="ghost" size="sm">
                  {item}
                </Button>
              </Link>
            ))}
          </div>

          <div className={styles.navActions}>
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup" className={styles.signUpBtn}>
              <Button variant="gradient" size="sm">
                Get started <ArrowRight className={styles.iconXs} />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.heroSection}>
        <div className={styles.heroGradientBg} />
        <div className={styles.heroOrb} />
        <div className={styles.heroDotPattern} />

        <div className={styles.heroContent}>
          <div className={styles.heroPill}>
            <span className={styles.heroPillDot} />
            <span>Now with AI-powered matching</span>
            <ChevronRight
              className={`${styles.iconXs} ${styles.textPrimary}`}
            />
          </div>

          <h1 className={styles.heroHeading}>
            Get <span className={styles.gradientText}>referred.</span>
            <br />
            Get hired.
          </h1>

          <p className={styles.heroDesc}>
            Connect with verified employees at your dream companies. Book a
            referral appointment and skip the resume black hole.
          </p>

          <div className={styles.heroActions}>
            <Link href="/signup">
              <Button
                variant="gradient"
                size="xl"
                className={styles.ctaActionBtn}
              >
                Start for free <ArrowRight className={styles.iconSm} />
              </Button>
            </Link>
            <Link href="/dashboard/browse">
              <Button variant="glass" size="xl" className={styles.ctaActionBtn}>
                Browse referrals
              </Button>
            </Link>
          </div>

          <p className={styles.heroSocialProof}>
            Trusted by <span className={styles.socialProofBold}>12,000+</span>{" "}
            job seekers at top companies
          </p>
        </div>
      </section>

      {/* ── COMPANY TICKER ── */}
      <section className={styles.tickerSection}>
        <div className={styles.tickerGradientLeft} />
        <div className={styles.tickerGradientRight} />
        <div className={styles.tickerTrack}>
          {[...COMPANIES, ...COMPANIES].map((company, i) => (
            <div key={i} className={styles.tickerItem}>
              <Building2 className={styles.tickerIcon} />
              {company}
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {STATS.map(({ value, label }) => (
            <div key={label} className={styles.statItem}>
              <p className={`${styles.statValue} ${styles.gradientText}`}>
                {value}
              </p>
              <p className={styles.statLabel}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES BENTO GRID ── */}
      <section className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTag}>Features</p>
          <h2 className={styles.sectionTitle}>
            Everything you need
            <br /> to land your job
          </h2>
        </div>

        <div className={styles.bentoGrid}>
          {/* Card 1 */}
          <div className={`${styles.bentoCard} ${styles.card1}`}>
            <div className={`${styles.bentoIconWrap} ${styles.card1Icon}`}>
              <Zap className={styles.iconMd} />
            </div>
            <h3 className={styles.bentoCardTitle}>Instant connections</h3>
            <p className={styles.bentoCardDesc}>
              Connect with verified employees in minutes, not months.
            </p>
          </div>
          {/* Card 2 */}
          <div className={`${styles.bentoCard} ${styles.card2}`}>
            <div className={`${styles.bentoIconWrap} ${styles.card2Icon}`}>
              <Shield className={styles.iconMd} />
            </div>
            <h3 className={styles.bentoCardTitle}>Verified employees</h3>
            <p className={styles.bentoCardDesc}>
              Every referrer is verified at their company. No fakes.
            </p>
          </div>
          {/* Card 3 */}
          <div className={`${styles.bentoCard} ${styles.card3}`}>
            <div className={`${styles.bentoIconWrap} ${styles.card3Icon}`}>
              <Star className={styles.iconMd} />
            </div>
            <h3 className={styles.bentoCardTitle}>Rated referrers</h3>
            <p className={styles.bentoCardDesc}>
              Community reviews help you find the best referrers.
            </p>
          </div>
          {/* Card 4 */}
          <div className={`${styles.bentoCard} ${styles.card4}`}>
            <div className={`${styles.bentoIconWrap} ${styles.card4Icon}`}>
              <TrendingUp className={styles.iconMd} />
            </div>
            <h3 className={styles.bentoCardTitle}>Track progress</h3>
            <p className={styles.bentoCardDesc}>
              Kanban-style pipeline to track your applications.
            </p>
          </div>
          {/* Card 5 */}
          <div className={`${styles.bentoCard} ${styles.card5}`}>
            <div className={`${styles.bentoIconWrap} ${styles.card5Icon}`}>
              <Users className={styles.iconMd} />
            </div>
            <h3 className={styles.bentoCardTitle}>In-app messaging</h3>
            <p className={styles.bentoCardDesc}>
              Chat directly with referrers after booking.
            </p>
          </div>
          {/* Card 6 */}
          <div className={`${styles.bentoCard} ${styles.card6}`}>
            <div className={`${styles.bentoIconWrap} ${styles.card6Icon}`}>
              <Globe className={styles.iconMd} />
            </div>
            <h3 className={styles.bentoCardTitle}>Remote-first</h3>
            <p className={styles.bentoCardDesc}>
              Filter by remote, hybrid, or on-site opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTag}>Process</p>
          <h2 className={styles.sectionTitle}>
            Three steps to
            <br /> your next role
          </h2>
        </div>
        <div className={styles.processGrid}>
          <div className={styles.processLine} />

          {HOW_IT_WORKS.map(({ step, title, desc }) => (
            <div key={step} className={styles.processCard}>
              <div className={styles.processNumber}>
                <span className={styles.processNumberText}>{step}</span>
              </div>
              <h3 className={styles.processTitle}>{title}</h3>
              <p className={styles.processDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTag}>Reviews</p>
          <h2 className={styles.sectionTitle}>Loved by thousands</h2>
        </div>
        <div className={styles.testiGrid}>
          {TESTIMONIALS.map(({ name, role, avatar, text, rating }) => (
            <div key={name} className={styles.testiCard}>
              <div className={styles.testiStars}>
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className={styles.testiStar} />
                ))}
              </div>
              <p className={styles.testiText}>"{text}"</p>
              <div className={styles.testiAuthor}>
                <div className={styles.testiAvatar}>
                  <span className={styles.testiAvatarText}>{avatar}</span>
                </div>
                <div>
                  <p className={styles.testiName}>{name}</p>
                  <p className={styles.testiRole}>{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaContainer}>
        <div className={styles.ctaBorder}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaOrbWrap}>
              <div className={styles.ctaOrb} />
            </div>
            <div className={styles.relativeZ10}>
              <h2 className={styles.ctaHeading}>
                Ready to get
                <br />
                <span className={styles.gradientText}>referred?</span>
              </h2>
              <p className={styles.ctaDesc}>
                Join 12,000+ job seekers who found their dream roles through
                employee referrals.
              </p>
              <div className={styles.ctaActions}>
                <Link href="/signup">
                  <Button
                    variant="gradient"
                    size="xl"
                    className={styles.ctaActionBtn}
                  >
                    Create free account <ArrowRight className={styles.iconSm} />
                  </Button>
                </Link>
                <Link href="/dashboard/browse">
                  <Button
                    variant="glass"
                    size="xl"
                    className={styles.ctaActionBtn}
                  >
                    Explore referrals
                  </Button>
                </Link>
              </div>
              <div className={styles.ctaChecks}>
                <span className={styles.ctaCheckWrap}>
                  <CheckCircle className={styles.ctaCheckIcon} />
                  Free to sign up
                </span>
                <span className={styles.ctaCheckWrap}>
                  <CheckCircle className={styles.ctaCheckIcon} />
                  No credit card
                </span>
                <span className={styles.ctaCheckWrap}>
                  <CheckCircle className={styles.ctaCheckIcon} />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <div className={styles.footerLogoIcon}>
              <Sparkles className={styles.footerLogoIconSvg} />
            </div>
            <span className={styles.footerLogoText}>ReferralHub</span>
          </div>
          <p className={styles.footerCopyright}>
            © 2025 ReferralHub. All rights reserved.
          </p>
          <div className={styles.footerLinks}>
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className={styles.footerLink}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
