import type { Permission } from "./permissions";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  roles: { key: string; name: string }[];
  permissions: Set<Permission>;
};

/** Pure permission check (no I/O) — used by guards, actions and tests. */
export function can(user: CurrentUser | null, perm: Permission | Permission[]): boolean {
  if (!user) return false;
  const list = Array.isArray(perm) ? perm : [perm];
  return list.some((p) => user.permissions.has(p));
}
