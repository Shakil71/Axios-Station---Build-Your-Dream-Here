import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "@/lib/db/prisma";
import { isPermission, type Permission } from "./permissions";
import { can, type CurrentUser } from "./can";

export { can, type CurrentUser };

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Resolve the signed-in user from the session *and the database* on every
 * request. Deactivated/deleted users and revoked sessions (sessionVersion bump)
 * are rejected immediately, and permissions are always read fresh.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return null;
  const sv = (session as unknown as { sv?: number }).sv ?? 0;
  const user = await prisma.user.findFirst({
    where: { id: uid, deletedAt: null, isActive: true },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });
  if (!user || user.sessionVersion !== sv) return null;
  const permissions = new Set<Permission>();
  for (const ur of user.roles) {
    for (const rp of ur.role.permissions) if (isPermission(rp.permission.key)) permissions.add(rp.permission.key);
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles.map((r) => ({ key: r.role.key, name: r.role.name })),
    permissions,
  };
});

/** For admin pages: redirects to login or the forbidden page. */
export async function requirePagePermission(perm: Permission | Permission[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!can(user, perm)) redirect("/admin/forbidden");
  return user;
}

/** For server actions and route handlers: throws ForbiddenError. */
export async function requirePermission(perm: Permission | Permission[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("Your session has expired. Please sign in again.");
  if (!can(user, perm)) throw new ForbiddenError();
  return user;
}
