export type BadgeLevel = {
  name: "Newbie" | "Explorer" | "Achiever" | "Specialist" | "Expert" | "Master";
  minPoints: number;
};

export const BADGE_LEVELS: BadgeLevel[] = [
  { name: "Newbie", minPoints: 20 },
  { name: "Explorer", minPoints: 40 },
  { name: "Achiever", minPoints: 60 },
  { name: "Specialist", minPoints: 80 },
  { name: "Expert", minPoints: 100 },
  { name: "Master", minPoints: 120 },
];

export function getBadgeForPoints(points: number): BadgeLevel {
  const safePoints = Number.isFinite(points) ? points : 0;
  let current: BadgeLevel = BADGE_LEVELS[0];
  for (const level of BADGE_LEVELS) {
    if (safePoints >= level.minPoints) current = level;
  }
  return current;
}

export function getNextBadge(points: number): BadgeLevel | null {
  const safePoints = Number.isFinite(points) ? points : 0;
  for (const level of BADGE_LEVELS) {
    if (safePoints < level.minPoints) return level;
  }
  return null;
}

export function formatPointsToNext(points: number): string {
  const next = getNextBadge(points);
  if (!next) return "Max level";
  const remaining = Math.max(0, next.minPoints - points);
  return `${remaining} pts to ${next.name}`;
}
