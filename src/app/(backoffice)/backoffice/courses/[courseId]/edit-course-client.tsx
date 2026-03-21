"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

export type BackofficeLessonListItem = {
  id: string;
  routeLessonId: string;
  title: string;
  type: "video" | "doc" | "image" | "quiz";
  sortOrder: number;
};

export type BackofficeCourseEditModel = {
  id: string;
  title: string;
  description: string;
  tagsText: string;
  website: string | null;
  published: boolean;
  visibility: "everyone" | "signed_in";
  accessRule: "open" | "invitation" | "payment";
  priceInr: number | null;
  responsibleName: string;
};

type TabKey = "content" | "description" | "options" | "quiz";

function TopTabs(props: { value: TabKey; onChange: (v: TabKey) => void }) {
  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "content", label: "Content" },
    { key: "description", label: "Description" },
    { key: "options", label: "Options" },
    { key: "quiz", label: "Quiz" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => props.onChange(t.key)}
          className={
            props.value === t.key
              ? "rounded-[12px] border border-border bg-accent px-4 py-2 text-sm font-semibold"
              : "rounded-[12px] border border-border bg-background px-4 py-2 text-sm text-muted hover:bg-accent"
          }
          aria-current={props.value === t.key ? "page" : undefined}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function PublishWidget(props: {
  published: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-[16px] border border-border bg-background px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold">Publish on website</div>
        <div className="text-muted">▾</div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-4">
        <div className="text-sm">Share on web</div>
        <button
          type="button"
          disabled={props.disabled}
          onClick={props.onToggle}
          className={
            props.published
              ? "relative h-6 w-11 rounded-full bg-foreground/20 disabled:opacity-60"
              : "relative h-6 w-11 rounded-full bg-foreground/10 disabled:opacity-60"
          }
          aria-label={props.published ? "Unpublish from website" : "Publish on website"}
          title={props.published ? "Published" : "Draft"}
        >
          <span
            className={
              props.published
                ? "absolute left-1 top-1 h-4 w-4 rounded-full bg-foreground transition-transform translate-x-5"
                : "absolute left-1 top-1 h-4 w-4 rounded-full bg-foreground transition-transform"
            }
          />
        </button>
      </div>
    </div>
  );
}

function LabeledRow(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid items-center gap-3 sm:grid-cols-[160px_1fr]">
      <div className="text-sm text-muted">{props.label}</div>
      <div>{props.children}</div>
    </div>
  );
}

