import { cookies } from "next/headers";

const COOKIE_NAME = "learnova_course_points";

type PointsMap = Record<string, number>;

function sanitizePointsMap(value: unknown): PointsMap {
  if (!value || typeof value !== "object") return {};
  const out: PointsMap = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof k !== "string" || !k) continue;
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    const points = Math.max(0, Math.min(1000, Math.round(v)));
    out[k] = points;
  }
  return out;
}

export async function getCoursePointsMap(): Promise<PointsMap> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return {};

  try {
    return sanitizePointsMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

export async function getEarnedPointsForCourse(courseId: string): Promise<number> {
  const map = await getCoursePointsMap();
  return map[courseId] ?? 0;
}

export async function getTotalEarnedPoints(): Promise<number> {
  const map = await getCoursePointsMap();
  return Object.values(map).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
}

export const COURSE_POINTS_COOKIE = COOKIE_NAME;
