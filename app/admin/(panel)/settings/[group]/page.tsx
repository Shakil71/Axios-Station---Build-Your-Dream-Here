import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/module-forms";
import { SETTINGS, SETTING_GROUPS, type SettingGroup } from "@/lib/settings-schema";
import { TranslationPanel } from "@/components/admin/translation-panel";
import { fieldName, loadTranslations, type TranslationRow } from "@/services/admin/translations";
import { TRANSLATABLE_SETTINGS } from "@/lib/i18n/translatable";

export default async function SettingsPage({ params }: PageProps<"/admin/settings/[group]">) {
  const { group } = await params;
  if (!(group in SETTING_GROUPS)) notFound();
  const g = SETTING_GROUPS[group as SettingGroup];
  await requirePagePermission(g.permission);
  const fields = SETTINGS.filter((s) => s.group === group);
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: fields.map((f) => f.key) } } });
  const values: Record<string, unknown> = Object.fromEntries(fields.map((f) => [f.key, f.default]));
  for (const r of rows) values[r.key] = r.value;
  const trFields = fields.filter((f) => (TRANSLATABLE_SETTINGS as readonly string[]).includes(f.key));
  const existing = await loadTranslations("setting", trFields.map((f) => f.key));
  const trRows: TranslationRow[] = trFields.map((f) => ({
    entityId: f.key,
    field: "value",
    label: f.label,
    kind: f.type === "textarea" ? "textarea" : "text",
    english: typeof values[f.key] === "string" ? (values[f.key] as string) : "",
    value: existing[fieldName(f.key, "value")] ?? "",
  }));
  return (
    <>
      <AdminPageHeader title={g.title} description={g.description} />
      <div className="max-w-3xl">
        <SettingsForm group={group} fields={fields} values={values} />
        {trRows.length > 0 && (
          <div className="mt-6">
            <TranslationPanel target={{ scope: "settings", group }} rows={trRows} publicPath="/bn" />
          </div>
        )}
      </div>
    </>
  );
}
