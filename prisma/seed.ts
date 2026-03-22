import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("➕ Starting Incremental Seed (Adding data)...");

  const passwordHash = await bcrypt.hash("Password@123", 10);

  // 1. Fetch existing instructors to link new courses to them
  const existingInstructors = await prisma.user.findMany({
    where: { role: "instructor" },
    select: { id: true }
  });

  // 2. Generate 50 NEW unique Learners
  console.log("👤 Adding 50 new learners...");
  const newUsers = Array.from({ length: 50 }).map(() => ({
    id: faker.string.uuid(), // Using UUID to avoid ID collisions
    email: faker.internet.email(), // Random email to avoid unique constraint 
    name: faker.person.fullName(),
    role: "learner" as const,
    passwordHash,
  }));
  await prisma.user.createMany({ data: newUsers });

  // 3. Generate 20 NEW Courses
  console.log("📚 Adding 20 new courses...");
  for (let i = 0; i < 20; i++) {
    const courseId = faker.string.uuid();
    // Use an existing instructor if available, otherwise use a new one
    const instructorId = existingInstructors.length > 0 
      ? faker.helpers.arrayElement(existingInstructors).id 
      : null;

    await prisma.course.create({
      data: {
        id: courseId,
        title: `${faker.commerce.productAdjective()} ${faker.commerce.department()} Masterclass`,
        description: faker.lorem.paragraph(),
        published: true,
        visibility: "everyone",
        accessRule: "open",
        responsibleId: instructorId,
        views: faker.number.int({ min: 100, max: 1000 }),
        durationMinutes: faker.number.int({ min: 30, max: 180 }),
        lessonCount: 5,
        // Adding lessons directly in the create call
        lessons: {
          create: Array.from({ length: 5 }).map((_, j) => ({
            id: faker.string.uuid(),
            title: faker.company.catchPhrase(),
            type: "video",
            sortOrder: j,
            videoUrl: "https://youtu.be/0r575dWbkMk",
          }))
        }
      },
    });

    // 4. Generate random Progress for the NEW users on these NEW courses
    console.log(`📈 Linking learners to course ${i + 1}/20...`);
    const sliceOfLearners = faker.helpers.arrayElements(newUsers, 10);
    
    for (const learner of sliceOfLearners) {
      const status = faker.helpers.arrayElement(["In Progress", "Completed"]);
      
      await prisma.courseProgress.create({
        data: {
          userId: learner.id,
          courseId: courseId,
          completionPercent: status === "Completed" ? 100 : faker.number.int({ min: 10, max: 90 }),
          totalTimeSpentSeconds: faker.number.int({ min: 600, max: 5000 }),
          startedAt: new Date(),
          completedAt: status === "Completed" ? new Date() : null,
        }
      });

      await prisma.enrollment.create({
        data: {
          userId: learner.id,
          courseId: courseId,
          status: "enrolled"
        }
      });
    }
  }

  console.log("✅ Successfully added new data on top of existing records!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });