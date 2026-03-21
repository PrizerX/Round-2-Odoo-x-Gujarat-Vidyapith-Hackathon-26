"use client";

import Link from "next/link";
import * as React from "react";
import {
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  PanelLeftClose,
  Paperclip,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { useRouter } from "next/navigation";

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  allowMultipleCorrect: boolean;
  correctIndices: number[];
};

export type QuizDefinition = {
  id: string;
  title: string;
  allowMultipleAttempts: boolean;
  pointsPerCorrect: number;
  // Optional attempt-based scoring override. Index 0 = attempt 1, index 1 = attempt 2, etc.
  pointsPerCorrectByAttempt?: number[];
  questions: QuizQuestion[];
};

export type LessonAttachment = {
  id: string;
  kind: "file" | "link";
  label: string | null;
  url: string;
  allowDownload: boolean;
  createdAt: string;
};

export type PlayerLesson = {
  id: string;
  title: string;
  type: "video" | "doc" | "image" | "quiz";
  visited: boolean;
  completed: boolean;
  locked: boolean;
  description?: string;
  videoUrl?: string;
  allowDownload?: boolean;
  attachments?: LessonAttachment[];
  quiz?: QuizDefinition;
  unitId?: string | null;
  unitTitle?: string | null;
  unitSortOrder?: number | null;
};

function lessonTypeLabel(type: PlayerLesson["type"]): string {
  switch (type) {
    case "video":
      return "Video";
    case "doc":
      return "Document";
    case "image":
      return "Image";
    case "quiz":
      return "Quiz";
    default:
      return "Content";
  }
}

function toYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);

    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "").trim();
      if (!id) return null;
      return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
    }

    if (u.hostname.endsWith("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) {
        const id = u.pathname.split("/embed/")[1]?.split("/")[0]?.trim();
        if (!id) return null;
        return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
      }

      const id = u.searchParams.get("v");
      if (!id) return null;
      return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
    }

    return null;
  } catch {
    return null;
  }
}

function isPdfUrl(url: string): boolean {
  const u = url.toLowerCase();
  const base = u.split("?")[0]?.split("#")[0] ?? u;
  return base.endsWith(".pdf") || u.includes("application/pdf");
}

function buildPdfEmbedUrl(url: string, allowDownload: boolean | null | undefined): string {
  const trimmed = String(url || "").trim();
  if (!trimmed) return trimmed;
  if (allowDownload) return trimmed;

  // Best-effort: hide the built-in PDF viewer toolbar.
  // Note: this is a UX control only; users can still save PDFs via devtools/network.
  const base = trimmed.split("#")[0] ?? trimmed;
  return `${base}#toolbar=0&navpanes=0&scrollbar=0`;
}

