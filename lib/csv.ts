/** RFC 4180 CSV with spreadsheet formula-injection protection. */
export function toCsv(headers: string[], rows: (string | number | null | undefined | Date)[][]): string {
  const esc = (v: string | number | null | undefined | Date) => {
    let s = v instanceof Date ? v.toISOString() : v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
}
