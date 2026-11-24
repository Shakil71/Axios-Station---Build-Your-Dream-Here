"use server";

import { z } from "zod";
import { getResource } from "@/lib/admin/resources";
import { requirePermission } from "@/lib/auth/guard";
import { SETTING_GROUPS, type SettingGroup } from "@/lib/settings-schema";
import { getRecord } from "@/services/admin/crud";
import { saveTranslations, type TranslationTarget } from "@/services/admin/translations";
import { guarded, type Result } from "./guarded";

const targetSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("resource"), key: z.string().max(64), id: z.string().min(1).max(191) }),
  z.object({ scope: z.literal("section"), id: z.string().min(1).max(191) }),
  z.object({ scope: z.literal("settings"), group: z.string().max(32) }),
]);

/** Save the Bengali version of a content item, page section or settings group. */
export async function saveTranslationsAction(rawTarget: TranslationTarget, _prev: Result, form: FormData): Promise<Result> {
  return guarded(async () => {
    const target = targetSchema.parse(rawTarget);
    if (target.scope === "resource") {
      const resource = getResource(target.key);
      if (!resource) return { ok: false, message: "Unknown content type." };
      const user = await requirePermission(resource.permission);
      if (!(await getRecord(resource, target.id))) return { ok: false, message: "Item not found." };
      return saveTranslations(target, user, form);
    }
    if (target.scope === "section") {
      const user = await requirePermission(["homepage.manage", "pages.manage"]);
      return saveTranslations(target, user, form);
    }
    if (!(target.group in SETTING_GROUPS)) return { ok: false, message: "Unknown settings group." };
    const user = await requirePermission(SETTING_GROUPS[target.group as SettingGroup].permission);
    return saveTranslations(target, user, form);
  });
}
