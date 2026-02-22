"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, referrals, appointments, companies } from "@/utils/api";
import type { User, ReferralPost, Appointment, Company } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  SlidersHorizontal,
  BookmarkCheck,
  Bookmark,
  Clock,
  DollarSign,
  Search,
  MapPin,
  Building2,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

import { BookingModal } from "@/components/BookingModal";
import styles from "./page.module.css";

type RemoteType = "REMOTE" | "HYBRID" | "ONSITE";

const REMOTE_LABELS: Record<RemoteType, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
};

const REMOTE_COLORS: Record<RemoteType, "success" | "warning" | "secondary"> = {
  REMOTE: "success",
  HYBRID: "warning",
  ONSITE: "secondary",
};

const POPULAR_SKILLS = [
  "Python",
  "TypeScript",
  "React",
  "Node.js",
  "Go",
  "Rust",
  "AWS",
  "Kubernetes",
  "Machine Learning",
  "Data Science",
  "Product Management",
  "Design",
  "iOS",
  "Android",
];

const EXP_LEVELS = [
  "0-1 years",
  "1-3 years",
  "3-5 years",
  "5-8 years",
  "8+ years",
];

interface ExtendedReferralPost extends ReferralPost {
  skills?: string[];
  remoteType?: RemoteType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  viewCount?: number;
  savedBy?: { id: string }[];
  employee?: ReferralPost["employee"] & {
    id?: string;
    isVerified?: boolean;
    avatarUrl?: string | null;
    reviewsReceived?: { rating: number }[];
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const cls = size === "sm" ? styles.avatarSmImg : styles.avatarMdImg;
  const initCls =
    size === "sm" ? styles.avatarSmInitials : styles.avatarMdInitials;
  if (src) return <img src={src} alt={name} className={cls} />;
  return (
    <div className={`gradient-button ${initCls}`}>
      <span className={styles.avatarText}>{initials || "?"}</span>
    </div>
  );
}

function AvgRating({ reviews }: { reviews?: { rating: number }[] }) {
  if (!reviews || reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <span className={styles.ratingRow}>
      <Star className={styles.ratingIcon} />
      {avg.toFixed(1)}
      <span className={styles.ratingCount}>({reviews.length})</span>
    </span>
  );
}

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [allReferrals, setAllReferrals] = useState<ExtendedReferralPost[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Pending form filters
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [companyId, setCompanyId] = useState("");
  const [experienceLevel, setExperienceLevel] = useState(
    searchParams.get("experienceLevel") || "",
  );
  const [remoteType, setRemoteType] = useState<RemoteType | "">(
    (searchParams.get("remoteType") as RemoteType) || "",
  );
  const [skills, setSkills] = useState<string[]>(
    searchParams.getAll("skills").length > 0
      ? searchParams.getAll("skills")
      : searchParams.get("skill")
        ? [searchParams.get("skill")!]
        : [],
  );
  const [page, setPage] = useState(1);

  // Active/Applied filters
  const [appliedFilters, setAppliedFilters] = useState<{
    search: string;
    companyId: string;
    experienceLevel: string;
    remoteType: RemoteType | "";
    skills: string[];
  }>({
    search: searchParams.get("q") || "",
    companyId: "",
    experienceLevel: searchParams.get("experienceLevel") || "",
    remoteType: (searchParams.get("remoteType") as RemoteType) || "",
    skills:
      searchParams.getAll("skills").length > 0
        ? searchParams.getAll("skills")
        : searchParams.get("skill")
          ? [searchParams.get("skill")!]
          : [],
  });

  // Booking
  const [bookingPost, setBookingPost] = useState<ExtendedReferralPost | null>(
    null,
  );

  const hasFetched = useRef(false);

  const fetchData = async (p = 1, filtersToApply = appliedFilters) => {
    setFetching(true);
    try {
      const { data: userData } = await auth.getProfile();
      setUser(userData);

      const [refsRes, apptsRes, companiesRes] = await Promise.all([
        referrals.getAll({
          search: filtersToApply.search,
          companyId: filtersToApply.companyId,
          experienceLevel: filtersToApply.experienceLevel,
          remoteType: filtersToApply.remoteType || undefined,
          skills: filtersToApply.skills.join(","),
          page: p,
          limit: 12,
        }),
        referrals.getSaved(),
        companies.list(),
      ]);

      setAllReferrals(refsRes.data.referrals || refsRes.data);
      setPagination(refsRes.data.pagination || null);
      setSavedIds(
        new Set((refsRes.data.saved || []).map((r: { id: string }) => r.id)),
      );

      const saved: ExtendedReferralPost[] = Array.isArray(apptsRes.data)
        ? apptsRes.data
        : [];
      setSavedIds(new Set(saved.map((r) => r.id)));

      const myAppts = await appointments.getMy();
      setMyAppointments(myAppts.data);
      setCompaniesList(companiesRes.data || []);
    } catch {
      router.push("/login?redirect=/dashboard/browse");
    } finally {
      setInitialLoading(false);
      setFetching(false);
    }
  };

  // Initial load only
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchData(1, appliedFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    const newFilters = {
      search,
      companyId,
      experienceLevel,
      remoteType,
      skills,
    };
    setAppliedFilters(newFilters);
    setPage(1);
    fetchData(1, newFilters);
  };

  const removeFilter = (key: keyof typeof appliedFilters) => {
    if (key === "search") setSearch("");
    if (key === "companyId") setCompanyId("");
    if (key === "experienceLevel") setExperienceLevel("");
    if (key === "remoteType") setRemoteType("");
    if (key === "skills") setSkills([]);

    const newFilters = { ...appliedFilters, [key]: key === "skills" ? [] : "" };
    setAppliedFilters(newFilters);
    setPage(1);
    fetchData(1, newFilters);
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
    const newFilters = {
      ...appliedFilters,
      skills: appliedFilters.skills.filter((s) => s !== skillToRemove),
    };
    setAppliedFilters(newFilters);
    setPage(1);
    fetchData(1, newFilters);
  };

  const handleSave = async (id: string) => {
    if (savedIds.has(id)) {
      await referrals.unsave(id);
      setSavedIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    } else {
      await referrals.save(id);
      setSavedIds((prev) => new Set([...prev, id]));
    }
  };

  const isBooked = (refId: string) =>
    myAppointments.some(
      (a) => a.referralPostId === refId && a.status !== "CANCELLED",
    );

  const hasUnappliedChanges =
    search !== appliedFilters.search ||
    companyId !== appliedFilters.companyId ||
    experienceLevel !== appliedFilters.experienceLevel ||
    remoteType !== appliedFilters.remoteType ||
    skills.join(",") !== appliedFilters.skills.join(",");

  if (initialLoading) {
    return (
      <div className={styles.minScreenCenter}>
        <Loader2 className={styles.spinnerLg} />
      </div>
    );
  }

  return (
    <>
      <div className={styles.mainContainer}>
        <div className={styles.layoutRow}>
          {/* Sidebar Filters */}
          <aside className={styles.sidebar}>
            <Card className={styles.filterCard}>
              <CardContent className={styles.cardContentNoPad}>
                <div>
                  <p className={styles.filterHeader}>Search</p>
                  <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <Input
                      placeholder="Role, skill, company..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>
                </div>

                <div>
                  <p className={styles.filterHeader}>Company</p>
                  <Select
                    value={companyId}
                    onChange={setCompanyId}
                    placeholder="All companies"
                    options={[
                      { value: "", label: "All companies" },
                      ...companiesList.map((c) => ({
                        value: c.id,
                        label: c.name,
                      })),
                    ]}
                  />
                </div>

                <div>
                  <p className={styles.filterHeader}>Work type</p>
                  <Select
                    value={remoteType}
                    onChange={(v) => setRemoteType(v as RemoteType | "")}
                    placeholder="All types"
                    options={[
                      { value: "", label: "🌐 All types" },
                      { value: "REMOTE", label: "🌍 Remote" },
                      { value: "HYBRID", label: "🏢 Hybrid" },
                      { value: "ONSITE", label: "📍 On-site" },
                    ]}
                  />
                </div>

                <div>
                  <p className={styles.filterHeader}>Experience</p>
                  <Select
                    value={experienceLevel}
                    onChange={setExperienceLevel}
                    placeholder="Any level"
                    options={[
                      { value: "", label: "Any level" },
                      ...EXP_LEVELS.map((lvl) => ({ value: lvl, label: lvl })),
                    ]}
                  />
                </div>

                <div>
                  <p className={styles.filterHeader}>Skills</p>
                  <div className={styles.skillsWrap}>
                    {POPULAR_SKILLS.map((s) => {
                      const isActive = skills.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => {
                            if (isActive) {
                              setSkills(skills.filter((skill) => skill !== s));
                            } else {
                              setSkills([...skills, s]);
                            }
                          }}
                          className={`${styles.skillPill} ${isActive ? styles.skillPillActive : ""}`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(search ||
                  companyId ||
                  remoteType ||
                  experienceLevel ||
                  skills.length > 0) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={styles.clearFilterBtn}
                    onClick={() => {
                      setSearch("");
                      setCompanyId("");
                      setRemoteType("");
                      setExperienceLevel("");
                      setSkills([]);

                      const emptyFilters = {
                        search: "",
                        companyId: "",
                        remoteType: "" as RemoteType | "",
                        experienceLevel: "",
                        skills: [],
                      };
                      setAppliedFilters(emptyFilters);
                      fetchData(1, emptyFilters);
                    }}
                  >
                    <X className={styles.iconXs} />
                    Clear filters
                  </Button>
                )}

                <Button
                  variant="gradient"
                  size="sm"
                  className={styles.applyBtn}
                  onClick={applyFilters}
                  disabled={fetching || !hasUnappliedChanges}
                >
                  {fetching ? (
                    <Loader2
                      className={`${styles.iconXs} ${styles.spinnerSm}`}
                    />
                  ) : (
                    <Search className={styles.iconXs} />
                  )}
                  Apply Filters
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main content */}
          <div className={styles.mainCol}>
            {/* Mobile filter bar */}
            <div className={styles.mobileFilterRow}>
              <div className={styles.relativeFlex1}>
                <Search className={styles.mobileSearchIcon} />
                <Input
                  placeholder="Search referrals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.mobileSearchInput}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={styles.mobileFilterBtn}
              >
                <SlidersHorizontal className={styles.iconSm} />
              </Button>
            </div>

            {/* Active filter chips */}
            {(appliedFilters.remoteType ||
              appliedFilters.experienceLevel ||
              appliedFilters.skills.length > 0 ||
              appliedFilters.companyId) && (
              <div className={styles.activeFiltersRow}>
                {appliedFilters.remoteType && (
                  <Badge variant="info" className={styles.badgeGap}>
                    {REMOTE_LABELS[appliedFilters.remoteType]}
                    <button onClick={() => removeFilter("remoteType")}>
                      <X className={styles.iconXs} />
                    </button>
                  </Badge>
                )}
                {appliedFilters.experienceLevel && (
                  <Badge variant="secondary" className={styles.badgeGap}>
                    {appliedFilters.experienceLevel}
                    <button onClick={() => removeFilter("experienceLevel")}>
                      <X className={styles.iconXs} />
                    </button>
                  </Badge>
                )}
                {appliedFilters.skills.map((s) => (
                  <Badge key={s} variant="default" className={styles.badgeGap}>
                    {s}
                    <button onClick={() => removeSkill(s)}>
                      <X className={styles.iconXs} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {fetching ? (
              <div className={styles.minScreenCenter}>
                <Loader2 className={styles.spinnerLg} />
              </div>
            ) : allReferrals.length === 0 ? (
              <Card className={styles.emptyStateCard}>
                <CardContent>
                  <Search className={styles.emptyStateIcon} />
                  <h3 className={styles.emptyStateTitle}>No referrals found</h3>
                  <p className={styles.emptyStateDesc}>
                    Try adjusting your filters or searching for something else.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className={styles.gridCards}>
                  {allReferrals.map((ref) => {
                    const booked = isBooked(ref.id);
                    const saved = savedIds.has(ref.id);
                    const avgRating = ref.employee?.reviewsReceived;
                    const empName =
                      `${ref.employee?.firstName || ""} ${ref.employee?.lastName || ""}`.trim();

                    return (
                      <Card key={ref.id} className={styles.refCard}>
                        <CardHeader className={styles.refCardHeader}>
                          <div className={styles.refTitleRow}>
                            <div className={styles.flex1}>
                              <CardTitle className={styles.refRole}>
                                {ref.jobRole}
                              </CardTitle>
                              <div className={styles.refCompanyRow}>
                                <Building2 className={styles.refCompanyIcon} />
                                <CardDescription className={styles.refCompany}>
                                  {ref.employee?.company?.name || "Company"}
                                </CardDescription>
                              </div>
                            </div>
                            <button
                              onClick={() => user && handleSave(ref.id)}
                              className={styles.saveBtn}
                            >
                              {saved ? (
                                <BookmarkCheck
                                  className={`${styles.iconSm} ${styles.textPrimary}`}
                                />
                              ) : (
                                <Bookmark
                                  className={`${styles.iconSm} ${styles.textSubtle}`}
                                />
                              )}
                            </button>
                          </div>
                        </CardHeader>

                        <CardContent className={styles.cardContentList}>
                          <p className={styles.refDesc}>{ref.description}</p>

                          {/* Meta chips */}
                          <div className={styles.refMetaRow}>
                            {ref.remoteType && (
                              <Badge
                                variant={REMOTE_COLORS[ref.remoteType]}
                                className={styles.badgeSm}
                              >
                                <MapPin className={styles.iconMicro} />
                                {REMOTE_LABELS[ref.remoteType]}
                              </Badge>
                            )}
                            <Badge
                              variant="secondary"
                              className={styles.badgeSm}
                            >
                              <Clock className={styles.iconMicro} />
                              {ref.experienceLevel}
                            </Badge>
                            {ref.salaryMin && (
                              <Badge
                                variant="purple"
                                className={styles.badgeSm}
                              >
                                <DollarSign className={styles.iconMicro} />
                                {Math.round(ref.salaryMin / 1000)}k
                                {ref.salaryMax
                                  ? `–${Math.round(ref.salaryMax / 1000)}k`
                                  : "+"}
                              </Badge>
                            )}
                          </div>

                          {/* Skills */}
                          {ref.skills && ref.skills.length > 0 && (
                            <div className={styles.refSkillsRow}>
                              {ref.skills.slice(0, 4).map((s) => (
                                <span key={s} className={styles.skillBadge}>
                                  {s}
                                </span>
                              ))}
                              {ref.skills.length > 4 && (
                                <span className={styles.skillExtra}>
                                  +{ref.skills.length - 4}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Employee */}
                          <div className={styles.refEmpRow}>
                            <div className={styles.refEmpLeft}>
                              <Avatar
                                name={empName}
                                src={ref.employee?.avatarUrl}
                                size="sm"
                              />
                              <div className={styles.flex1MinW0}>
                                <div className={styles.refEmpNameRow}>
                                  <p className={styles.refEmpName}>{empName}</p>
                                  {ref.employee?.isVerified && (
                                    <span className={styles.refVerify}>✓</span>
                                  )}
                                </div>
                                <AvgRating reviews={avgRating} />
                              </div>
                            </div>
                            {Number(ref.referralPrice) > 0 && (
                              <Badge variant="info" className={styles.badgeSm}>
                                ${ref.referralPrice}
                              </Badge>
                            )}
                          </div>
                        </CardContent>

                        <CardFooter className={styles.footerActions}>
                          {booked ? (
                            <div className={styles.fullWCenter}>
                              <Badge
                                variant="success"
                                className={styles.mxAuto}
                              >
                                ✓ Appointment booked
                              </Badge>
                            </div>
                          ) : (
                            <Button
                              variant="gradient"
                              size="sm"
                              className={styles.fullWShadow}
                              onClick={() => {
                                setBookingPost(ref);
                              }}
                            >
                              <Calendar
                                className={styles.iconXs}
                                style={{ marginRight: "0.375rem" }}
                              />
                              Book appointment
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className={styles.paginationRow}>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => {
                        setPage((p) => p - 1);
                        fetchData(page - 1);
                      }}
                    >
                      <ChevronLeft
                        className={styles.iconSm}
                        style={{ marginRight: "0.25rem" }}
                      />
                      Prev
                    </Button>
                    <span className={styles.textForeMuted}>
                      Page {page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasMore}
                      onClick={() => {
                        setPage((p) => p + 1);
                        fetchData(page + 1);
                      }}
                    >
                      Next
                      <ChevronRight
                        className={styles.iconSm}
                        style={{ marginLeft: "0.25rem" }}
                      />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Book Modal */}
      {bookingPost && bookingPost.employee?.id && (
        <BookingModal
          isOpen={!!bookingPost}
          onClose={() => setBookingPost(null)}
          referralPostId={bookingPost.id}
          employeeId={bookingPost.employee!.id!}
          employeeName={`${bookingPost.employee!.firstName || ""} ${bookingPost.employee!.lastName || ""}`.trim()}
          onSuccess={() => fetchData(page)}
        />
      )}
    </>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className={styles.pageLoader}>
          <Loader2 className={styles.iconLg} />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
