import type { SessionUser } from "@/lib/auth/types";

export type MockUserRecord = SessionUser & {
  password: string;
};

export const MOCK_USERS: MockUserRecord[] = [
  {
    id: "u_instructor_1",
    name: "Demo Instructor",
    email: "instructor@learnova.dev",
    role: "instructor",
    password: "Instructor@123",
  },
  {
    id: "u_learner_1",
    name: "Demo Learner",
    email: "learner@learnova.dev",
    role: "learner",
    password: "Learner@123",
  },
  {
    id: "u_admin_1",
    name: "Demo Admin",
    email: "admin@learnova.dev",
    role: "admin",
    password: "Admin@123",
  },
];
