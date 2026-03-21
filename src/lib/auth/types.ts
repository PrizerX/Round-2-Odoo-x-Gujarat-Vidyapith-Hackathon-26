export type UserRole = "learner" | "instructor" | "admin";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type Session = {
  user: SessionUser;
};
