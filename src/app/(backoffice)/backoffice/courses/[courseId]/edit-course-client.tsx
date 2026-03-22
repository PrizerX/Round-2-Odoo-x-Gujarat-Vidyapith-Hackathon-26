"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChevronDown, ChevronUp, MoreVertical, Pencil, Trash2 } from "lucide-react";

type BackofficeAttendeeItem = {
  enrollmentId: string;
  userId: string;
  status: "invited" | "enrolled";
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
};

type BackofficeEligibleUserItem = {
  id: string;
  name: string;
  email: string;
};

export type BackofficeLessonListItem = {
  id: string;
  routeLessonId: string;
  unitId: string | null;
  title: string;
  type: "video" | "doc" | "image" | "quiz";
  sortOrder: number;
  description?: string | null;
  durationMinutes?: number | null;
  videoUrl?: string | null;
  allowDownload?: boolean;
};

type BackofficeLessonAttachmentItem = {
  id: string;
  kind: "file" | "link";
  label: string | null;
  url: string;
  allowDownload: boolean;
  createdAt: string;
};

export type BackofficeUnitListItem = {
  id: string;
  title: string;
  sortOrder: number;
};

export type BackofficeQuizRewardRuleItem = {
  attemptNumber: number;
  pointsPerCorrect: number;
};

export type BackofficeQuizOptionItem = {
  id: string;
  text: string;
  sortOrder: number;
  isCorrect: boolean;
};

export type BackofficeQuizQuestionItem = {
  id: string;
  prompt: string;
  allowMultipleCorrect: boolean;
  sortOrder: number;
  options: BackofficeQuizOptionItem[];
};

export type BackofficeQuizItem = {
  id: string;
  lessonId: string | null;
  title: string;
  allowMultipleAttempts: boolean;
  pointsPerCorrect: number;
  rewardRules: BackofficeQuizRewardRuleItem[];
  questions: BackofficeQuizQuestionItem[];
};

