import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/db/prisma";

async function main() {
  const demoUsers = [
    {
      id: "u_learner_1",
      email: "learner@learnova.dev",
      name: "Learner",
      role: "learner" as const,
      password: "Learner@123",
    },
    {
      id: "u_instructor_1",
      email: "instructor@learnova.dev",
      name: "Instructor",
      role: "instructor" as const,
      password: "Instructor@123",
    },
    {
      id: "u_admin_1",
      email: "admin@learnova.dev",
      name: "Admin",
      role: "admin" as const,
      password: "Admin@123",
    },
  ];

  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (existing && existing.id !== user.id) {
      // Demo-only: keep IDs stable to match in-repo mock learning data.
      await prisma.user.delete({ where: { email: user.email } });
    }

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });
  }

  // Seed a small set of demo course data so evaluators can see tables in Prisma Studio.
  // Note: the current UI still uses mock data for Module B; these rows are scaffolding
  // for Module A + L3 (learning persistence) work.

  const demoCourses = [
    {
      id: "course_1",
      title: "UI Foundations",
      description:
        "Learn the essentials of layout, spacing, and clean UI systems with practical examples.",
      tags: ["Basics", "Design"],
      published: true,
      visibility: "everyone" as const,
      accessRule: "open" as const,
      priceInr: null as number | null,
      website: "https://learnova.local/courses/ui-foundations",
      views: 1240,
      durationMinutes: 80,
      lessonCount: 4,
    },
    {
      id: "course_2",
      title: "Advanced Reporting",
      description:
        "Build powerful reporting dashboards and learn how to interpret data for decisions.",
      tags: ["Analytics", "SQL"],
      published: true,
      visibility: "signed_in" as const,
      accessRule: "invitation" as const,
      priceInr: null as number | null,
      website: "https://learnova.local/courses/advanced-reporting",
      views: 540,
      durationMinutes: 120,
      lessonCount: 6,
    },
    {
      id: "course_3",
      title: "Pro Quizzes",
      description: "Practice with quizzes and attempt-based scoring to earn more points.",
      tags: ["Quizzes"],
      published: true,
      visibility: "everyone" as const,
      accessRule: "payment" as const,
      priceInr: 500,
      website: "https://learnova.local/courses/pro-quizzes",
      views: 310,
      durationMinutes: 95,
      lessonCount: 5,
    },
    {
      id: "course_4",
      title: "Odoo CRM Essentials",
      description:
        "Set up your sales pipeline, manage leads, and track deals end-to-end in Odoo CRM.",
      tags: ["CRM", "Sales"],
      published: true,
      visibility: "everyone" as const,
      accessRule: "open" as const,
      priceInr: null as number | null,
      website: "https://learnova.local/courses/odoo-crm-essentials",
      views: 980,
      durationMinutes: 110,
      lessonCount: 4,
    },
    {
      id: "course_5",
      title: "Odoo Inventory Basics",
      description:
        "Understand products, stock moves, warehouses, and simple inventory workflows in Odoo.",
      tags: ["Inventory", "Operations"],
      published: true,
      visibility: "everyone" as const,
      accessRule: "open" as const,
      priceInr: null as number | null,
      website: "https://learnova.local/courses/odoo-inventory-basics",
      views: 740,
      durationMinutes: 95,
      lessonCount: 4,
    },
    {
      id: "course_6",
      title: "Accounting Starter",
      description:
        "Get comfortable with journals, invoices, and basic accounting flows in Odoo.",
      tags: ["Accounting", "Finance"],
      published: true,
      visibility: "signed_in" as const,
      accessRule: "open" as const,
      priceInr: null as number | null,
      website: "https://learnova.local/courses/accounting-starter",
      views: 420,
      durationMinutes: 105,
      lessonCount: 6,
    },
    {
      id: "course_7",
      title: "Website Builder Quickstart",
      description:
        "Launch a simple website fast: pages, sections, themes, and publishing best practices.",
      tags: ["Website", "Marketing"],
      published: true,
      visibility: "everyone" as const,
      accessRule: "payment" as const,
      priceInr: 299,
      website: "https://learnova.local/courses/website-builder-quickstart",
      views: 620,
      durationMinutes: 75,
      lessonCount: 4,
    },
    {
      id: "course_8",
      title: "HR Attendance & Leaves",
      description:
        "Configure attendance, leave types, approvals, and policies for a small team.",
      tags: ["HR", "Admin"],
      published: true,
      visibility: "everyone" as const,
      accessRule: "open" as const,
      priceInr: null as number | null,
      website: "https://learnova.local/courses/hr-attendance-leaves",
      views: 260,
      durationMinutes: 90,
      lessonCount: 6,
    },
    {
      id: "course_9",
      title: "Automation with Studio",
      description:
        "Build smart automations with rules and simple customizations to reduce repetitive work.",
      tags: ["Automation", "Studio"],
      published: true,
      visibility: "signed_in" as const,
      accessRule: "invitation" as const,
      priceInr: null as number | null,
      website: "https://learnova.local/courses/automation-with-studio",
      views: 510,
      durationMinutes: 115,
      lessonCount: 7,
    },
    {
      id: "course_10",
      title: "Email & Activities Mastery",
      description:
        "Stay on top of follow-ups using activities, chatter, and clean communication flows.",
      tags: ["Productivity", "Sales"],
      published: true,
      visibility: "everyone" as const,
      accessRule: "open" as const,
      priceInr: null as number | null,
      website: "https://learnova.local/courses/email-activities-mastery",
      views: 340,
      durationMinutes: 60,
      lessonCount: 4,
    },
  ];

  // Create/upsert tags.
  const tagNames = Array.from(new Set(demoCourses.flatMap((c) => c.tags)));
  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Upsert courses and join tags.
  for (const course of demoCourses) {
    const imageUrls = {
      thumbnailUrl: "/images/courses/course-square.svg",
      coverUrl: "/images/covers/course-cover.svg",
      bannerUrl: "/images/covers/course-banner.svg",
    };
    await prisma.course.upsert({
      where: { id: course.id },
      update: {
        title: course.title,
        description: course.description,
        published: course.published,
        visibility: course.visibility,
        accessRule: course.accessRule,
        priceInr: course.priceInr ?? undefined,
        website: course.website,
        thumbnailUrl: imageUrls.thumbnailUrl,
        coverUrl: imageUrls.coverUrl,
        bannerUrl: imageUrls.bannerUrl,
        views: course.views,
        durationMinutes: course.durationMinutes,
        lessonCount: course.lessonCount,
        responsibleId: "u_instructor_1",
        tagsText: course.tags.join(","),
      },
      create: {
        id: course.id,
        title: course.title,
        description: course.description,
        published: course.published,
        visibility: course.visibility,
        accessRule: course.accessRule,
        priceInr: course.priceInr ?? undefined,
        website: course.website,
        thumbnailUrl: imageUrls.thumbnailUrl,
        coverUrl: imageUrls.coverUrl,
        bannerUrl: imageUrls.bannerUrl,
        views: course.views,
        durationMinutes: course.durationMinutes,
        lessonCount: course.lessonCount,
        responsibleId: "u_instructor_1",
        tagsText: course.tags.join(","),
      },
    });

    const tags: Array<{ id: string }> = await prisma.tag.findMany({
      where: { name: { in: course.tags } },
      select: { id: true },
    });
    await prisma.courseTag.deleteMany({ where: { courseId: course.id } });
    await prisma.courseTag.createMany({
      data: tags.map((t) => ({ courseId: course.id, tagId: t.id })),
    });
  }

  // Seed lessons + a quiz for all demo courses (stable IDs: lesson_1..lesson_4).
  const seededLessonCourses = demoCourses.map((c) => c.id);
  for (const courseId of seededLessonCourses) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) continue;

    const lessons = [
      {
        id: "lesson_1",
        title:
          courseId === "course_4"
            ? "Advanced Sales & CRM Automation in Odoo"
            : courseId === "course_7"
              ? "Website Pages & Theme Setup"
              : courseId === "course_5"
                ? "Products, Units, and Inventory Basics"
                : "Content 1",
        type: "video" as const,
        sortOrder: 1,
        description: "Demo video lesson (replace URL later).",
        videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
        durationMinutes: 20,
      },
      {
        id: "lesson_2",
        title: "Document",
        type: "doc" as const,
        sortOrder: 2,
        description: "Demo document lesson (viewer placeholder).",
        durationMinutes: 15,
      },
      {
        id: "lesson_3",
        title: "Video",
        type: "video" as const,
        sortOrder: 3,
        description: "Demo video lesson (replace URL later).",
        videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
        durationMinutes: 20,
      },
      {
        id: "lesson_4",
        title: "Quiz",
        type: "quiz" as const,
        sortOrder: 4,
        description: "Demo quiz lesson.",
        durationMinutes: 5,
      },
    ];

    for (const lesson of lessons) {
      await prisma.lesson.upsert({
        where: { id: `${courseId}:${lesson.id}` },
        update: {
          title: lesson.title,
          type: lesson.type,
          sortOrder: lesson.sortOrder,
          description: lesson.description,
          videoUrl: lesson.videoUrl,
          durationMinutes: lesson.durationMinutes,
        },
        create: {
          id: `${courseId}:${lesson.id}`,
          courseId,
          title: lesson.title,
          type: lesson.type,
          sortOrder: lesson.sortOrder,
          description: lesson.description,
          videoUrl: lesson.videoUrl,
          durationMinutes: lesson.durationMinutes,
        },
      });
    }

    const quizLessonId = `${courseId}:lesson_4`;
    const quizId = `quiz_${courseId}`;
    await prisma.quiz.upsert({
      where: { id: quizId },
      update: {
        title: `${course.title} Quiz`,
        courseId,
        lessonId: quizLessonId,
        allowMultipleAttempts: true,
        pointsPerCorrect: 5,
      },
      create: {
        id: quizId,
        title: `${course.title} Quiz`,
        courseId,
        lessonId: quizLessonId,
        allowMultipleAttempts: true,
        pointsPerCorrect: 5,
      },
    });

    // Reward rules: attempt 1..4 (matches current learner demo)
    const rewardRules = [5, 4, 3, 2];
    for (let i = 0; i < rewardRules.length; i += 1) {
      const attemptNumber = i + 1;
      await prisma.quizRewardRule.upsert({
        where: { quizId_attemptNumber: { quizId, attemptNumber } },
        update: { pointsPerCorrect: rewardRules[i] ?? 1 },
        create: { quizId, attemptNumber, pointsPerCorrect: rewardRules[i] ?? 1 },
      });
    }

    // A couple of demo questions/options.
    const questions = [
      {
        id: `${quizId}:q1`,
        prompt:
          courseId === "course_4"
            ? "In Odoo CRM, what does a pipeline stage represent?"
            : "What does course completion percentage represent?",
        options: [
          { text: courseId === "course_4" ? "A step in your sales process" : "How much of the course content you’ve finished", isCorrect: true },
          { text: courseId === "course_4" ? "A product category" : "Your device battery level", isCorrect: false },
          { text: courseId === "course_4" ? "A warehouse location" : "The price discount", isCorrect: false },
        ],
      },
      {
        id: `${quizId}:q2`,
        prompt:
          courseId === "course_4"
            ? "Which item is typically managed as a CRM record in Odoo?"
            : "A quiz is usually placed at the end of a module to…",
        options: [
          { text: courseId === "course_4" ? "Lead / Opportunity" : "Evaluate understanding", isCorrect: true },
          { text: courseId === "course_4" ? "Journal Entry" : "Change the UI theme", isCorrect: false },
          { text: courseId === "course_4" ? "Stock Move" : "Update your email address", isCorrect: false },
        ],
      },
    ];

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      await prisma.question.upsert({
        where: { id: q.id },
        update: { prompt: q.prompt, sortOrder: i + 1, quizId },
        create: { id: q.id, prompt: q.prompt, sortOrder: i + 1, quizId },
      });

      await prisma.option.deleteMany({ where: { questionId: q.id } });
      await prisma.option.createMany({
        data: q.options.map((o, idx) => ({
          questionId: q.id,
          text: o.text,
          sortOrder: idx + 1,
          isCorrect: o.isCorrect,
        })),
      });
    }
  }

  // Demo enrollments/purchases for the seeded learner.
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: "u_learner_1", courseId: "course_1" } },
    update: { status: "enrolled" },
    create: { userId: "u_learner_1", courseId: "course_1", status: "enrolled" },
  });
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: "u_learner_1", courseId: "course_4" } },
    update: { status: "enrolled" },
    create: { userId: "u_learner_1", courseId: "course_4", status: "enrolled" },
  });

  await prisma.purchase.upsert({
    where: { userId_courseId: { userId: "u_learner_1", courseId: "course_7" } },
    update: { amountInr: 299, status: "paid" },
    create: { userId: "u_learner_1", courseId: "course_7", amountInr: 299, status: "paid" },
  });

  // A sample review row.
  await prisma.review.upsert({
    where: { courseId_userId: { courseId: "course_1", userId: "u_learner_1" } },
    update: { rating: 5, text: "Very clear explanations and good pacing." },
    create: { courseId: "course_1", userId: "u_learner_1", rating: 5, text: "Very clear explanations and good pacing." },
  });

  // A sample course progress row.
  await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId: "u_learner_1", courseId: "course_1" } },
    update: { completionPercent: 25, lastLessonId: "lesson_2" },
    create: { userId: "u_learner_1", courseId: "course_1", completionPercent: 25, lastLessonId: "lesson_2", startedAt: new Date() },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
