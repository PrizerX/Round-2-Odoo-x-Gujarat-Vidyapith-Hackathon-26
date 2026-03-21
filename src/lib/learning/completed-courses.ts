import { cookies } from "next/headers";

const COOKIE_NAME = "learnova_completed_courses";

export async function getCompletedCourseIds(): Promise<Set<string>> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return new Set();

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const ids = parsed.filter((v) => typeof v === "string" && v.length > 0);
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export async function isCourseCompleted(courseId: string): Promise<boolean> {
  const ids = await getCompletedCourseIds();
  return ids.has(courseId);
}

export const COMPLETED_COURSES_COOKIE = COOKIE_NAME;
