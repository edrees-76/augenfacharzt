import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { UserModel as User } from "@/generated/prisma/models";

/** For (app) layout: redirects unauthenticated/pending/rejected/suspended users away. */
export async function requireApprovedUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "PENDING" || user.status === "REJECTED") redirect("/pending");
  if (user.status === "SUSPENDED") redirect("/pending");
  return user;
}

/** For admin layout: requires an approved admin, otherwise sends learners home. */
export async function requireAdminUser(): Promise<User> {
  const user = await requireApprovedUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