export function BackofficeEditCourseClient(props: {
  course: BackofficeCourseEditModel;
  lessons: BackofficeLessonListItem[];
}) {
  const router = useRouter();

  const [tab, setTab] = React.useState<TabKey>("content");

  const [title, setTitle] = React.useState(props.course.title);
  const [description, setDescription] = React.useState(props.course.description);
  const [tagsText, setTagsText] = React.useState(props.course.tagsText);
  const [website, setWebsite] = React.useState(props.course.website ?? "");
  const [visibility, setVisibility] = React.useState<BackofficeCourseEditModel["visibility"]>(
    props.course.visibility,
  );
  const [accessRule, setAccessRule] = React.useState<BackofficeCourseEditModel["accessRule"]>(
    props.course.accessRule,
  );
  const [priceInr, setPriceInr] = React.useState<string>(
    typeof props.course.priceInr === "number" ? String(props.course.priceInr) : "",
  );

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [openMenuLessonId, setOpenMenuLessonId] = React.useState<string | null>(null);

  const [addOpen, setAddOpen] = React.useState(false);
  const [addBusy, setAddBusy] = React.useState(false);
  const [lessonTitle, setLessonTitle] = React.useState("");
  const [lessonType, setLessonType] = React.useState<BackofficeLessonListItem["type"]>("video");
  const [lessonVideoUrl, setLessonVideoUrl] = React.useState("https://www.youtube.com/watch?v=ysz5S6PUM-U");
  const [lessonDuration, setLessonDuration] = React.useState("10");

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/backoffice/courses/${encodeURIComponent(props.course.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          tagsText: tagsText.trim(),
          website: website.trim() ? website.trim() : null,
          visibility,
          accessRule,
          priceInr:
            accessRule === "payment" && priceInr.trim()
              ? Math.max(0, Math.floor(Number(priceInr)))
              : null,
        }),
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to save.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/backoffice/courses/${encodeURIComponent(props.course.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ published: !props.course.published }),
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to update publish state.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const addLesson = async () => {
    const safeTitle = lessonTitle.trim().slice(0, 120);
    if (!safeTitle) {
      setError("Lesson title is required.");
      return;
    }

    setAddBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/lessons`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: safeTitle,
            type: lessonType,
            videoUrl: lessonType === "video" ? lessonVideoUrl.trim() : undefined,
            durationMinutes: Number(lessonDuration),
          }),
        },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to add lesson.");
        return;
      }

      setAddOpen(false);
      setLessonTitle("");
      router.refresh();
    } finally {
      setAddBusy(false);
    }
  };

  return (
    <div className="space-y-5" onClick={() => setOpenMenuLessonId(null)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => router.push("/backoffice/courses?new=1")}>New</Button>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <PublishWidget published={props.course.published} disabled={busy} onToggle={togglePublish} />
          <Button variant="secondary" disabled={busy} onClick={save}>
            {busy ? "Saving..." : "Save"}
          </Button>
          <Button variant="secondary" onClick={() => router.push(`/courses/${props.course.id}`)}>
            Preview
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" disabled>
          Contact Attendees
        </Button>
        <Button variant="secondary" disabled>
          Add Attendees
        </Button>
      </div>

      {error && (
        <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="space-y-3">
            <LabeledRow label="Course Title:">
              <div className="grid gap-2">
                <Label className="sr-only" htmlFor="title">
                  Course Title
                </Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
            </LabeledRow>

            <LabeledRow label="Tags:">
              <div className="grid gap-2">
                <Label className="sr-only" htmlFor="tags">
                  Tags
                </Label>
                <Input
                  id="tags"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="CRM, Sales"
                />
              </div>
            </LabeledRow>

            <LabeledRow label="Responsible:">
              <div className="grid gap-2">
                <Label className="sr-only" htmlFor="responsible">
                  Responsible
                </Label>
                <Input id="responsible" value={props.course.responsibleName} disabled />
              </div>
            </LabeledRow>
          </div>

          <div className="pt-1">
            <TopTabs value={tab} onChange={setTab} />
          </div>

          <div className="rounded-[16px] border border-border bg-background">
            {tab === "content" && (
              <div className="p-4">
                <div className="grid grid-cols-[1fr_140px_44px] items-center gap-3 border-b border-border px-2 py-2 text-sm font-semibold">
                  <div>Content title</div>
                  <div>Category</div>
                  <div />
                </div>

                {props.lessons.length === 0 ? (
                  <div className="px-2 py-6 text-sm text-muted">No content yet.</div>
                ) : (
                  <div>
                    {props.lessons
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((l) => (
                        <div
                          key={l.id}
                          className="relative grid grid-cols-[1fr_140px_44px] items-center gap-3 border-b border-border px-2 py-3 text-sm"
                        >
                          <div className="min-w-0">
                            <div className="truncate">{l.title}</div>
                          </div>
                          <div className="text-muted">{l.type === "doc" ? "Document" : l.type === "quiz" ? "Quiz" : l.type === "image" ? "Image" : "Video"}</div>
                          <div className="justify-self-end">
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-background hover:bg-accent"
                              aria-label="Row actions"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuLessonId((v) => (v === l.id ? null : l.id));
                              }}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {openMenuLessonId === l.id && (
                              <div
                                className="absolute right-2 top-12 z-10 w-40 rounded-[12px] border border-border bg-background p-1 shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link
                                  className="block rounded-[10px] px-3 py-2 text-sm hover:bg-accent"
                                  href={`/learn/${props.course.id}/${l.routeLessonId}`}
                                >
                                  Open
                                </Link>
                                <button
                                  type="button"
                                  className="block w-full rounded-[10px] px-3 py-2 text-left text-sm text-muted"
                                  disabled
                                >
                                  Edit (soon)
                                </button>
                                <button
                                  type="button"
                                  className="block w-full rounded-[10px] px-3 py-2 text-left text-sm text-muted"
                                  disabled
                                >
                                  Delete (soon)
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                <div className="flex justify-center pt-8">
                  <Button variant="secondary" onClick={() => setAddOpen(true)}>
                    Add content
                  </Button>
                </div>
              </div>
            )}

            {tab === "description" && (
              <div className="p-4">
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="min-h-40 w-full rounded-[12px] border border-border bg-background px-3 py-2 text-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            )}

            {tab === "options" && (
              <div className="p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <select
                      id="visibility"
                      className="h-10 w-full rounded-[12px] border border-border bg-background px-3 text-sm"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as any)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="signed_in">Signed In</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="access">Access rule</Label>
                    <select
                      id="access"
                      className="h-10 w-full rounded-[12px] border border-border bg-background px-3 text-sm"
                      value={accessRule}
                      onChange={(e) => setAccessRule(e.target.value as any)}
                    >
                      <option value="open">Open</option>
                      <option value="invitation">Invitation</option>
                      <option value="payment">Payment</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      value={priceInr}
                      onChange={(e) => setPriceInr(e.target.value)}
                      placeholder="500"
                      disabled={accessRule !== "payment"}
                    />
                  </div>
                </div>
              </div>
            )}

            {tab === "quiz" && (
              <div className="p-4">
                <div className="text-sm text-muted">Quiz builder UI is pending. (Quiz lessons appear in the Content tab.)</div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:pt-1">
          <div className="rounded-[16px] border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-semibold">Course image</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-background text-muted"
                  title="Edit image (pending)"
                  disabled
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-background text-muted"
                  title="Remove image (pending)"
                  disabled
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex aspect-[4/3] items-center justify-center rounded-[14px] border border-dashed border-border bg-background text-sm text-muted">
              Course image
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={addOpen}
        onOpenChange={(v) => {
          if (addBusy) return;
          setAddOpen(v);
          if (!v) {
            setLessonTitle("");
            setLessonType("video");
            setLessonVideoUrl("https://www.youtube.com/watch?v=ysz5S6PUM-U");
            setLessonDuration("10");
          }
        }}
        title="Add content"
        description="Create a new lesson (video/doc/image/quiz)."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" disabled={addBusy} onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={addBusy} onClick={addLesson}>
              {addBusy ? "Adding..." : "Add"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="lessonTitle">Title</Label>
            <Input id="lessonTitle" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Lesson title" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lessonType">Type</Label>
            <select
              id="lessonType"
              className="h-10 w-full rounded-[10px] border border-border bg-background px-3 text-sm"
              value={lessonType}
              onChange={(e) => setLessonType(e.target.value as any)}
            >
              <option value="video">Video</option>
              <option value="doc">Document</option>
              <option value="image">Image</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>

          {lessonType === "video" && (
            <div className="grid gap-2">
              <Label htmlFor="videoUrl">YouTube URL</Label>
              <Input id="videoUrl" value={lessonVideoUrl} onChange={(e) => setLessonVideoUrl(e.target.value)} />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input id="duration" value={lessonDuration} onChange={(e) => setLessonDuration(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
