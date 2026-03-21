export type PasswordPolicyResult = {
  ok: boolean;
  issues: string[];
};

export function validatePassword(password: string): PasswordPolicyResult {
  const issues: string[] = [];

  if (password.length < 8) issues.push("Must be at least 8 characters.");
  if (!/[a-z]/.test(password)) issues.push("Must include a lowercase letter.");
  if (!/[A-Z]/.test(password)) issues.push("Must include an uppercase letter.");
  if (!/[0-9]/.test(password)) issues.push("Must include a number.");
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    issues.push("Must include a special character.");
  }

  return { ok: issues.length === 0, issues };
}
