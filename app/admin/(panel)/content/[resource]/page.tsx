import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { getResource } from "@/lib/admin/resources";
import { requirePagePermission } from "@/lib/auth/guard";
import { listRecords, relationOptions } from "@/services/admin/crud";
import { serializeRow } from "@/services/admin/form-values";
import { AdminPageHeader } from "@/components/admin/ui";
import { ResourceTable } from "@/components/admin/resource-table";
import { Pagination } from "@/components/sections/pagination";
import { buttonVariants } from "@/components/ui/button";

export default async function ResourceListPage({ params, searchParams }: PageProps<"/admin/content/[resource]">) {
  const { resource: key } = await params;
  const resource = getResource(key);
  if (!resource) notFound();
  await requirePagePermission(resource.permission);
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const relationFilterFields = resource.fields.filter((f) => f.type === "relation" && ["navigationId", "categoryId"].includes(f.name));
  const relOpts = relationFilterFields.length ? await relationOptions({ ...resource, fields: relationFilterFields }) : {};
  const filters = [
    ...(resource.filters ?? []),
    ...relationFilterFields.map((f) => ({ name: f.name, label: f.label, options: relOpts[f.name] ?? [] })),
  ];
  const filterValues = Object.fromEntries(filters.map((f) => [f.name, str(f.name) ?? ""]));

  const result = await listRecords(resource, {
    q: str("q"),
    page: Number(str("page") ?? 1) || 1,
    sort: str("sort"),
    dir: str("dir"),
    filters: filterValues,
  });

  return (
    <>
      <AdminPageHeader
        title={resource.label}
        description={resource.description}
        actions={
          <Link href={`/admin/content/${resource.key}/new`} className={buttonVariants()}>
            <Plus /> New {resource.singular.toLowerCase()}
          </Link>
        }
      />
      <ResourceTable
        resourceKey={resource.key}
        columns={resource.columns}
        rows={result.rows.map(serializeRow)}
        hasStatus={Boolean(resource.hasStatus)}
        publicPath={resource.publicPath}
        filters={filters}
        sort={result.sort}
        dir={result.dir}
        total={result.total}
      />
      <Pagination
        page={result.page}
        pages={result.pages}
        basePath={`/admin/content/${resource.key}`}
        params={{ q: str("q"), sort: str("sort"), dir: str("dir"), ...filterValues }}
      />
    </>
  );
}
