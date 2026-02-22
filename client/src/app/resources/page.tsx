"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resources as resourcesApi, auth } from "@/utils/api";
import type { Resource } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowLeft,
  Plus,
  ThumbsUp,
  Search,
  BookOpen,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const CATEGORIES = [
  "All",
  "Interview Tips",
  "Resume",
  "Salary Negotiation",
  "Coding",
  "System Design",
  "Behavioral",
  "Company Culture",
];

export default function ResourcesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "Interview Tips",
  });
  const [isAuthed, setIsAuthed] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async (cat = category) => {
    setLoading(true);
    try {
      const res = await resourcesApi.list({
        category: cat === "All" ? undefined : cat,
      });
      setItems(res.data.resources || []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    auth
      .getProfile()
      .then(() => setIsAuthed(true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load(category);
  }, [category]);

  const filtered = items.filter(
    (r) =>
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resourcesApi.create(form);
      setShowCreate(false);
      setForm({ title: "", content: "", category: "Interview Tips" });
      load();
    } catch {
      alert("Failed to create resource");
    }
  };

  const handleUpvote = async (id: string) => {
    await resourcesApi.upvote(id);
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r)),
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="glass border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="w-8 h-8 rounded-xl gradient-button flex items-center justify-center shadow-primary">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </Link>
            <span className="font-bold text-foreground">Resources</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthed && (
              <Button
                variant="gradient"
                size="sm"
                className="shadow-primary"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Contribute
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Interview Resources
          </h1>
          <p className="text-foreground-muted mt-2 max-w-lg mx-auto">
            Community-curated tips, guides and resources to ace your job hunt.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${category === c ? "bg-primary text-white" : "bg-surface border border-border text-foreground-muted hover:border-primary hover:text-primary"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-20 border-dashed">
            <CardContent>
              <BookOpen className="w-12 h-12 mx-auto text-foreground-subtle mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No resources yet
              </h3>
              <p className="text-foreground-muted mb-4">
                Be the first to contribute!
              </p>
              {isAuthed && (
                <Button variant="gradient" onClick={() => setShowCreate(true)}>
                  Contribute now
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <Card
                key={r.id}
                className="hover:shadow-medium transition-all duration-200"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {r.category}
                        </Badge>
                        {r.company && (
                          <Badge variant="info" className="text-xs">
                            {r.company.name}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {r.title}
                      </h3>
                      <p
                        className={`text-sm text-foreground-muted leading-relaxed ${expanded !== r.id ? "line-clamp-3" : ""}`}
                      >
                        {r.content}
                      </p>
                      {r.content.length > 200 && (
                        <button
                          onClick={() =>
                            setExpanded(expanded === r.id ? null : r.id)
                          }
                          className="text-xs text-primary mt-1 hover:underline flex items-center gap-0.5"
                        >
                          {expanded === r.id ? "Show less" : "Read more"}
                          <ChevronRight
                            className={`w-3 h-3 transition-transform ${expanded === r.id ? "rotate-90" : ""}`}
                          />
                        </button>
                      )}
                      {r.author && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                          <div className="w-6 h-6 rounded-full gradient-button flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[10px] font-bold">
                              {(r.author.firstName?.[0] || "") +
                                (r.author.lastName?.[0] || "")}
                            </span>
                          </div>
                          <span className="text-xs text-foreground-subtle">
                            {r.author.firstName} {r.author.lastName}
                          </span>
                          <span className="text-[10px] text-foreground-subtle ml-auto">
                            {new Date(r.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleUpvote(r.id)}
                      className="flex-shrink-0 flex flex-col items-center gap-1 p-2.5 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <ThumbsUp className="w-4 h-4 text-foreground-subtle group-hover:text-primary" />
                      <span className="text-xs font-semibold text-foreground-muted group-hover:text-primary">
                        {r.upvotes}
                      </span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg animate-slide-up shadow-strong">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <CardTitle>Contribute a resource</CardTitle>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowCreate(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleCreate}>
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Title
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g. How to negotiate salary at FAANG"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full h-11 rounded-xl border-2 border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Content
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                    className="flex min-h-[140px] w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-sm placeholder:text-foreground-subtle focus:border-primary focus:outline-none transition-all"
                    placeholder="Share your tips, experience or guide..."
                    required
                  />
                </div>
              </CardContent>
              <div className="p-5 pt-0 flex gap-3 border-t border-border mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  className="flex-1 shadow-primary"
                >
                  Publish
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
