export type CourseVisibility = "everyone" | "signed_in";
export type CourseAccessRule = "open" | "invitation" | "payment";

export type Course = {
  id: string;
  title: string;
  tags: string[];
  views: number;
  lessonCount: number;
  durationMinutes: number;
  published: boolean;
  visibility: CourseVisibility;
  accessRule: CourseAccessRule;
  priceInr?: number;
};

export type Enrollment = {
  userId: string;
  courseId: string;
};

export type CourseProgress = {
  userId: string;
  courseId: string;
  completionPercent: number; // 0..100
  lastLessonId?: string;
};
