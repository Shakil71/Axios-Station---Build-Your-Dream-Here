import { describe, expect, it } from "vitest";
import { ALL_PERMISSIONS, DEFAULT_ROLES, isPermission, type Permission } from "@/lib/auth/permissions";
import { can, type CurrentUser } from "@/lib/auth/can";
import { RESOURCES } from "@/lib/admin/resources";
import { ADMIN_NAV } from "@/lib/admin/nav";

const userWith = (role: string): CurrentUser => ({
  id: "u1",
  name: "T",
  email: "t@example.com",
  roles: [{ key: role, name: role }],
  permissions: new Set(DEFAULT_ROLES[role]!.permissions),
});

describe("RBAC role matrix", () => {
  it("super admin has every permission", () => {
    expect(new Set(DEFAULT_ROLES.super_admin!.permissions)).toEqual(new Set(ALL_PERMISSIONS));
  });

  it("only valid permission keys are assigned", () => {
    for (const r of Object.values(DEFAULT_ROLES)) for (const p of r.permissions) expect(isPermission(p)).toBe(true);
  });

  it("sales manager can manage leads but not content or users", () => {
    const u = userWith("sales_manager");
    expect(can(u, "leads.manage")).toBe(true);
    expect(can(u, "services.manage")).toBe(false);
    expect(can(u, "users.manage")).toBe(false);
    expect(can(u, "settings.manage")).toBe(false);
  });

  it("editor manages pages, blog and media but not leads or users", () => {
    const u = userWith("editor");
    for (const p of ["pages.manage", "blog.manage", "blog.publish", "media.manage"] as Permission[]) expect(can(u, p)).toBe(true);
    expect(can(u, "leads.view")).toBe(false);
    expect(can(u, "users.manage")).toBe(false);
  });

  it("marketing manager handles blog + SEO but not users/roles", () => {
    const u = userWith("marketing_manager");
    expect(can(u, "seo.manage")).toBe(true);
    expect(can(u, "blog.publish")).toBe(true);
    expect(can(u, "roles.manage")).toBe(false);
  });

  it("admin cannot manage users, roles or maintenance", () => {
    const u = userWith("admin");
    expect(can(u, "services.manage")).toBe(true);
    expect(can(u, "users.manage")).toBe(false);
    expect(can(u, "roles.manage")).toBe(false);
    expect(can(u, "maintenance.manage")).toBe(false);
  });

  it("anonymous users can do nothing", () => {
    expect(can(null, "dashboard.view")).toBe(false);
  });
});

describe("admin configuration integrity", () => {
  it("every resource and nav item requires a real permission", () => {
    for (const r of Object.values(RESOURCES)) expect(isPermission(r.permission)).toBe(true);
    for (const g of ADMIN_NAV) for (const i of g.items) for (const p of [i.permission].flat()) expect(isPermission(p)).toBe(true);
  });

  it("every resource lists sortable columns that exist and searches real fields", () => {
    for (const r of Object.values(RESOURCES)) {
      expect(r.fields.some((f) => f.name === r.titleField)).toBe(true);
      expect(r.searchFields.length).toBeGreaterThan(0);
    }
  });

  it("slug fields point at a source field that exists", () => {
    for (const r of Object.values(RESOURCES)) {
      for (const f of r.fields.filter((x) => x.type === "slug")) expect(r.fields.some((x) => x.name === f.from)).toBe(true);
    }
  });
});