export type BackofficeCourseEditModel = {
  id: string;
  title: string;
  description: string;
  tagsText: string;
  website: string | null;
  thumbnailUrl: string | null;
  coverUrl: string | null;
  bannerUrl: string | null;
  published: boolean;
  visibility: "everyone" | "signed_in";
  accessRule: "open" | "invitation" | "payment";
  priceInr: number | null;
  responsibleId: string | null;
  responsibleName: string;
  courseAdminId: string | null;
  courseAdminName: string | null;
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
  units: BackofficeUnitListItem[];
  quizzes: BackofficeQuizItem[];
  responsibleUsers: Array<{ id: string; name: string; role: string }>;
}) {
  const router = useRouter();

  const [tab, setTab] = React.useState<TabKey>("content");

  const [title, setTitle] = React.useState(props.course.title);
  const [description, setDescription] = React.useState(props.course.description);
  const [tagsText, setTagsText] = React.useState(props.course.tagsText);
  const [website, setWebsite] = React.useState(props.course.website ?? "");
  const [responsibleId, setResponsibleId] = React.useState<string>(props.course.responsibleId ?? "");
  const [courseAdminId, setCourseAdminId] = React.useState<string>(props.course.courseAdminId ?? "");
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

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteBusy, setInviteBusy] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [inviteQuery, setInviteQuery] = React.useState("");
  const [eligibleUsers, setEligibleUsers] = React.useState<BackofficeEligibleUserItem[]>([]);
  const [eligibleBusy, setEligibleBusy] = React.useState(false);
  const [selectedInviteIds, setSelectedInviteIds] = React.useState<string[]>([]);

  const [contactOpen, setContactOpen] = React.useState(false);
  const [contactBusy, setContactBusy] = React.useState(false);
  const [contactError, setContactError] = React.useState<string | null>(null);
  const [attendees, setAttendees] = React.useState<BackofficeAttendeeItem[]>([]);
  const [contactQuery, setContactQuery] = React.useState("");
  const [contactIncludeInvited, setContactIncludeInvited] = React.useState(false);
  const [selectedContactIds, setSelectedContactIds] = React.useState<string[]>([]);
  const [contactSubject, setContactSubject] = React.useState("");
  const [contactBody, setContactBody] = React.useState("");

  const fetchEligibleUsers = React.useCallback(
    async (query: string) => {
      const q = query.trim();
      const url = new URL(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/attendees`,
        window.location.origin,
      );
      url.searchParams.set("eligible", "1");
      if (q) url.searchParams.set("q", q);

      const res = await fetch(url.toString(), { method: "GET" });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Failed to load users.");
      }
      const users = Array.isArray(data.users) ? (data.users as BackofficeEligibleUserItem[]) : [];
      return users;
    },
    [props.course.id],
  );

  const fetchAttendees = React.useCallback(
    async () => {
      const url = `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/attendees`;
      const res = await fetch(url, { method: "GET" });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Failed to load attendees.");
      }
      const items = Array.isArray(data.attendees) ? (data.attendees as BackofficeAttendeeItem[]) : [];
      return items;
    },
    [props.course.id],
  );

  React.useEffect(() => {
    if (!inviteOpen) return;
    setInviteError(null);
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setEligibleBusy(true);
      try {
        const users = await fetchEligibleUsers(inviteQuery);
        if (cancelled) return;
        setEligibleUsers(users);
        setSelectedInviteIds((prev) => prev.filter((id) => users.some((u) => u.id === id)));
      } catch (e) {
        if (cancelled) return;
        setEligibleUsers([]);
        setSelectedInviteIds([]);
        setInviteError(e instanceof Error ? e.message : "Failed to load users.");
      } finally {
        if (!cancelled) setEligibleBusy(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [inviteOpen, inviteQuery, fetchEligibleUsers]);

  React.useEffect(() => {
    if (!contactOpen) return;
    setContactError(null);
    setContactBusy(true);
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchAttendees();
        if (cancelled) return;
        setAttendees(items);
        setSelectedContactIds(items.filter((a) => a.status === "enrolled").map((a) => a.userId));
      } catch (e) {
        if (cancelled) return;
        setAttendees([]);
        setSelectedContactIds([]);
        setContactError(e instanceof Error ? e.message : "Failed to load attendees.");
      } finally {
        if (!cancelled) setContactBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contactOpen, fetchAttendees]);

  const [imageOpen, setImageOpen] = React.useState(false);
  const [imageBusy, setImageBusy] = React.useState(false);
  const [thumbnailUrl, setThumbnailUrl] = React.useState(props.course.thumbnailUrl ?? "");
  const [coverUrl, setCoverUrl] = React.useState(props.course.coverUrl ?? "");
  const [bannerUrl, setBannerUrl] = React.useState(props.course.bannerUrl ?? "");

  const [openMenuLessonId, setOpenMenuLessonId] = React.useState<string | null>(null);

  const [editLessonId, setEditLessonId] = React.useState<string | null>(null);
  const isEditing = editLessonId !== null;
  const [deleteLessonId, setDeleteLessonId] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addBusy, setAddBusy] = React.useState(false);
  const [lessonTitle, setLessonTitle] = React.useState("");
  const [lessonType, setLessonType] = React.useState<BackofficeLessonListItem["type"]>("video");
  const [lessonUnitId, setLessonUnitId] = React.useState<string>("");
  const [lessonVideoUrl, setLessonVideoUrl] = React.useState("https://www.youtube.com/watch?v=ysz5S6PUM-U");
  const [lessonDocPdfFile, setLessonDocPdfFile] = React.useState<File | null>(null);
  const lessonDocPdfInputRef = React.useRef<HTMLInputElement | null>(null);
  const [lessonDuration, setLessonDuration] = React.useState("10");
  const [lessonDescription, setLessonDescription] = React.useState("");
  const [lessonAllowDownload, setLessonAllowDownload] = React.useState(false);
  const [lessonEditorTab, setLessonEditorTab] = React.useState<"content" | "description" | "attachments">("content");

  React.useEffect(() => {
    if (lessonType === "doc") return;
    if (lessonDocPdfFile) setLessonDocPdfFile(null);
    if (lessonDocPdfInputRef.current) lessonDocPdfInputRef.current.value = "";
  }, [lessonType]);

  const [lessonAttachments, setLessonAttachments] = React.useState<BackofficeLessonAttachmentItem[]>([]);
  const [attachmentsBusy, setAttachmentsBusy] = React.useState(false);
  const [addAttachmentOpen, setAddAttachmentOpen] = React.useState(false);
  const [addAttachmentBusy, setAddAttachmentBusy] = React.useState(false);
  const [attachmentLabel, setAttachmentLabel] = React.useState("");
  const [attachmentUrl, setAttachmentUrl] = React.useState("");
  const [attachmentPdfFile, setAttachmentPdfFile] = React.useState<File | null>(null);
  const [attachmentAllowDownload, setAttachmentAllowDownload] = React.useState(false);
  const [deleteAttachmentId, setDeleteAttachmentId] = React.useState<string | null>(null);
  const attachmentPdfInputRef = React.useRef<HTMLInputElement | null>(null);

  const [unitOpen, setUnitOpen] = React.useState(false);
  const [unitBusy, setUnitBusy] = React.useState(false);
  const [editUnitId, setEditUnitId] = React.useState<string | null>(null);
  const isEditingUnit = editUnitId !== null;
  const [unitTitle, setUnitTitle] = React.useState("");
  const [deleteUnitId, setDeleteUnitId] = React.useState<string | null>(null);

  const [reorderBusy, setReorderBusy] = React.useState(false);

  const [previewOpen, setPreviewOpen] = React.useState(false);

  const quizLessons = React.useMemo(() => {
    return props.lessons
      .filter((l) => l.type === "quiz")
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [props.lessons]);

  const quizByLessonId = React.useMemo(() => {
    const m = new Map<string, BackofficeQuizItem>();
    for (const q of props.quizzes ?? []) {
      if (q.lessonId) m.set(q.lessonId, q);
    }
    return m;
  }, [props.quizzes]);

  const [selectedQuizLessonId, setSelectedQuizLessonId] = React.useState<string | null>(
    quizLessons[0]?.id ?? null,
  );

  const selectedQuiz = React.useMemo(() => {
    if (!selectedQuizLessonId) return null;
    return quizByLessonId.get(selectedQuizLessonId) ?? null;
  }, [quizByLessonId, selectedQuizLessonId]);

  const [quizMode, setQuizMode] = React.useState<"questions" | "rewards">("questions");
  const [selectedQuestionId, setSelectedQuestionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedQuiz) {
      setSelectedQuestionId(null);
      return;
    }

    const sorted = (selectedQuiz.questions ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
    const first = sorted[0]?.id ?? null;
    setSelectedQuestionId((prev) => {
      if (prev && sorted.some((q) => q.id === prev)) return prev;
      return first;
    });
  }, [selectedQuiz?.id]);

  const selectedQuestion = React.useMemo(() => {
    if (!selectedQuiz || !selectedQuestionId) return null;
    return (selectedQuiz.questions ?? []).find((q) => q.id === selectedQuestionId) ?? null;
  }, [selectedQuiz, selectedQuestionId]);

  const [addQuizOpen, setAddQuizOpen] = React.useState(false);
  const [addQuizBusy, setAddQuizBusy] = React.useState(false);
  const [addQuizTitle, setAddQuizTitle] = React.useState("Quiz");
  const [addQuizDuration, setAddQuizDuration] = React.useState("10");

  const [addQuestionOpen, setAddQuestionOpen] = React.useState(false);
  const [addQuestionBusy, setAddQuestionBusy] = React.useState(false);
  const [newQuestionPrompt, setNewQuestionPrompt] = React.useState("");

  const [addChoiceOpen, setAddChoiceOpen] = React.useState(false);
  const [addChoiceBusy, setAddChoiceBusy] = React.useState(false);
  const [newChoiceText, setNewChoiceText] = React.useState("");

  const [editChoiceOpen, setEditChoiceOpen] = React.useState(false);
  const [editChoiceBusy, setEditChoiceBusy] = React.useState(false);
  const [editChoiceId, setEditChoiceId] = React.useState<string | null>(null);
  const [editChoiceText, setEditChoiceText] = React.useState("");

  const [questionPromptDraft, setQuestionPromptDraft] = React.useState("");
  React.useEffect(() => {
    setQuestionPromptDraft(selectedQuestion?.prompt ?? "");
  }, [selectedQuestion?.id]);

  const [rewardDraft, setRewardDraft] = React.useState<Record<number, string>>({
    1: "10",
    2: "8",
    3: "6",
    4: "4",
  });
  const [rewardBusy, setRewardBusy] = React.useState(false);
  const [deleteChoiceId, setDeleteChoiceId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedQuiz) return;
    const next: Record<number, string> = { 1: "", 2: "", 3: "", 4: "" };
    const rules = (selectedQuiz.rewardRules ?? []).slice().sort((a, b) => a.attemptNumber - b.attemptNumber);
    for (const r of rules) {
      if (r.attemptNumber >= 1 && r.attemptNumber <= 4) next[r.attemptNumber] = String(r.pointsPerCorrect);
    }
    for (const n of [1, 2, 3, 4]) {
      if (!next[n]) next[n] = n === 1 ? "10" : n === 2 ? "8" : n === 3 ? "6" : "4";
    }
    setRewardDraft(next);
  }, [selectedQuiz?.id]);

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
          responsibleId: responsibleId.trim() ? responsibleId.trim() : null,
          courseAdminId: courseAdminId.trim() ? courseAdminId.trim() : null,
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

  const openImageModal = () => {
    setError(null);
    setThumbnailUrl(props.course.thumbnailUrl ?? "");
    setCoverUrl(props.course.coverUrl ?? "");
    setBannerUrl(props.course.bannerUrl ?? "");
    setImageOpen(true);
  };

  const saveImages = async () => {
    setImageBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/backoffice/courses/${encodeURIComponent(props.course.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          thumbnailUrl: thumbnailUrl.trim() ? thumbnailUrl.trim() : null,
          coverUrl: coverUrl.trim() ? coverUrl.trim() : null,
          bannerUrl: bannerUrl.trim() ? bannerUrl.trim() : null,
        }),
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to save images.");
        return;
      }

      setImageOpen(false);
      router.refresh();
    } finally {
      setImageBusy(false);
    }
  };

  const clearImages = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/backoffice/courses/${encodeURIComponent(props.course.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ thumbnailUrl: null, coverUrl: null, bannerUrl: null }),
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to clear images.");
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

    const url = lessonVideoUrl.trim();
    const fileFromInput = lessonDocPdfInputRef.current?.files?.[0] ?? null;
    const docFile = fileFromInput ?? lessonDocPdfFile;
    const hasDocFile = !!docFile;

    if ((lessonType === "video" || lessonType === "image") && !url) {
      setError("URL is required for this lesson type.");
      return;
    }
    if (lessonType === "doc" && !url && !hasDocFile) {
      setError("Document URL is required (or upload a PDF).");
      return;
    }

    const uploadDocPdfIfNeeded = async (): Promise<string | null> => {
      if (lessonType !== "doc") return null;
      if (!docFile) return null;
      const name = typeof docFile.name === "string" ? docFile.name : "";
      const looksPdf = docFile.type === "application/pdf" || name.toLowerCase().endsWith(".pdf");
      if (!looksPdf) {
        setError("Only PDF files are allowed for Document lessons.");
        return null;
      }

      const fd = new FormData();
      fd.append("file", docFile);
      const res = await fetch("/api/backoffice/uploads/pdf", { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok || typeof data?.url !== "string" || !String(data.url).trim()) {
        setError(typeof data?.error === "string" ? data.error : "Failed to upload PDF.");
        return null;
      }
      return String(data.url).trim();
    };

    setAddBusy(true);
    setError(null);
    try {
      const uploadedDocUrl = await uploadDocPdfIfNeeded();
      if (hasDocFile && !uploadedDocUrl) return;

      const finalUrl = lessonType === "doc" && uploadedDocUrl ? uploadedDocUrl : url;
      if ((lessonType === "video" || lessonType === "doc" || lessonType === "image") && !finalUrl) {
        setError("URL is required for this lesson type.");
        return;
      }

      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/lessons`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: safeTitle,
            type: lessonType,
            unitId: lessonUnitId.trim() ? lessonUnitId.trim() : null,
            description: lessonDescription.trim(),
            allowDownload: !!lessonAllowDownload,
            videoUrl:
              lessonType === "video" || lessonType === "doc" || lessonType === "image"
                ? finalUrl
                : undefined,
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
      setLessonUnitId("");
      setLessonDescription("");
      setLessonAllowDownload(false);
      setLessonEditorTab("content");
      setLessonDocPdfFile(null);
      if (lessonDocPdfInputRef.current) lessonDocPdfInputRef.current.value = "";
      router.refresh();
    } finally {
      setAddBusy(false);
    }
  };

  const openAdd = () => {
    setError(null);
    setEditLessonId(null);
    setLessonTitle("");
    setLessonType("video");
    setLessonUnitId("");
    setLessonVideoUrl("https://www.youtube.com/watch?v=ysz5S6PUM-U");
    setLessonDocPdfFile(null);
    if (lessonDocPdfInputRef.current) lessonDocPdfInputRef.current.value = "";
    setLessonDuration("10");
    setLessonDescription("");
    setLessonAllowDownload(false);
    setLessonEditorTab("content");
    setLessonAttachments([]);
    setAddOpen(true);
  };

  const openEdit = (lessonId: string) => {
    const lesson = props.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    setError(null);
    setEditLessonId(lessonId);
    setLessonTitle(lesson.title);
    setLessonType(lesson.type);
    setLessonUnitId(lesson.unitId ?? "");
    setLessonVideoUrl(typeof lesson.videoUrl === "string" && lesson.videoUrl.trim()
      ? lesson.videoUrl
      : lesson.type === "video"
        ? "https://www.youtube.com/watch?v=ysz5S6PUM-U"
        : "");
    setLessonDocPdfFile(null);
    if (lessonDocPdfInputRef.current) lessonDocPdfInputRef.current.value = "";
    setLessonDuration(
      typeof lesson.durationMinutes === "number" && Number.isFinite(lesson.durationMinutes)
        ? String(Math.max(0, Math.floor(lesson.durationMinutes)))
        : "10",
    );
    setLessonDescription(typeof lesson.description === "string" ? lesson.description : "");
    setLessonAllowDownload(!!lesson.allowDownload);
    setLessonEditorTab("content");
    setLessonAttachments([]);
    setAddOpen(true);
  };

  const saveLessonEdits = async () => {
    if (!editLessonId) return;

    const safeTitle = lessonTitle.trim().slice(0, 120);
    if (!safeTitle) {
      setError("Lesson title is required.");
      return;
    }

    const durationNum = Number(lessonDuration);
    const durationMinutes = Number.isFinite(durationNum) ? Math.max(0, Math.floor(durationNum)) : 0;

    const url = lessonVideoUrl.trim();
    const fileFromInput = lessonDocPdfInputRef.current?.files?.[0] ?? null;
    const docFile = fileFromInput ?? lessonDocPdfFile;
    const hasDocFile = !!docFile;

    if ((lessonType === "video" || lessonType === "image") && !url) {
      setError("URL is required for this lesson type.");
      return;
    }
    if (lessonType === "doc" && !url && !hasDocFile) {
      setError("Document URL is required (or upload a PDF).");
      return;
    }

    const uploadDocPdfIfNeeded = async (): Promise<string | null> => {
      if (lessonType !== "doc") return null;
      if (!docFile) return null;
      const name = typeof docFile.name === "string" ? docFile.name : "";
      const looksPdf = docFile.type === "application/pdf" || name.toLowerCase().endsWith(".pdf");
      if (!looksPdf) {
        setError("Only PDF files are allowed for Document lessons.");
        return null;
      }
      const fd = new FormData();
      fd.append("file", docFile);
      const res = await fetch("/api/backoffice/uploads/pdf", { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok || typeof data?.url !== "string" || !String(data.url).trim()) {
        setError(typeof data?.error === "string" ? data.error : "Failed to upload PDF.");
        return null;
      }
      return String(data.url).trim();
    };

    setAddBusy(true);
    setError(null);
    try {
      const uploadedDocUrl = await uploadDocPdfIfNeeded();
      if (hasDocFile && !uploadedDocUrl) return;

      const finalUrl = lessonType === "doc" && uploadedDocUrl ? uploadedDocUrl : url;
      if ((lessonType === "video" || lessonType === "doc" || lessonType === "image") && !finalUrl) {
        setError("URL is required for this lesson type.");
        return;
      }

      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/lessons/${encodeURIComponent(editLessonId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: safeTitle,
            unitId: lessonUnitId.trim() ? lessonUnitId.trim() : null,
            description: lessonDescription.trim(),
            allowDownload: !!lessonAllowDownload,
            videoUrl:
              lessonType === "video" || lessonType === "doc" || lessonType === "image"
                ? finalUrl
                : undefined,
            durationMinutes,
          }),
        },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to update lesson.");
        return;
      }

      setAddOpen(false);
      setEditLessonId(null);
      setLessonUnitId("");
      setLessonDescription("");
      setLessonAllowDownload(false);
      setLessonEditorTab("content");
      setLessonAttachments([]);
      setLessonDocPdfFile(null);
      if (lessonDocPdfInputRef.current) lessonDocPdfInputRef.current.value = "";
      router.refresh();
    } finally {
      setAddBusy(false);
    }
  };

  const loadLessonAttachments = async () => {
    if (!editLessonId) return;
    setAttachmentsBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/lessons/${encodeURIComponent(editLessonId)}/attachments`,
      );
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok || !Array.isArray(data?.attachments)) {
        setError(typeof data?.error === "string" ? data.error : "Failed to load attachments.");
        setLessonAttachments([]);
        return;
      }
      setLessonAttachments(data.attachments as BackofficeLessonAttachmentItem[]);
    } finally {
      setAttachmentsBusy(false);
    }
  };

  const addAttachment = async () => {
    if (!editLessonId) return;
    const label = attachmentLabel.trim().slice(0, 120);

    const fileFromInput = attachmentPdfInputRef.current?.files?.[0] ?? null;
    const file = fileFromInput ?? attachmentPdfFile;
    const hasFile = !!file;
    const url = attachmentUrl.trim().slice(0, 500);

    if (!hasFile && !url) {
      setError("Attachment URL is required (or upload a PDF). ");
      return;
    }

    const uploadPdfIfNeeded = async (): Promise<string | null> => {
      if (!file) return null;
      const name = typeof file.name === "string" ? file.name : "";
      const looksPdf = file.type === "application/pdf" || name.toLowerCase().endsWith(".pdf");
      if (!looksPdf) {
        setError("Only PDF files are allowed.");
        return null;
      }

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/backoffice/uploads/pdf", { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok || typeof data?.url !== "string") {
        setError(typeof data?.error === "string" ? data.error : "Failed to upload PDF.");
        return null;
      }
      const uploaded = String(data.url || "").trim();
      if (!uploaded) {
        setError("Failed to upload PDF.");
        return null;
      }
      return uploaded;
    };

    setAddAttachmentBusy(true);
    setError(null);
    try {
      const uploadedUrl = await uploadPdfIfNeeded();
      if (hasFile && !uploadedUrl) {
        // Do not attempt the DB create if upload failed.
        return;
      }

      const finalKind = hasFile ? "file" : "link";
      const finalUrl = hasFile ? (uploadedUrl as string) : url;
      if (!finalUrl) {
        setError("Attachment URL is required.");
        return;
      }

      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/lessons/${encodeURIComponent(editLessonId)}/attachments`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            kind: finalKind,
            url: finalUrl,
            label: label || undefined,
            allowDownload: !!attachmentAllowDownload,
          }),
        },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to add attachment.");
        return;
      }

      setAddAttachmentOpen(false);
      setAttachmentLabel("");
      setAttachmentUrl("");
      setAttachmentPdfFile(null);
      if (attachmentPdfInputRef.current) attachmentPdfInputRef.current.value = "";
      setAttachmentAllowDownload(false);
      await loadLessonAttachments();
    } finally {
      setAddAttachmentBusy(false);
    }
  };

  const deleteAttachment = async (attachmentId: string) => {
    if (!editLessonId) return;
    setAttachmentsBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/lessons/${encodeURIComponent(editLessonId)}/attachments/${encodeURIComponent(attachmentId)}`,
        { method: "DELETE" },
      );
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to delete attachment.");
        return;
      }
      await loadLessonAttachments();
    } finally {
      setAttachmentsBusy(false);
    }
  };

  React.useEffect(() => {
    if (!addOpen) return;
    if (!isEditing) return;
    if (lessonEditorTab !== "attachments") return;
    void loadLessonAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOpen, isEditing, lessonEditorTab, editLessonId]);

  const deleteLesson = async (lessonId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/lessons/${encodeURIComponent(lessonId)}`,
        { method: "DELETE" },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to delete lesson.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const openAddUnit = () => {
    setError(null);
    setEditUnitId(null);
    setUnitTitle("");
    setUnitOpen(true);
  };

  const openEditUnit = (unitId: string) => {
    const unit = props.units.find((u) => u.id === unitId);
    if (!unit) return;
    setError(null);
    setEditUnitId(unitId);
    setUnitTitle(unit.title);
    setUnitOpen(true);
  };

  const saveUnit = async () => {
    const safeTitle = unitTitle.trim().slice(0, 120);
    if (!safeTitle) {
      setError("Unit title is required.");
      return;
    }

    setUnitBusy(true);
    setError(null);
    try {
      const url = isEditingUnit
        ? `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/units/${encodeURIComponent(editUnitId!)}`
        : `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/units`;

      const res = await fetch(url, {
        method: isEditingUnit ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: safeTitle }),
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to save unit.");
        return;
      }

      setUnitOpen(false);
      setEditUnitId(null);
      setUnitTitle("");
      router.refresh();
    } finally {
      setUnitBusy(false);
    }
  };

  const deleteUnit = async (unitId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/units/${encodeURIComponent(unitId)}`,
        { method: "DELETE" },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to delete unit.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const moveLesson = async (lessonId: string, direction: "up" | "down") => {
    if (reorderBusy) return;
    setReorderBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/lessons/reorder`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lessonId, direction }),
        },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to reorder content.");
        return;
      }

      router.refresh();
    } finally {
      setReorderBusy(false);
    }
  };

  const addQuiz = async () => {
    const safeTitle = addQuizTitle.trim().slice(0, 120);
    const durationMinutes = Math.max(0, Math.floor(Number(addQuizDuration || 0)));
    if (!safeTitle) {
      setError("Quiz title is required.");
      return;
    }

    setAddQuizBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/backoffice/courses/${encodeURIComponent(props.course.id)}/lessons`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: safeTitle,
          type: "quiz",
          durationMinutes,
        }),
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok || !data?.lesson?.id) {
        setError(typeof data?.error === "string" ? data.error : "Failed to add quiz.");
        return;
      }

      setAddQuizOpen(false);
      setSelectedQuizLessonId(String(data.lesson.id));
      setQuizMode("questions");
      router.refresh();
    } finally {
      setAddQuizBusy(false);
    }
  };

  const addQuestion = async () => {
    if (!selectedQuiz) {
      setError("Select a quiz first.");
      return;
    }

    const safePrompt = newQuestionPrompt.trim().slice(0, 240);
    if (!safePrompt) {
      setError("Question prompt is required.");
      return;
    }

    setAddQuestionBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/quizzes/${encodeURIComponent(selectedQuiz.id)}/questions`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: safePrompt }),
        },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok || typeof data?.questionId !== "string") {
        setError(typeof data?.error === "string" ? data.error : "Failed to add question.");
        return;
      }

      setAddQuestionOpen(false);
      setNewQuestionPrompt("");
      setQuizMode("questions");
      setSelectedQuestionId(data.questionId);
      router.refresh();
    } finally {
      setAddQuestionBusy(false);
    }
  };

  const saveQuestionPrompt = async () => {
    if (!selectedQuiz || !selectedQuestion) return;
    const safePrompt = questionPromptDraft.trim().slice(0, 500);
    if (!safePrompt) {
      setError("Question prompt is required.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/quizzes/${encodeURIComponent(selectedQuiz.id)}/questions/${encodeURIComponent(selectedQuestion.id)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: safePrompt }),
        },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to save question.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const addChoice = async () => {
    if (!selectedQuiz || !selectedQuestion) return;
    const safeText = newChoiceText.trim().slice(0, 200);
    if (!safeText) {
      setError("Choice text is required.");
      return;
    }

    setAddChoiceBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/quizzes/${encodeURIComponent(selectedQuiz.id)}/questions/${encodeURIComponent(selectedQuestion.id)}/options`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: safeText }),
        },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to add choice.");
        return;
      }

      setAddChoiceOpen(false);
      setNewChoiceText("");
      router.refresh();
    } finally {
      setAddChoiceBusy(false);
    }
  };

  const setOptionCorrect = async (optionId: string, nextIsCorrect: boolean) => {
    if (!selectedQuiz || !selectedQuestion) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/quizzes/${encodeURIComponent(selectedQuiz.id)}/questions/${encodeURIComponent(selectedQuestion.id)}/options/${encodeURIComponent(optionId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ isCorrect: nextIsCorrect }),
        },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to set correct answer.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const setQuestionAllowMultipleCorrect = async (nextAllowMultipleCorrect: boolean) => {
    if (!selectedQuiz || !selectedQuestion) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/quizzes/${encodeURIComponent(selectedQuiz.id)}/questions/${encodeURIComponent(selectedQuestion.id)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ allowMultipleCorrect: nextAllowMultipleCorrect }),
        },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to update question type.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const deleteChoice = async (optionId: string) => {
    if (!selectedQuiz || !selectedQuestion) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/quizzes/${encodeURIComponent(selectedQuiz.id)}/questions/${encodeURIComponent(selectedQuestion.id)}/options/${encodeURIComponent(optionId)}`,
        { method: "DELETE" },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to delete choice.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const openEditChoice = (opt: BackofficeQuizOptionItem) => {
    setError(null);
    setEditChoiceId(opt.id);
    setEditChoiceText(opt.text);
    setEditChoiceOpen(true);
  };

  const saveChoiceText = async () => {
    if (!selectedQuiz || !selectedQuestion || !editChoiceId) return;
    const safeText = editChoiceText.trim().slice(0, 200);
    if (!safeText) {
      setError("Choice text is required.");
      return;
    }

    setEditChoiceBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/quizzes/${encodeURIComponent(selectedQuiz.id)}/questions/${encodeURIComponent(selectedQuestion.id)}/options/${encodeURIComponent(editChoiceId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: safeText }),
        },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to update choice.");
        return;
      }

      setEditChoiceOpen(false);
      setEditChoiceId(null);
      setEditChoiceText("");
      router.refresh();
    } finally {
      setEditChoiceBusy(false);
    }
  };

  const saveRewards = async () => {
    if (!selectedQuiz) return;
    setRewardBusy(true);
    setError(null);
    try {
      const rules: Array<{ attemptNumber: number; pointsPerCorrect: number }> = [];
      for (const n of [1, 2, 3, 4]) {
        const v = Math.max(1, Math.floor(Number(rewardDraft[n] ?? 0)));
        rules.push({ attemptNumber: n, pointsPerCorrect: v });
      }

      const res = await fetch(
        `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/quizzes/${encodeURIComponent(selectedQuiz.id)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rewardRules: rules }),
        },
      );

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Failed to save rewards.");
        return;
      }

      router.refresh();
    } finally {
      setRewardBusy(false);
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
          <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setContactOpen(true);
          }}
        >
          Contact Attendees
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setInviteOpen(true);
          }}
        >
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

            {/* Responsible moved to Options tab to match the mock layout */}
          </div>

          <div className="pt-1">
            <TopTabs value={tab} onChange={setTab} />
          </div>

          <div className="rounded-[16px] border border-border bg-background">
            {tab === "content" && (
              <div className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                  <div className="text-sm font-semibold">Course content</div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={openAddUnit} disabled={busy}>
                      Add unit
                    </Button>
                    <Button variant="secondary" size="sm" onClick={openAdd}>
                      Add content
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_140px_92px] items-center gap-3 border-b border-border px-2 py-2 text-sm font-semibold">
                  <div>Content title</div>
                  <div>Category</div>
                  <div />
                </div>

                {(() => {
                  const lessonsSorted = props.lessons.slice().sort((a, b) => a.sortOrder - b.sortOrder);
                  const unitsSorted = props.units.slice().sort((a, b) => a.sortOrder - b.sortOrder);
                  const unassigned = lessonsSorted.filter((l) => !l.unitId);

                  const renderLessonRow = (l: BackofficeLessonListItem, idx: number, siblings: BackofficeLessonListItem[]) => (
                    <div
                      key={l.id}
                      className="relative grid grid-cols-[1fr_140px_92px] items-center gap-3 border-b border-border px-2 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate">{l.title}</div>
                      </div>
                      <div className="text-muted">
                        {l.type === "doc"
                          ? "Document"
                          : l.type === "quiz"
                            ? "Quiz"
                            : l.type === "image"
                              ? "Image"
                              : "Video"}
                      </div>
                      <div className="justify-self-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-background hover:bg-accent disabled:opacity-50"
                            aria-label="Move up"
                            title="Move up"
                            disabled={busy || reorderBusy || idx <= 0}
                            onClick={() => moveLesson(l.id, "up")}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-background hover:bg-accent disabled:opacity-50"
                            aria-label="Move down"
                            title="Move down"
                            disabled={busy || reorderBusy || idx >= siblings.length - 1}
                            onClick={() => moveLesson(l.id, "down")}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
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

                        </div>

                        {openMenuLessonId === l.id && (
                          <div
                            className="absolute right-2 top-12 z-10 w-40 rounded-[12px] border border-border bg-background p-1 shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              className="block rounded-[10px] px-3 py-2 text-sm hover:bg-accent"
                              href={`/learn/${props.course.id}/${l.routeLessonId}`}
                              onClick={() => setOpenMenuLessonId(null)}
                            >
                              Open
                            </Link>
                            <button
                              type="button"
                              className="block w-full rounded-[10px] px-3 py-2 text-left text-sm hover:bg-accent"
                              onClick={() => {
                                setOpenMenuLessonId(null);
                                openEdit(l.id);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="block w-full rounded-[10px] px-3 py-2 text-left text-sm text-red-700 hover:bg-accent"
                              onClick={() => {
                                setOpenMenuLessonId(null);
                                setDeleteLessonId(l.id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );

                  if (lessonsSorted.length === 0 && unitsSorted.length === 0) {
                    return <div className="px-2 py-6 text-sm text-muted">No content yet.</div>;
                  }

                  return (
                    <div>
                      {unitsSorted.map((u) => {
                        const unitLessons = lessonsSorted.filter((l) => l.unitId === u.id);
                        return (
                          <div key={u.id}>
                            <div className="flex items-center justify-between gap-3 border-b border-border bg-accent/40 px-2 py-3">
                              <div className="min-w-0 text-sm font-semibold truncate">{u.title}</div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-background hover:bg-accent"
                                  title="Edit unit"
                                  onClick={() => openEditUnit(u.id)}
                                  disabled={busy}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-background hover:bg-accent"
                                  title="Delete unit"
                                  onClick={() => setDeleteUnitId(u.id)}
                                  disabled={busy}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {unitLessons.length === 0 ? (
                              <div className="border-b border-border px-2 py-3 text-sm text-muted">
                                No content in this unit.
                              </div>
                            ) : (
                              unitLessons.map((l, idx) => renderLessonRow(l, idx, unitLessons))
                            )}
                          </div>
                        );
                      })}

                      {(unassigned.length > 0 || unitsSorted.length === 0) && (
                        <div>
                          <div className="border-b border-border bg-accent/40 px-2 py-3 text-sm font-semibold">
                            Unassigned
                          </div>
                          {unassigned.length === 0 ? (
                            <div className="border-b border-border px-2 py-3 text-sm text-muted">
                              No unassigned content.
                            </div>
                          ) : (
                            unassigned.map((l, idx) => renderLessonRow(l, idx, unassigned))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {tab === "description" && (
              <div className="p-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      className="min-h-40 w-full rounded-[12px] border border-border bg-background px-3 py-2 text-sm"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            )}

            {tab === "options" && (
              <div className="p-4">
                <div className="grid gap-8 lg:grid-cols-2">
                  <div>
                    <div className="text-sm font-semibold">Access course rights</div>
                    <div className="mt-4 grid gap-5">
                      <div className="grid gap-2">
                        <Label htmlFor="visibility">Show course to:</Label>
                        <select
                          id="visibility"
                          className="h-10 w-full max-w-sm rounded-[12px] border border-border bg-background px-3 text-sm"
                          value={visibility}
                          onChange={(e) => setVisibility(e.target.value as any)}
                        >
                          <option value="everyone">Everyone</option>
                          <option value="signed_in">Signed In</option>
                        </select>
                      </div>

                      <div className="grid gap-3">
                        <div className="text-sm font-medium">Access rules:</div>
                        <div className="grid gap-2 text-sm">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="accessRule"
                              value="open"
                              checked={accessRule === "open"}
                              onChange={() => setAccessRule("open")}
                            />
                            Open
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="accessRule"
                              value="invitation"
                              checked={accessRule === "invitation"}
                              onChange={() => setAccessRule("invitation")}
                            />
                            On Invitation
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="accessRule"
                                value="payment"
                                checked={accessRule === "payment"}
                                onChange={() => setAccessRule("payment")}
                              />
                              On Payment
                            </label>

                            {accessRule === "payment" && (
                              <div className="flex items-center gap-2">
                                <Label htmlFor="price" className="text-sm">
                                  Price:
                                </Label>
                                <Input
                                  id="price"
                                  value={priceInr}
                                  onChange={(e) => setPriceInr(e.target.value)}
                                  placeholder="₹500"
                                  className="h-9 w-28"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold">Responsible</div>
                    <div className="mt-4 grid gap-5">
                      <div className="grid gap-2">
                        <Label htmlFor="responsible">Responsible:</Label>
                        <select
                          id="responsible"
                          className="h-10 w-full max-w-sm rounded-[12px] border border-border bg-background px-3 text-sm"
                          value={responsibleId}
                          onChange={(e) => setResponsibleId(e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {props.responsibleUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="courseAdmin">Course Admin:</Label>
                        <select
                          id="courseAdmin"
                          className="h-10 w-full max-w-sm rounded-[12px] border border-border bg-background px-3 text-sm"
                          value={courseAdminId}
                          onChange={(e) => setCourseAdminId(e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {props.responsibleUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "quiz" && (
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">Quiz</div>
                      <div className="text-xs text-muted">Create and edit quiz questions and rewards.</div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setAddQuizOpen(true)}>
                      Add Quiz
                    </Button>
                  </div>

                  <div className="grid grid-cols-[1fr_140px_44px] items-center gap-3 border-b border-border px-2 py-2 text-sm font-semibold">
                    <div>Content title</div>
                    <div>Category</div>
                    <div />
                  </div>

                  {quizLessons.length === 0 ? (
                    <div className="flex min-h-[260px] items-center justify-center rounded-[16px] border border-border bg-accent/30">
                      <Button variant="primary" onClick={() => setAddQuizOpen(true)}>
                        Add Quiz
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-[16px] border border-border bg-background">
                        {quizLessons.map((l) => {
                          const active = l.id === selectedQuizLessonId;
                          const quiz = quizByLessonId.get(l.id);
                          return (
                            <div
                              key={l.id}
                              className={
                                active
                                  ? "relative grid cursor-pointer grid-cols-[1fr_140px_44px] items-center gap-3 border-b border-border bg-accent/30 px-2 py-3 text-sm"
                                  : "relative grid cursor-pointer grid-cols-[1fr_140px_44px] items-center gap-3 border-b border-border px-2 py-3 text-sm hover:bg-accent/20"
                              }
                              onClick={() => {
                                setSelectedQuizLessonId(l.id);
                                setQuizMode("questions");
                              }}
                            >
                              <div className="min-w-0">
                                <div className="truncate font-medium">{l.title}</div>
                                <div className="mt-1 text-xs text-muted">{(quiz?.questions?.length ?? 0).toString()} questions</div>
                              </div>
                              <div className="text-muted">Quiz</div>
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
                                    <button
                                      type="button"
                                      className="block w-full rounded-[10px] px-3 py-2 text-left text-sm hover:bg-accent"
                                      onClick={() => {
                                        setOpenMenuLessonId(null);
                                        setSelectedQuizLessonId(l.id);
                                        setQuizMode("questions");
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="block w-full rounded-[10px] px-3 py-2 text-left text-sm text-red-700 hover:bg-accent"
                                      onClick={() => {
                                        setOpenMenuLessonId(null);
                                        setDeleteLessonId(l.id);
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {selectedQuiz ? (
                        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                          <div className="rounded-[16px] border border-border bg-background">
                            <div className="border-b border-border px-4 py-3 text-sm font-semibold">Question List</div>
                            <div className="space-y-2 p-3">
                              <div className="grid gap-2">
                                <Button variant="primary" onClick={() => setAddQuestionOpen(true)}>
                                  Add Question
                                </Button>
                                <Button variant="secondary" onClick={() => setQuizMode("rewards")}>Rewards</Button>
                              </div>

                              <div className="mt-3 space-y-1">
                                {(selectedQuiz.questions ?? [])
                                  .slice()
                                  .sort((a, b) => a.sortOrder - b.sortOrder)
                                  .map((q, idx) => {
                                    const active = q.id === selectedQuestionId;
                                    return (
                                      <button
                                        key={q.id}
                                        type="button"
                                        className={
                                          active
                                            ? "w-full rounded-[12px] border border-border bg-accent px-3 py-2 text-left text-sm font-semibold"
                                            : "w-full rounded-[12px] border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
                                        }
                                        onClick={() => {
                                          setQuizMode("questions");
                                          setSelectedQuestionId(q.id);
                                        }}
                                      >
                                        Question {idx + 1}
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[16px] border border-border bg-background">
                            {quizMode === "rewards" ? (
                              <div className="p-4">
                                <div className="text-sm font-semibold">Rewards</div>
                                <div className="mt-1 text-xs text-muted">Set points per correct answer by attempt.</div>

                                <div className="mt-4 grid gap-3">
                                  {[1, 2, 3, 4].map((n) => (
                                    <div key={n} className="grid items-center gap-2 sm:grid-cols-[160px_1fr]">
                                      <div className="text-sm text-muted">Attempt {n}{n === 4 ? "+" : ""}</div>
                                      <Input
                                        value={rewardDraft[n] ?? ""}
                                        onChange={(e) => setRewardDraft((prev) => ({ ...prev, [n]: e.target.value }))}
                                        placeholder="Points per correct"
                                      />
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-4 flex items-center justify-end gap-2">
                                  <Button variant="secondary" onClick={() => setQuizMode("questions")} disabled={rewardBusy}>
                                    Back
                                  </Button>
                                  <Button variant="primary" onClick={saveRewards} disabled={rewardBusy}>
                                    {rewardBusy ? "Saving..." : "Save"}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-sm font-semibold">{selectedQuiz.title}</div>
                                  <div className="text-xs text-muted">Quiz builder</div>
                                </div>

                                {!selectedQuestion ? (
                                  <div className="mt-6 rounded-[16px] border border-border bg-accent p-6 text-sm text-muted">
                                    Add a question to start building your quiz.
                                  </div>
                                ) : (
                                  <div className="mt-4 space-y-4">
                                    <div className="text-sm font-semibold">
                                      {Math.max(1, (selectedQuiz.questions ?? []).findIndex((q) => q.id === selectedQuestion.id) + 1)}.
                                      <span className="ml-2 font-medium text-muted">Write your question here</span>
                                    </div>

                                    <textarea
                                      className="min-h-16 w-full rounded-[12px] border border-border bg-background px-3 py-2 text-sm"
                                      value={questionPromptDraft}
                                      onChange={(e) => setQuestionPromptDraft(e.target.value)}
                                      placeholder="Write your question here"
                                    />

                                    <div className="flex items-center justify-end gap-2">
                                      <label className="flex items-center gap-2 text-xs text-muted">
                                        <input
                                          type="checkbox"
                                          checked={!!selectedQuestion.allowMultipleCorrect}
                                          disabled={busy}
                                          onChange={(e) =>
                                            setQuestionAllowMultipleCorrect(!!e.target.checked)
                                          }
                                        />
                                        Multiple correct answers (MSQ)
                                      </label>
                                      <Button variant="secondary" onClick={() => setAddChoiceOpen(true)}>
                                        Add choice
                                      </Button>
                                      <Button variant="primary" disabled={busy} onClick={saveQuestionPrompt}>
                                        {busy ? "Saving..." : "Save question"}
                                      </Button>
                                    </div>

                                    <div className="rounded-[16px] border border-border bg-background">
                                      <div className="grid grid-cols-[1fr_120px_44px] gap-3 border-b border-border px-4 py-3 text-sm font-semibold">
                                        <div>Choices</div>
                                        <div>Correct</div>
                                        <div />
                                      </div>
                                      <div className="p-4">
                                        <div className="space-y-2">
                                          {(selectedQuestion.options ?? [])
                                            .slice()
                                            .sort((a, b) => a.sortOrder - b.sortOrder)
                                            .map((opt) => (
                                              <div key={opt.id} className="grid grid-cols-[1fr_120px_44px] items-center gap-3">
                                                <div className="flex items-center justify-between gap-2">
                                                  <div className="min-w-0 truncate text-sm">{opt.text}</div>
                                                  <button
                                                    type="button"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-background text-muted hover:bg-accent"
                                                    title="Edit choice"
                                                    disabled={busy}
                                                    onClick={() => openEditChoice(opt)}
                                                  >
                                                    <Pencil className="h-4 w-4" />
                                                  </button>
                                                </div>
                                                <div className="flex items-center justify-start">
                                                  {selectedQuestion.allowMultipleCorrect ? (
                                                    <input
                                                      type="checkbox"
                                                      checked={!!opt.isCorrect}
                                                      disabled={busy}
                                                      onChange={(e) => setOptionCorrect(opt.id, !!e.target.checked)}
                                                    />
                                                  ) : (
                                                    <input
                                                      type="radio"
                                                      name={`correct_${selectedQuestion.id}`}
                                                      checked={!!opt.isCorrect}
                                                      disabled={busy}
                                                      onChange={() => setOptionCorrect(opt.id, true)}
                                                    />
                                                  )}
                                                </div>
                                                <div className="flex items-center justify-end">
                                                  <button
                                                    type="button"
                                                    className={
                                                      (selectedQuestion.options?.length ?? 0) <= 2
                                                        ? "inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-background text-muted opacity-50"
                                                        : "inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-background text-muted hover:bg-accent"
                                                    }
                                                    title={
                                                      (selectedQuestion.options?.length ?? 0) <= 2
                                                        ? "A question must have at least 2 choices"
                                                        : "Delete choice"
                                                    }
                                                    disabled={busy || (selectedQuestion.options?.length ?? 0) <= 2}
                                                    onClick={() => setDeleteChoiceId(opt.id)}
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-[16px] border border-border bg-accent p-4 text-sm text-muted">
                          This quiz doesn’t have a quiz record yet. Create a new quiz lesson from “Add Quiz”.
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-background hover:bg-accent"
                  title="Edit image"
                  onClick={openImageModal}
                  disabled={busy}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-background hover:bg-accent"
                  title="Remove image"
                  onClick={clearImages}
                  disabled={busy}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-border bg-background text-sm text-muted">
              {props.course.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Course thumbnail"
                  src={props.course.thumbnailUrl}
                  className="h-full w-full object-cover"
                />
              ) : (
                "Course image"
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={imageOpen}
        onOpenChange={(v: boolean) => {
          if (imageBusy) return;
          setImageOpen(v);
        }}
        title="Course images"
        description="Set image URLs (upload UI can be added later)."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" disabled={imageBusy} onClick={() => setImageOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={imageBusy} onClick={saveImages}>
              {imageBusy ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="thumbUrl">Thumbnail URL</Label>
            <Input
              id="thumbUrl"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="coverUrl">Cover URL</Label>
            <Input
              id="coverUrl"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bannerUrl">Banner URL</Label>
            <Input
              id="bannerUrl"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={inviteOpen}
        onOpenChange={(v: boolean) => {
          if (inviteBusy) return;
          setInviteOpen(v);
          if (!v) {
            setInviteBusy(false);
            setInviteError(null);
            setInviteQuery("");
            setEligibleUsers([]);
            setSelectedInviteIds([]);
          }
        }}
        title="Add attendees"
        description="Invite learners to this course. (Works best with Invitation access rule, but you can invite anytime.)"
        footer={
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted">
              Selected: <span className="font-semibold text-foreground">{selectedInviteIds.length}</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" disabled={inviteBusy} onClick={() => setInviteOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                disabled={inviteBusy || selectedInviteIds.length === 0}
                onClick={async () => {
                  setInviteError(null);
                  setInviteBusy(true);
                  try {
                    const res = await fetch(
                      `/api/backoffice/courses/${encodeURIComponent(props.course.id)}/attendees`,
                      {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ userIds: selectedInviteIds, status: "invited" }),
                      },
                    );
                    const data = (await res.json().catch(() => null)) as any;
                    if (!res.ok || !data?.ok) {
                      setInviteError(typeof data?.error === "string" ? data.error : "Failed to invite users.");
                      return;
                    }

                    setInviteOpen(false);
                    router.refresh();
                  } finally {
                    setInviteBusy(false);
                  }
                }}
              >
                {inviteBusy ? "Inviting..." : "Invite"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          {inviteError && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {inviteError}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="inviteSearch">Search learners</Label>
            <Input
              id="inviteSearch"
              value={inviteQuery}
              onChange={(e) => setInviteQuery(e.target.value)}
              placeholder="Search by name or email"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={eligibleBusy || eligibleUsers.length === 0}
              onClick={() => setSelectedInviteIds(eligibleUsers.map((u) => u.id))}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={eligibleBusy || selectedInviteIds.length === 0}
              onClick={() => setSelectedInviteIds([])}
            >
              Select none
            </Button>
            {eligibleBusy && <div className="text-xs text-muted">Loading...</div>}
          </div>

          {eligibleUsers.length === 0 && !eligibleBusy ? (
            <div className="rounded-[12px] border border-border bg-accent p-3 text-sm text-muted">
              No eligible learners found.
            </div>
          ) : (
            <div className="max-h-[340px] space-y-2 overflow-auto pr-1">
              {eligibleUsers.map((u) => {
                const checked = selectedInviteIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border border-border bg-background px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{u.name}</div>
                      <div className="truncate text-xs text-muted">{u.email}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const on = !!e.target.checked;
                        setSelectedInviteIds((prev) =>
                          on ? Array.from(new Set([...prev, u.id])) : prev.filter((id) => id !== u.id),
                        );
                      }}
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={contactOpen}
        onOpenChange={(v: boolean) => {
          if (contactBusy) return;
          setContactOpen(v);
          if (!v) {
            setContactError(null);
            setAttendees([]);
            setContactQuery("");
            setContactIncludeInvited(false);
            setSelectedContactIds([]);
            setContactSubject("");
            setContactBody("");
          }
        }}
        title="Contact attendees"
        description="Select enrolled learners and open your mail client (or copy emails)."
        footer={
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted">
              Selected: <span className="font-semibold text-foreground">{selectedContactIds.length}</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" disabled={contactBusy} onClick={() => setContactOpen(false)}>
                Close
              </Button>
              <Button
                variant="secondary"
                disabled={contactBusy || selectedContactIds.length === 0}
                onClick={async () => {
                  setContactError(null);
                  const selectedEmails = attendees
                    .filter((a) => selectedContactIds.includes(a.userId))
                    .map((a) => a.user.email)
                    .filter(Boolean);

                  if (selectedEmails.length === 0) {
                    setContactError("No emails found for selected attendees.");
                    return;
                  }

                  try {
                    await navigator.clipboard.writeText(selectedEmails.join(", "));
                  } catch {
                    setContactError("Could not copy to clipboard. Try Open email instead.");
                  }
                }}
              >
                Copy emails
              </Button>
              <Button
                variant="primary"
                disabled={contactBusy || selectedContactIds.length === 0}
                onClick={() => {
                  setContactError(null);
                  const selectedEmails = attendees
                    .filter((a) => selectedContactIds.includes(a.userId))
                    .map((a) => a.user.email)
                    .filter(Boolean);

                  if (selectedEmails.length === 0) {
                    setContactError("No emails found for selected attendees.");
                    return;
                  }

                  const bcc = selectedEmails.join(",");
                  const href = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(contactSubject)}&body=${encodeURIComponent(contactBody)}`;
                  window.location.href = href;
                }}
              >
                Open email
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          {contactError && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {contactError}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="contactSubject">Subject</Label>
            <Input
              id="contactSubject"
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              placeholder={`About: ${props.course.title}`}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="contactBody">Message</Label>
            <textarea
              id="contactBody"
              className="min-h-28 w-full rounded-[12px] border border-border bg-background px-3 py-2 text-sm"
              value={contactBody}
              onChange={(e) => setContactBody(e.target.value)}
              placeholder="Write your message"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={contactIncludeInvited}
                onChange={(e) => setContactIncludeInvited(!!e.target.checked)}
              />
              Include invited
            </label>
            {contactBusy && <div className="text-xs text-muted">Loading...</div>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="contactSearch">Search attendees</Label>
            <Input
              id="contactSearch"
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
              placeholder="Search by name or email"
            />
          </div>

          {(() => {
            const q = contactQuery.trim().toLowerCase();
            const filtered = attendees
              .filter((a) => (contactIncludeInvited ? true : a.status === "enrolled"))
              .filter((a) => {
                if (!q) return true;
                return (
                  a.user.name.toLowerCase().includes(q) ||
                  a.user.email.toLowerCase().includes(q)
                );
              });

            const selectAll = () => setSelectedContactIds(filtered.map((a) => a.userId));
            const selectNone = () => setSelectedContactIds([]);

            if (!contactBusy && filtered.length === 0) {
              return (
                <div className="rounded-[12px] border border-border bg-accent p-3 text-sm text-muted">
                  No attendees found.
                </div>
              );
            }

            return (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={contactBusy || filtered.length === 0}
                    onClick={selectAll}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={contactBusy || selectedContactIds.length === 0}
                    onClick={selectNone}
                  >
                    Select none
                  </Button>
                </div>

                <div className="max-h-[260px] space-y-2 overflow-auto pr-1">
                  {filtered.map((a) => {
                    const checked = selectedContactIds.includes(a.userId);
                    return (
                      <label
                        key={a.userId}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border border-border bg-background px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">{a.user.name}</div>
                          <div className="truncate text-xs text-muted">{a.user.email}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              a.status === "enrolled"
                                ? "rounded-full border border-green-200 bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-800"
                                : "rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800"
                            }
                          >
                            {a.status}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const on = !!e.target.checked;
                              setSelectedContactIds((prev) =>
                                on
                                  ? Array.from(new Set([...prev, a.userId]))
                                  : prev.filter((id) => id !== a.userId),
                              );
                            }}
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </Modal>

      <Modal
        open={addOpen}
        onOpenChange={(v: boolean) => {
          if (addBusy) return;
          setAddOpen(v);
          if (!v) {
            setEditLessonId(null);
            setLessonTitle("");
            setLessonType("video");
            setLessonUnitId("");
            setLessonVideoUrl("https://www.youtube.com/watch?v=ysz5S6PUM-U");
            setLessonDocPdfFile(null);
            if (lessonDocPdfInputRef.current) lessonDocPdfInputRef.current.value = "";
            setLessonDuration("10");
            setLessonDescription("");
            setLessonAllowDownload(false);
            setLessonEditorTab("content");
            setLessonAttachments([]);
          }
        }}
        title={isEditing ? "Edit content" : "Add content"}
        description={isEditing ? "Update this lesson." : "Create a new lesson (video/doc/image/quiz)."}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" disabled={addBusy} onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={addBusy}
              onClick={isEditing ? saveLessonEdits : addLesson}
            >
              {addBusy ? "Working..." : isEditing ? "Save" : "Add"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { key: "content", label: "Content" },
              { key: "description", label: "Description" },
              { key: "attachments", label: "Additional Attachments" },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setLessonEditorTab(t.key)}
                className={
                  lessonEditorTab === t.key
                    ? "rounded-[12px] border border-border bg-accent px-4 py-2 text-sm font-semibold"
                    : "rounded-[12px] border border-border bg-background px-4 py-2 text-sm text-muted hover:bg-accent"
                }
                aria-current={lessonEditorTab === t.key ? "page" : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>

          {lessonEditorTab === "content" && (
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="lessonTitle">Title</Label>
                <Input
                  id="lessonTitle"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Lesson title"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lessonUnit">Unit (optional)</Label>
                <select
                  id="lessonUnit"
                  className="h-10 w-full rounded-[10px] border border-border bg-background px-3 text-sm"
                  value={lessonUnitId}
                  onChange={(e) => setLessonUnitId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {props.units
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lessonType">Type</Label>
                <select
                  id="lessonType"
                  className="h-10 w-full rounded-[10px] border border-border bg-background px-3 text-sm"
                  value={lessonType}
                  onChange={(e) => setLessonType(e.target.value as any)}
                  disabled={isEditing}
                >
                  <option value="video">Video</option>
                  <option value="doc">Document</option>
                  <option value="image">Image</option>
                  <option value="quiz">Quiz</option>
                </select>
              </div>

              {(lessonType === "video" || lessonType === "doc" || lessonType === "image") && (
                <div className="grid gap-2">
                  <Label htmlFor="contentUrl">
                    {lessonType === "video" ? "YouTube URL" : lessonType === "doc" ? "Document URL" : "Image URL"}
                  </Label>
                  <Input
                    id="contentUrl"
                    value={lessonVideoUrl}
                    onChange={(e) => setLessonVideoUrl(e.target.value)}
                    placeholder={lessonType === "video" ? "https://www.youtube.com/watch?v=..." : "https://..."}
                  />
                </div>
              )}

              {lessonType === "doc" && (
                <div className="rounded-[12px] border border-border bg-accent p-3">
                  <div className="text-sm font-semibold">Upload PDF (recommended)</div>
                  <div className="mt-1 text-xs text-muted">If you select a PDF, the URL field is ignored.</div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      ref={lessonDocPdfInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      disabled={addBusy}
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setLessonDocPdfFile(f);
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={addBusy}
                      onClick={() => lessonDocPdfInputRef.current?.click()}
                    >
                      Choose PDF
                    </Button>
                    <div className="min-w-0 truncate text-sm font-semibold text-foreground">
                      {lessonDocPdfFile ? lessonDocPdfFile.name : "No file chosen"}
                    </div>
                    {lessonDocPdfFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={addBusy}
                        onClick={() => {
                          setLessonDocPdfFile(null);
                          if (lessonDocPdfInputRef.current) lessonDocPdfInputRef.current.value = "";
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lessonAllowDownload}
                  onChange={(e) => setLessonAllowDownload(!!e.target.checked)}
                />
                Allow download
              </label>
            </div>
          )}

          {lessonEditorTab === "description" && (
            <div className="space-y-2">
              <Label htmlFor="lessonDescription">Description</Label>
              <textarea
                id="lessonDescription"
                className="min-h-28 w-full rounded-[12px] border border-border bg-background px-3 py-2 text-sm"
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="Describe what learners will get from this lesson"
              />
            </div>
          )}

          {lessonEditorTab === "attachments" && (
            <div className="space-y-3">
              {!isEditing ? (
                <div className="rounded-[12px] border border-border bg-accent p-3 text-sm text-muted">
                  Save the lesson first to add attachments.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">Attachments</div>
                      <div className="text-xs text-muted">Add external links or upload a PDF.</div>
                    </div>
                    <Button variant="secondary" onClick={() => setAddAttachmentOpen(true)} disabled={attachmentsBusy}>
                      Add attachment
                    </Button>
                  </div>

                  {attachmentsBusy ? (
                    <div className="text-sm text-muted">Loading...</div>
                  ) : lessonAttachments.length === 0 ? (
                    <div className="rounded-[12px] border border-border bg-accent p-3 text-sm text-muted">
                      No attachments yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lessonAttachments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-background px-3 py-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{a.label || a.url}</div>
                            <div className="truncate text-xs text-muted">{a.url}</div>
                          </div>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-background text-muted hover:bg-accent"
                            title="Delete attachment"
                            onClick={() => setDeleteAttachmentId(a.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={addAttachmentOpen}
        onOpenChange={(v: boolean) => {
          if (addAttachmentBusy) return;
          setAddAttachmentOpen(v);
          if (!v) {
            setAttachmentLabel("");
            setAttachmentUrl("");
            setAttachmentPdfFile(null);
            if (attachmentPdfInputRef.current) attachmentPdfInputRef.current.value = "";
            setAttachmentAllowDownload(false);
          }
        }}
        title="Add attachment"
        description="Add an external link or upload a PDF as an attachment."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" disabled={addAttachmentBusy} onClick={() => setAddAttachmentOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={addAttachmentBusy} onClick={addAttachment}>
              {addAttachmentBusy ? "Working..." : "Add"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="attLabel">Label (optional)</Label>
            <Input id="attLabel" value={attachmentLabel} onChange={(e) => setAttachmentLabel(e.target.value)} placeholder="e.g., Slides" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="attUrl">URL</Label>
            <Input id="attUrl" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="rounded-[12px] border border-border bg-accent p-3">
            <div className="text-sm font-semibold">Upload PDF (optional)</div>
            <div className="mt-1 text-xs text-muted">If you select a PDF, the URL field is ignored.</div>
            <div className="mt-3 flex items-center gap-2">
              <input
                ref={attachmentPdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                disabled={addAttachmentBusy}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setAttachmentPdfFile(f);
                }}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={addAttachmentBusy}
                onClick={() => attachmentPdfInputRef.current?.click()}
              >
                Choose PDF
              </Button>
              <div className="min-w-0 truncate text-sm font-semibold text-foreground">
                {attachmentPdfFile ? attachmentPdfFile.name : "No file chosen"}
              </div>
              {attachmentPdfFile && (
                <Button type="button" variant="ghost" disabled={addAttachmentBusy} onClick={() => setAttachmentPdfFile(null)}>
                  Remove
                </Button>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={attachmentAllowDownload} onChange={(e) => setAttachmentAllowDownload(!!e.target.checked)} />
            Allow download
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteAttachmentId !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteAttachmentId(null);
        }}
        title="Delete attachment?"
        description="This will permanently remove the attachment."
        confirmText="Delete"
        danger
        onConfirm={async () => {
          if (!deleteAttachmentId) return;
          await deleteAttachment(deleteAttachmentId);
          setDeleteAttachmentId(null);
        }}
      />

      <Modal
        open={addQuizOpen}
        onOpenChange={(v: boolean) => {
          if (addQuizBusy) return;
          setAddQuizOpen(v);
        }}
        title="Add quiz"
        description="Creates a new quiz lesson and opens the builder."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" disabled={addQuizBusy} onClick={() => setAddQuizOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={addQuizBusy} onClick={addQuiz}>
              {addQuizBusy ? "Working..." : "Add"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="quizTitle">Title</Label>
            <Input
              id="quizTitle"
              value={addQuizTitle}
              onChange={(e) => setAddQuizTitle(e.target.value)}
              placeholder="Quiz"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quizDuration">Duration (minutes)</Label>
            <Input
              id="quizDuration"
              value={addQuizDuration}
              onChange={(e) => setAddQuizDuration(e.target.value)}
              placeholder="10"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={addQuestionOpen}
        onOpenChange={(v: boolean) => {
          if (addQuestionBusy) return;
          setAddQuestionOpen(v);
        }}
        title="Add question"
        description="Adds a new question to this quiz."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" disabled={addQuestionBusy} onClick={() => setAddQuestionOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={addQuestionBusy} onClick={addQuestion}>
              {addQuestionBusy ? "Working..." : "Add"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-2">
          <Label htmlFor="questionPrompt">Prompt</Label>
          <Input
            id="questionPrompt"
            value={newQuestionPrompt}
            onChange={(e) => setNewQuestionPrompt(e.target.value)}
            placeholder="Write your question here"
          />
        </div>
      </Modal>

      <Modal
        open={addChoiceOpen}
        onOpenChange={(v: boolean) => {
          if (addChoiceBusy) return;
          setAddChoiceOpen(v);
        }}
        title="Add choice"
        description="Adds a new choice to the selected question."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" disabled={addChoiceBusy} onClick={() => setAddChoiceOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={addChoiceBusy} onClick={addChoice}>
              {addChoiceBusy ? "Working..." : "Add"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-2">
          <Label htmlFor="choiceText">Choice text</Label>
          <Input
            id="choiceText"
            value={newChoiceText}
            onChange={(e) => setNewChoiceText(e.target.value)}
            placeholder="Answer option"
          />
        </div>
      </Modal>

      <Modal
        open={editChoiceOpen}
        onOpenChange={(v: boolean) => {
          if (editChoiceBusy) return;
          setEditChoiceOpen(v);
          if (!v) {
            setEditChoiceId(null);
            setEditChoiceText("");
          }
        }}
        title="Edit choice"
        description="Update the text for this choice."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" disabled={editChoiceBusy} onClick={() => setEditChoiceOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={editChoiceBusy} onClick={saveChoiceText}>
              {editChoiceBusy ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-2">
          <Label htmlFor="editChoiceText">Choice text</Label>
          <Input
            id="editChoiceText"
            value={editChoiceText}
            onChange={(e) => setEditChoiceText(e.target.value)}
            placeholder="Answer option"
          />
        </div>
      </Modal>

      <Modal
        open={unitOpen}
        onOpenChange={(v: boolean) => {
          if (unitBusy) return;
          setUnitOpen(v);
          if (!v) {
            setEditUnitId(null);
            setUnitTitle("");
          }
        }}
        title={isEditingUnit ? "Edit unit" : "Add unit"}
        description={isEditingUnit ? "Rename this unit." : "Create a new unit/section for this course."}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" disabled={unitBusy} onClick={() => setUnitOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={unitBusy} onClick={saveUnit}>
              {unitBusy ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-2">
          <Label htmlFor="unitTitle">Unit title</Label>
          <Input
            id="unitTitle"
            value={unitTitle}
            onChange={(e) => setUnitTitle(e.target.value)}
            placeholder="e.g., Module 1: Getting Started"
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteChoiceId !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteChoiceId(null);
        }}
        title="Delete choice?"
        description="This will permanently remove this choice from the question."
        confirmText="Delete"
        danger
        onConfirm={async () => {
          if (!deleteChoiceId) return;
          await deleteChoice(deleteChoiceId);
          setDeleteChoiceId(null);
        }}
      />

      <ConfirmDialog
        open={deleteLessonId !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteLessonId(null);
        }}
        title="Delete content?"
        description="This will permanently remove the content from this course."
        confirmText="Delete"
        danger
        onConfirm={async () => {
          if (!deleteLessonId) return;
          await deleteLesson(deleteLessonId);
          setDeleteLessonId(null);
        }}
      />

      <ConfirmDialog
        open={deleteUnitId !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteUnitId(null);
        }}
        title="Delete unit?"
        description="Lessons in this unit will be moved to Unassigned."
        confirmText="Delete"
        danger
        onConfirm={async () => {
          if (!deleteUnitId) return;
          await deleteUnit(deleteUnitId);
          setDeleteUnitId(null);
        }}
      />

      <Modal
        open={previewOpen}
        onOpenChange={(v: boolean) => setPreviewOpen(v)}
        title="Course preview"
        description="Preview how learners will see this course (without leaving Backoffice)."
        footer={
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="secondary"
              onClick={() => window.open(`/courses/${props.course.id}`, "_blank", "noopener,noreferrer")}
            >
              Open learner page
            </Button>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="overflow-hidden rounded-[14px] border border-border bg-background">
              <div className="flex aspect-[4/3] items-center justify-center bg-accent text-xs text-muted">
                {thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt="Course thumbnail"
                    src={thumbnailUrl}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "No thumbnail"
                )}
              </div>
            </div>

            <div className="min-w-0 space-y-2">
              <div className="text-lg font-semibold text-foreground">{title.trim() || "Untitled course"}</div>
              {tagsText.trim() ? (
                <div className="flex flex-wrap gap-2">
                  {tagsText
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .slice(0, 8)
                    .map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border bg-background px-2 py-1 text-xs text-muted"
                      >
                        {t}
                      </span>
                    ))}
                </div>
              ) : null}

              <div className="rounded-[12px] border border-border bg-accent p-3 text-sm text-muted">
                {description.trim() || "No description yet."}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" disabled>
                  Start learning
                </Button>
                <div className="text-xs text-muted">
                  {props.course.published ? "Published" : "Draft"} • {props.course.visibility === "everyone" ? "Public" : "Signed-in"} • {props.course.accessRule}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] border border-border bg-background">
            <div className="border-b border-border px-4 py-3 text-sm font-semibold">Content</div>
            <div className="p-4">
              {(() => {
                const lessonsSorted = props.lessons.slice().sort((a, b) => a.sortOrder - b.sortOrder);
                const unitsSorted = props.units.slice().sort((a, b) => a.sortOrder - b.sortOrder);
                const unassigned = lessonsSorted.filter((l) => !l.unitId);

                if (lessonsSorted.length === 0 && unitsSorted.length === 0) {
                  return <div className="text-sm text-muted">No content yet.</div>;
                }

                const renderLesson = (l: BackofficeLessonListItem) => (
                  <div key={l.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-surface px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{l.title}</div>
                      <div className="text-xs text-muted">
                        {l.type === "doc"
                          ? "Document"
                          : l.type === "quiz"
                            ? "Quiz"
                            : l.type === "image"
                              ? "Image"
                              : "Video"}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.open(`/learn/${props.course.id}/${l.routeLessonId}`, "_blank", "noopener,noreferrer")}
                    >
                      Open
                    </Button>
                  </div>
                );

                return (
                  <div className="space-y-4">
                    {unitsSorted.map((u) => {
                      const unitLessons = lessonsSorted.filter((l) => l.unitId === u.id);
                      return (
                        <div key={u.id} className="space-y-2">
                          <div className="text-xs font-semibold text-muted">{u.title}</div>
                          {unitLessons.length === 0 ? (
                            <div className="text-sm text-muted">No content in this unit.</div>
                          ) : (
                            <div className="space-y-2">{unitLessons.map(renderLesson)}</div>
                          )}
                        </div>
                      );
                    })}

                    {(unassigned.length > 0 || unitsSorted.length === 0) && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted">Unassigned</div>
                        {unassigned.length === 0 ? (
                          <div className="text-sm text-muted">No unassigned content.</div>
                        ) : (
                          <div className="space-y-2">{unassigned.map(renderLesson)}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