function LessonAttachments(props: { attachments: LessonAttachment[] | null | undefined }) {
  const attachments = props.attachments ?? [];
  const [openPdf, setOpenPdf] = React.useState<null | { title: string; url: string; allowDownload: boolean }>(null);

  if (attachments.length === 0) return null;

  return (
    <>
      <div className="rounded-[16px] border border-border bg-background p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Paperclip className="h-4 w-4" />
          Attachments
        </div>
        <div className="mt-3 space-y-2">
          {attachments.map((a) => {
            const title = a.label || a.url;
            const pdf = isPdfUrl(a.url);
            return (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-surface px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{title}</div>
                  <div className="truncate text-xs text-muted">{a.url}</div>
                </div>
                <div className="flex items-center gap-2">
                  {pdf ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setOpenPdf({ title, url: a.url, allowDownload: !!a.allowDownload })}
                    >
                      View
                    </Button>
                  ) : (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-700 underline"
                    >
                      Open
                    </a>
                  )}
                  {a.allowDownload && (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-700 underline"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        open={openPdf !== null}
        onOpenChange={(v) => {
          if (!v) setOpenPdf(null);
        }}
        title={openPdf?.title ?? "Attachment"}
        description="PDF preview"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpenPdf(null)}>
              Close
            </Button>
            {openPdf?.url && openPdf?.allowDownload && (
              <a
                href={openPdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[12px] bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Open in new tab
              </a>
            )}
          </div>
        }
      >
        {openPdf?.url ? (
          <div className="h-[75vh] overflow-hidden rounded-[16px] border border-border bg-surface">
            <iframe
              className="h-full w-full"
              src={buildPdfEmbedUrl(openPdf.url, openPdf.allowDownload)}
              title={openPdf.title}
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function PlayerContentViewer(props: { lesson: PlayerLesson | null | undefined }) {
  const lesson = props.lesson;
  if (!lesson) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-[16px] border border-border bg-accent text-sm text-muted">
        Content not available
      </div>
    );
  }

  if (lesson.type === "video") {
    const url = lesson.videoUrl;
    const yt = url ? toYouTubeEmbedUrl(url) : null;
    if (yt) {
      return (
        <div className="space-y-4">
          <div className="aspect-video w-full overflow-hidden rounded-[16px] border border-border bg-black">
            <iframe
              className="h-full w-full"
              src={yt}
              title={lesson.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <LessonAttachments attachments={lesson.attachments} />
        </div>
      );
    }

    return (
      <div className="flex h-[60vh] items-center justify-center rounded-[16px] border border-border bg-accent text-sm text-muted">
        Video link missing
      </div>
    );
  }

  if (lesson.type === "image") {
    const url = lesson.videoUrl;
    if (!url) {
      return (
        <div className="flex h-[60vh] items-center justify-center rounded-[16px] border border-border bg-accent text-sm text-muted">
          Image link missing
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-[16px] border border-border bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={lesson.title} src={url} className="h-auto w-full object-contain" />
        </div>
        {lesson.allowDownload && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm text-emerald-700 underline"
          >
            Download image
          </a>
        )}
        <LessonAttachments attachments={lesson.attachments} />
      </div>
    );
  }

  if (lesson.type === "doc") {
    const url = lesson.videoUrl;
    if (!url) {
      return (
        <div className="flex h-[60vh] items-center justify-center rounded-[16px] border border-border bg-accent text-sm text-muted">
          Document link missing
        </div>
      );
    }

    const isPdf = isPdfUrl(url);
    return (
      <div className="space-y-3">
        {isPdf ? (
          <div className="h-[70vh] overflow-hidden rounded-[16px] border border-border bg-surface">
            <iframe
              className="h-full w-full"
              src={buildPdfEmbedUrl(url, lesson.allowDownload)}
              title={lesson.title}
            />
          </div>
        ) : (
          <div className="rounded-[16px] border border-border bg-surface p-5 text-sm">
            <div className="text-sm font-semibold">Open document</div>
            <div className="mt-1 break-all text-xs text-muted">{url}</div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {(!isPdf || lesson.allowDownload) && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm text-emerald-700 underline"
            >
              Open in new tab
            </a>
          )}
          {lesson.allowDownload && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-sm text-emerald-700 underline"
            >
              Download
            </a>
          )}
        </div>

        <LessonAttachments attachments={lesson.attachments} />
      </div>
    );
  }

  if (lesson.type === "quiz") {
    return (
      <div className="space-y-4">
        <QuizViewer quiz={lesson.quiz} />
        <LessonAttachments attachments={lesson.attachments} />
      </div>
    );
  }

  return (
    <div className="flex h-[60vh] items-center justify-center rounded-[16px] border border-border bg-accent text-sm text-muted">
      {lessonTypeLabel(lesson.type)} Viewer Placeholder
    </div>
  );
}

function QuizViewer(props: {
  quiz?: QuizDefinition;
  courseId?: string;
  storageKey?: string;
  onCompleted?: (result: {
    courseId: string;
    quizId: string;
    points: number;
    attemptId?: string;
    attemptNumber: number;
    correctCount: number;
    totalQuestions: number;
  }) => void;
}) {
  const quiz = props.quiz;

  const [phase, setPhase] = React.useState<"intro" | "in_progress" | "done">(
    "intro",
  );
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number[]>>({});
  const [attempt, setAttempt] = React.useState(0);
  const [attemptId, setAttemptId] = React.useState<string | undefined>(undefined);
  const [resultOpen, setResultOpen] = React.useState(false);
  const [earnedPoints, setEarnedPoints] = React.useState(0);
  const [questionAttempts, setQuestionAttempts] = React.useState<Record<string, number>>({});
  const [questionCorrectAttempt, setQuestionCorrectAttempt] = React.useState<Record<string, number>>({});
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const questions = quiz?.questions ?? [];
  const total = questions.length;
  const current = questions[index];

  React.useEffect(() => {
    // Reset when quiz changes (navigating between lessons).
    setPhase("intro");
    setIndex(0);
    setAnswers({});
    setAttemptId(undefined);
    setQuestionAttempts({});
    setQuestionCorrectAttempt({});
    setFeedback(null);
    // Persist attempts per quiz (MVP via localStorage).
    if (typeof window !== "undefined" && props.storageKey) {
      try {
        const raw = window.localStorage.getItem(`learnova_quiz_attempt_${props.storageKey}`);
        const n = raw ? Number(raw) : 0;
        setAttempt(Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0);
      } catch {
        setAttempt(0);
      }

      try {
        const raw = window.localStorage.getItem(`learnova_quiz_question_state_${props.storageKey}`);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            attempts?: Record<string, number>;
            correctAttempts?: Record<string, number>;
          };
          if (parsed && typeof parsed === "object") {
            if (parsed.attempts && typeof parsed.attempts === "object") {
              setQuestionAttempts(parsed.attempts);
            }
            if (parsed.correctAttempts && typeof parsed.correctAttempts === "object") {
              setQuestionCorrectAttempt(parsed.correctAttempts);
            }
          }
        }
      } catch {
        // ignore
      }
    } else {
      setAttempt(0);
    }

    // L3: prefer DB-backed attempt count for signed-in users (best-effort).
    let active = true;
    if (quiz?.id) {
      fetch(`/api/learning/attempt?quizId=${encodeURIComponent(quiz.id)}`)
        .then(async (res) => {
          if (!res.ok) return null;
          const data = (await res.json()) as unknown;
          if (typeof data !== "object" || !data) return null;
          const n = (data as { attemptNumber?: unknown }).attemptNumber;
          if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null;
          return Math.floor(n);
        })
        .then((n) => {
          if (!active) return;
          if (typeof n === "number") setAttempt(n);
        })
        .catch(() => {
          // ignore
        });
    }

    setResultOpen(false);
    setEarnedPoints(0);

    return () => {
      active = false;
    };
  }, [quiz?.id, props.storageKey]);

  if (!quiz || total === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-[16px] border border-border bg-accent text-sm text-muted">
        Quiz not configured
      </div>
    );
  }

  const selectedIndices = current ? (answers[current.id] ?? []) : [];
  const canProceed = selectedIndices.length > 0;
  const currentAttemptNumber = current
    ? Math.max(1, (questionAttempts[current.id] ?? 0) + 1)
    : 1;

  const pointsPerCorrectForAttempt = (attemptNumber: number) => {
    const byAttempt = quiz.pointsPerCorrectByAttempt;
    if (Array.isArray(byAttempt) && byAttempt.length > 0) {
      const idx = Math.max(0, attemptNumber - 1);
      const v = byAttempt[idx] ?? byAttempt[byAttempt.length - 1];
      if (typeof v === "number" && Number.isFinite(v) && v > 0) return Math.round(v);
    }

    if (!quiz.allowMultipleAttempts) return quiz.pointsPerCorrect;

    // Sensible default reduction curve when not configured.
    const multipliers = [1, 0.8, 0.6, 0.4];
    const m = multipliers[Math.min(multipliers.length - 1, Math.max(0, attemptNumber - 1))] ?? 1;
    return Math.max(1, Math.round(quiz.pointsPerCorrect * m));
  };

  const scoreQuiz = (attemptNumber: number) => {
    let correct = 0;
    let totalPoints = 0;
    for (const q of questions) {
      const answeredAttempt = questionCorrectAttempt[q.id];
      if (typeof answeredAttempt !== "number" || !Number.isFinite(answeredAttempt)) continue;
      correct += 1;
      totalPoints += pointsPerCorrectForAttempt(Math.max(1, Math.floor(answeredAttempt)));
    }

    const raw = totalPoints;
    const points = Math.max(5, Math.min(100, raw));
    const perCorrect = pointsPerCorrectForAttempt(attemptNumber);
    return { correct, perCorrect, points };
  };

  const onStart = () => {
    // Try DB-backed attempt increment first.
    const courseId = props.courseId;
    if (courseId && quiz?.id) {
      fetch("/api/learning/attempt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, quizId: quiz.id }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("attempt_failed");
          const data = (await res.json()) as unknown;
          if (typeof data !== "object" || !data) throw new Error("bad_payload");
          const attemptNumber = (data as { attemptNumber?: unknown }).attemptNumber;
          const id = (data as { attemptId?: unknown }).attemptId;
          if (typeof attemptNumber === "number" && Number.isFinite(attemptNumber)) {
            setAttempt(Math.max(0, Math.floor(attemptNumber)));
            if (typeof window !== "undefined" && props.storageKey) {
              try {
                window.localStorage.setItem(
                  `learnova_quiz_attempt_${props.storageKey}`,
                  String(Math.max(0, Math.floor(attemptNumber))),
                );
              } catch {
                // ignore
              }
            }
          }
          if (typeof id === "string") setAttemptId(id);
        })
        .catch(() => {
          // Fallback: localStorage-only (MVP)
          setAttempt((a) => {
            const next = a + 1;
            if (typeof window !== "undefined" && props.storageKey) {
              try {
                window.localStorage.setItem(
                  `learnova_quiz_attempt_${props.storageKey}`,
                  String(next),
                );
              } catch {
                // ignore
              }
            }
            return next;
          });
        });
    } else {
      setAttempt((a) => {
        const next = a + 1;
        if (typeof window !== "undefined" && props.storageKey) {
          try {
            window.localStorage.setItem(`learnova_quiz_attempt_${props.storageKey}`,
              String(next),
            );
          } catch {
            // ignore
          }
        }
        return next;
      });
    }
    setPhase("in_progress");
  };

  const onProceed = () => {
    if (!canProceed) return;
    if (!current) return;

    const selected = selectedIndices;
    const selectedSet = Array.from(new Set(selected)).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    const correctSet = Array.from(new Set(current.correctIndices ?? [])).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    const isMatch =
      selectedSet.length === correctSet.length &&
      selectedSet.every((v, i) => v === correctSet[i]);

    const attemptNumber = Math.max(1, (questionAttempts[current.id] ?? 0) + 1);

    if (isMatch) {
      setQuestionCorrectAttempt((prev) => ({
        ...prev,
        [current.id]: prev[current.id] ?? attemptNumber,
      }));
      setFeedback(null);
    } else if (quiz.allowMultipleAttempts) {
      setQuestionAttempts((prev) => ({
        ...prev,
        [current.id]: (prev[current.id] ?? 0) + 1,
      }));
      setAnswers((prev) => ({ ...prev, [current.id]: [] }));
      setFeedback("Not quite. Try again to earn points for this question.");
      return;
    } else {
      setFeedback(null);
    }

    if (index < total - 1) {
      setIndex((v) => v + 1);
      return;
    }

    const overallAttempt = Math.max(1, attempt);
    const { correct, points } = scoreQuiz(overallAttempt);
    setEarnedPoints(points);
    setPhase("done");
    setResultOpen(true);
    props.onCompleted?.({
      courseId: props.courseId ?? "",
      quizId: quiz.id,
      points,
      attemptId,
      attemptNumber: overallAttempt,
      correctCount: correct,
      totalQuestions: total,
    });
  };

  const onRetry = () => {
    setIndex(0);
    setAnswers({});
    setQuestionAttempts({});
    setQuestionCorrectAttempt({});
    setFeedback(null);
    setPhase("intro");
    setResultOpen(false);
    setEarnedPoints(0);

    if (typeof window !== "undefined" && props.storageKey) {
      try {
        window.localStorage.removeItem(`learnova_quiz_question_state_${props.storageKey}`);
      } catch {
        // ignore
      }
    }
  };

  React.useEffect(() => {
    if (typeof window === "undefined" || !props.storageKey) return;
    try {
      window.localStorage.setItem(
        `learnova_quiz_question_state_${props.storageKey}`,
        JSON.stringify({
          attempts: questionAttempts,
          correctAttempts: questionCorrectAttempt,
        }),
      );
    } catch {
      // ignore
    }
  }, [props.storageKey, questionAttempts, questionCorrectAttempt]);

  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <div className="rounded-[16px] border border-border bg-surface p-6">
          <div className="space-y-2 text-sm">
            <div className="text-sm text-muted">- Total Questions '{total}'</div>
            <div className="text-sm text-muted">
              - {quiz.allowMultipleAttempts ? "Multiple Attempts" : "Single Attempt"}
            </div>
            {quiz.allowMultipleAttempts && (
              <div className="text-sm text-muted">- Attempt-based scoring enabled</div>
            )}
          </div>
        </div>

        <Button onClick={onStart}>Start Quiz</Button>
      </div>
    );
  }

  // in_progress + done render the same question view (done just opens modal)
  return (
    <div className="space-y-6">
      <div className="text-sm text-muted">Question {Math.min(total, index + 1)} of {total}</div>

      <div className="relative rounded-[16px] border border-border bg-surface p-5">
        <div className="text-sm font-medium text-foreground">{current?.prompt ?? "Question"}</div>
        <div className="mt-1 text-xs text-muted">
          {current?.allowMultipleCorrect ? "Select all that apply" : "Select one option"}
        </div>
        <div className="absolute right-4 top-4 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          Attempt {currentAttemptNumber} • {pointsPerCorrectForAttempt(currentAttemptNumber)} pts
        </div>
      </div>

      {feedback && (
        <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {feedback}
        </div>
      )}

      <div className="space-y-3">
        {(current?.options ?? []).map((opt, i) => {
          const selected = selectedIndices.includes(i);
          return (
            <button
              key={opt}
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-[14px] border border-border bg-surface px-4 py-3 text-left transition-colors",
                selected ? "ring-2 ring-emerald-200" : "hover:bg-accent",
              )}
              onClick={() => {
                if (!current) return;
                setAnswers((prev) => {
                  const prevSelected = prev[current.id] ?? [];
                  if (current.allowMultipleCorrect) {
                    const exists = prevSelected.includes(i);
                    const next = exists ? prevSelected.filter((x) => x !== i) : [...prevSelected, i];
                    return { ...prev, [current.id]: next };
                  }
                  return { ...prev, [current.id]: [i] };
                });
              }}
            >
              <span
                className={cn(
                  current?.allowMultipleCorrect
                    ? "flex h-5 w-5 items-center justify-center rounded-[6px] border"
                    : "flex h-5 w-5 items-center justify-center rounded-full border",
                  selected ? "border-emerald-600 bg-emerald-50" : "border-muted bg-white",
                )}
                aria-hidden="true"
              >
                {selected && (
                  current?.allowMultipleCorrect
                    ? <span className="h-2.5 w-2.5 rounded-[3px] bg-emerald-600" />
                    : <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                )}
              </span>
              <span className="text-sm text-foreground">{opt}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center">
        <Button onClick={onProceed} disabled={!canProceed}>
          Proceed
        </Button>
      </div>

      <Modal
        open={resultOpen}
        onOpenChange={(open) => {
          setResultOpen(open);
        }}
        className="max-w-3xl"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setResultOpen(false)}
            className="absolute right-0 top-0 rounded-full p-2 text-muted hover:bg-accent"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-3xl font-semibold text-foreground">
            Bingo! <span className="font-medium">You have earned!</span>
          </div>

          <div className="mt-4">
            <div className="text-sm text-muted">{earnedPoints} points</div>
            {quiz.allowMultipleAttempts && (
              <div className="mt-1 text-xs text-muted">Attempt {Math.max(1, attempt)}</div>
            )}
            <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-accent">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${Math.max(0, Math.min(100, (earnedPoints / 100) * 100))}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-muted">
              <div>5 Points</div>
              <div>100 Points</div>
            </div>
          </div>

          <div className="mt-8 text-xl text-muted">Reach the next rank to gain more points.</div>

          <div className="mt-8 flex items-center justify-end gap-2">
            {quiz.allowMultipleAttempts && (
              <Button variant="secondary" onClick={onRetry}>
                Retry
              </Button>
            )}
            <Button onClick={() => setResultOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function LearnerPlayerClient(props: {
  courseId: string;
  courseTitle: string;
  completionPercent: number;
  lessons: PlayerLesson[];
  currentLessonId: string;
}) {
  const router = useRouter();
  const { courseId, courseTitle, completionPercent, lessons, currentLessonId } = props;

  const [collapsed, setCollapsed] = React.useState(false);
  const [courseCompleted, setCourseCompleted] = React.useState(false);
  const [markBusy, setMarkBusy] = React.useState(false);
  const [markError, setMarkError] = React.useState<string | null>(null);

  const currentIndex = Math.max(
    0,
    lessons.findIndex((l) => l.id === currentLessonId),
  );
  const current = lessons[currentIndex] ?? lessons[0];
  const prev = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const next = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const effectiveCompletionPercent = courseCompleted ? 100 : completionPercent;
  const effectiveLessons = courseCompleted
    ? lessons.map((l) => ({ ...l, visited: true, completed: true, locked: false }))
    : lessons;

  const unitGroups = React.useMemo(() => {
    const byUnit = new Map<
      string,
      { id: string; title: string; sortOrder: number | null; lessons: PlayerLesson[] }
    >();
    const unassigned: PlayerLesson[] = [];

    for (const lesson of effectiveLessons) {
      const unitId = typeof lesson.unitId === "string" && lesson.unitId ? lesson.unitId : null;
      const unitTitle = typeof lesson.unitTitle === "string" && lesson.unitTitle ? lesson.unitTitle : null;
      if (!unitId || !unitTitle) {
        unassigned.push(lesson);
        continue;
      }

      const existing = byUnit.get(unitId);
      if (existing) {
        existing.lessons.push(lesson);
        continue;
      }

      byUnit.set(unitId, {
        id: unitId,
        title: unitTitle,
        sortOrder: typeof lesson.unitSortOrder === "number" ? lesson.unitSortOrder : null,
        lessons: [lesson],
      });
    }

    if (byUnit.size === 0) return null;

    const units = Array.from(byUnit.values()).sort((a, b) => {
      const ao = a.sortOrder ?? 1e9;
      const bo = b.sortOrder ?? 1e9;
      if (ao !== bo) return ao - bo;
      return a.title.localeCompare(b.title);
    });

    return { units, unassigned };
  }, [effectiveLessons]);

  const currentEffective =
    courseCompleted && current
      ? { ...current, visited: true, completed: true, locked: false }
      : current;

  const renderLessonLink = (lesson: PlayerLesson) => {
    const active = lesson.id === currentLessonId;
    const label = lessonTypeLabel(lesson.type);

    const state: "completed" | "visited" | "unvisited" = lesson.completed
      ? "completed"
      : lesson.visited
        ? "visited"
        : "unvisited";

    const statusClass =
      state === "completed"
        ? "border-emerald-600 bg-emerald-50"
        : state === "visited"
          ? "border-orange-500 bg-orange-50"
          : "border-muted bg-white";
    const dotClass =
      state === "completed"
        ? "bg-emerald-600"
        : state === "visited"
          ? "bg-orange-500"
          : "";

    const content = (
      <>
        <div className={cn("flex items-start justify-between gap-3", collapsed && "justify-center")}>
          <div className={cn("min-w-0", collapsed && "hidden")}>
            <div className="text-xs font-semibold text-primary">{label}</div>
            <div className="mt-1 line-clamp-2 text-sm font-medium text-foreground">{lesson.title}</div>
            {!lesson.locked && (
              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <Paperclip className="h-3.5 w-3.5" />
                <span>Additional attachments</span>
              </div>
            )}
            {lesson.locked && (
              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <Lock className="h-3.5 w-3.5" />
                <span>Locked — complete previous content</span>
              </div>
            )}
          </div>

          <div className={cn("flex items-center gap-2", collapsed && "flex-col")}
          >
            {lesson.locked && <Lock className={cn("h-4 w-4 text-muted", collapsed && "h-5 w-5")} aria-hidden="true" />}
            <div
              className={cn("flex h-6 w-6 items-center justify-center rounded-full border", statusClass)}
              aria-label={
                lesson.completed
                  ? "Completed"
                  : lesson.visited
                    ? "Visited"
                    : "Unvisited"
              }
              title={
                lesson.completed
                  ? "Completed"
                  : lesson.visited
                    ? "Visited (not complete)"
                    : "Unvisited"
              }
            >
              {dotClass ? <div className={cn("h-3 w-3 rounded-full", dotClass)} /> : null}
            </div>
          </div>
        </div>

        {collapsed && (
          <div className="mt-2 flex items-center justify-center text-xs font-semibold text-primary">{label}</div>
        )}
      </>
    );

    if (lesson.locked) {
      return (
        <div
          key={lesson.id}
          className={cn(
            "block cursor-not-allowed rounded-[14px] border border-border bg-surface px-3 py-3 opacity-70",
            active ? "ring-2 ring-emerald-200" : "",
            collapsed && "px-2",
          )}
          title="Locked — complete previous content"
          aria-disabled="true"
        >
          {content}
        </div>
      );
    }

    return (
      <Link
        key={lesson.id}
        href={`/learn/${courseId}/${lesson.id}`}
        className={cn(
          "block rounded-[14px] border border-border bg-surface px-3 py-3 transition-colors",
          active ? "ring-2 ring-emerald-200" : "hover:bg-accent",
          collapsed && "px-2",
        )}
        title={lesson.title}
      >
        {content}
      </Link>
    );
  };

  return (
    <div className={cn("grid gap-4", collapsed ? "lg:grid-cols-[84px_1fr]" : "lg:grid-cols-[340px_1fr]")}> 
      <aside className="rounded-[16px] border border-border bg-surface p-3">
        <div className={cn("flex items-center justify-between gap-2", collapsed && "flex-col items-stretch")}> 
          <Link href="/my-courses" className={cn(collapsed && "hidden lg:block")}> 
            <Button variant="secondary" size="sm" className={cn("gap-2", collapsed && "w-full justify-center")}> 
              <ArrowLeft className="h-4 w-4" />
              <span className={cn(collapsed && "hidden")}>Back</span>
            </Button>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            className={cn("shrink-0", collapsed && "w-full justify-center")}
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <div className={cn("mt-3", collapsed && "hidden lg:block")}> 
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="truncate">{courseTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted">
                <span className="font-semibold text-emerald-700">{effectiveCompletionPercent}%</span> Completed
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                <div className="h-full bg-emerald-500" style={{ width: `${effectiveCompletionPercent}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={cn("mt-4 space-y-2", collapsed && "mt-3")}> 
          {unitGroups ? (
            <div className={cn("space-y-4", collapsed && "space-y-2")}>
              {unitGroups.units.map((u) => (
                <div key={u.id} className={cn("space-y-2", collapsed && "space-y-2")}>
                  {!collapsed && (
                    <div className="px-1 pt-1 text-xs font-semibold text-muted">{u.title}</div>
                  )}
                  <div className="space-y-2">{u.lessons.map(renderLessonLink)}</div>
                </div>
              ))}

              {unitGroups.unassigned.length > 0 ? (
                <div className="space-y-2">
                  {!collapsed && (
                    <div className="px-1 pt-1 text-xs font-semibold text-muted">Unassigned</div>
                  )}
                  <div className="space-y-2">{unitGroups.unassigned.map(renderLessonLink)}</div>
                </div>
              ) : null}
            </div>
          ) : (
            effectiveLessons.map(renderLessonLink)
          )}
        </div>
      </aside>

      <section className="space-y-4">
        <div className="rounded-[16px] border border-border bg-accent p-3 text-sm text-muted">
          {currentEffective?.description ?? "Description of the content should be visible here (set in background for the user)."}
        </div>

        <div className="text-lg font-semibold text-primary sm:text-xl">
          {currentEffective?.title ?? "Lesson"}
        </div>

        {currentEffective?.type === "quiz" ? (
          <QuizViewer
            quiz={currentEffective.quiz}
            courseId={courseId}
            storageKey={currentEffective.quiz ? `${courseId}:${currentEffective.quiz.id}` : undefined}
            onCompleted={async (result) => {
              try {
                // Mark the quiz lesson as complete (unlocks next content).
                await fetch("/api/learning/lesson-progress", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ courseId, lessonId: currentLessonId, action: "complete" }),
                });
              } catch {
                // ignore
              }

              try {
                const res = await fetch("/api/learning/complete", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    courseId,
                    points: result.points,
                    quizId: result.quizId,
                    attemptId: result.attemptId,
                    attemptNumber: result.attemptNumber,
                    correctCount: result.correctCount,
                    totalQuestions: result.totalQuestions,
                  }),
                });
                if (res.ok) setCourseCompleted(true);
              } catch {
                // demo-only: ignore network errors
              }

              router.refresh();
            }}
          />
        ) : (
          <PlayerContentViewer lesson={currentEffective} />
        )}

        <div className="rounded-[16px] border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-foreground">Lesson completion</div>
            <div className="text-xs text-muted">
              {currentEffective?.completed
                ? "Completed"
                : currentEffective?.visited
                  ? "Visited (not complete)"
                  : "Not visited"}
            </div>
          </div>

          {markError && <div className="mt-2 text-sm text-red-700">{markError}</div>}

          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              disabled={!currentEffective || currentEffective.completed || markBusy || courseCompleted}
              onClick={async () => {
                if (!currentEffective) return;
                setMarkBusy(true);
                setMarkError(null);
                try {
                  const res = await fetch("/api/learning/lesson-progress", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ courseId, lessonId: currentLessonId, action: "complete" }),
                  });
                  if (!res.ok) {
                    const data = (await res.json().catch(() => null)) as any;
                    throw new Error(typeof data?.error === "string" ? data.error : "Failed to mark complete");
                  }
                  router.refresh();
                } catch (e) {
                  setMarkError(e instanceof Error ? e.message : "Failed to mark complete");
                } finally {
                  setMarkBusy(false);
                }
              }}
            >
              {currentEffective?.completed ? "Completed" : markBusy ? "Marking…" : "Mark as complete"}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {prev ? (
            <Link href={`/learn/${courseId}/${prev.id}`}>
              <Button variant="secondary" size="sm">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          ) : (
            <Button variant="secondary" size="sm" disabled>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}

          {next && (courseCompleted || !!currentEffective?.completed) && !next.locked ? (
            <Link href={`/learn/${courseId}/${next.id}`}>
              <Button size="sm">
                Next Content
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button size="sm" disabled title={!currentEffective?.completed ? "Mark current content complete to unlock next" : "Next content is locked"}>
              Next Content
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
