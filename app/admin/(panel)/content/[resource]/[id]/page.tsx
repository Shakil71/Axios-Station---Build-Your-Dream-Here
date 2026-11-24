import { notFound } from "next/navigation";
import { getResource } from "@/lib/admin/resources";
import { requirePagePermission } from "@/lib/auth/guard";
import { getRecord, relationOptions } from "@/services/admin/crud";
import { toFormValues } from "@/services/admin/form-values";
import { AdminPageHeader, StatusBadge } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/resource-form";
import { TranslationPanel } from "@/components/admin/translation-panel";
import { translationRows } from "@/services/admin/translations";
import { RESOURCE_ENTITY } from "@/lib/i18n/translatable";
import { localizeHref } from "@/lib/i18n";

/** Handles both /new and /{id}. */
export default async function ResourceEditPage({ params }: PageProps<"/admin/content/[resource]/[id]">) {
  const { resource: key, id } = await params;
  const resource = getResource(key);
  if (!resource) notFound();
  await requirePagePermission(resource.permission);

  const isNew = id === "new";
  const record = isNew ? null : await getRecord(resource, id);
  if (!isNew && !record) notFound();

  const [{ values, media, gallery }, relOpts] = await Promise.all([toFormValues(resource, record), relationOptions(resource)]);
  const title = record ? String(record[resource.titleField] ?? resource.singular) : `New ${resource.singular.toLowerCase()}`;
  const entity = RESOURCE_ENTITY[resource.key];
  const trRows = record && entity ? await translationRows(entity, id, values) : [];
  const publicUrl =
    record && resource.publicPath && typeof record.slug === "string" && record.status === "PUBLISHED"
      ? resource.publicPath.replace("{slug}", record.slug)
      : null;

  return (
    <>
      <AdminPageHeader
        title={title}
        back={{ href: `/admin/content/${resource.key}`, label: resource.label }}
        actions={record && typeof record.status === "string" ? <StatusBadge status={record.status} /> : undefined}
      />
      <ResourceForm
        key={record ? String(record.updatedAt) : "new"}
        resourceKey={resource.key}
        id={isNew ? null : id}
        fields={resource.fields}
        values={values}
        media={media}
        gallery={gallery}
        relationOptions={relOpts}
        publicUrl={publicUrl}
      />
      {trRows.length > 0 && (
        <div className="mt-6">
          <TranslationPanel target={{ scope: "resource", key: resource.key, id }} rows={trRows} publicPath={publicUrl ? localizeHref(publicUrl, "bn") : null} />
        </div>
      )}
    </>
  );
}
