"use server";

import { z } from "zod";
import { getResource } from "@/lib/admin/resources";
import { requirePermission } from "@/lib/auth/guard";
import { deleteRecords, saveRecord, setStatus } from "@/services/admin/crud";
import { guarded, type Result } from "./guarded";

const ids = z.array(z.string().min(1).max(191)).min(1).max(200);

function resourceOrThrow(key: string) {
  const r = getResource(key);
  if (!r) throw new Error("Unknown resource");
  return r;
}

export async function saveResourceAction(resourceKey: string, id: string | null, _prev: Result, form: FormData): Promise<Result> {
  return guarded(async () => {
    const resource = resourceOrThrow(resourceKey);
    const user = await requirePermission(resource.permission);
    return saveRecord(resource, user, form, id ?? undefined);
  });
}

export async function deleteResourceAction(resourceKey: string, recordIds: string[]): Promise<Result> {
  return guarded(async () => {
    const resource = resourceOrThrow(resourceKey);
    const user = await requirePermission(resource.permission);
    return deleteRecords(resource, user, ids.parse(recordIds));
  });
}

export async function setStatusAction(resourceKey: string, recordIds: string[], status: string): Promise<Result> {
  return guarded(async () => {
    const resource = resourceOrThrow(resourceKey);
    const user = await requirePermission(resource.permission);
    const s = z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).parse(status);
    return setStatus(resource, user, ids.parse(recordIds), s);
  });
}
