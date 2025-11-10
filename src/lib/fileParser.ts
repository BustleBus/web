import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { FileKind, LongData } from "./types";

export function detectFileKind(name: string): { kind: FileKind; extension: string } {
  const extension = name.split(".").pop()?.toLowerCase() || "";
  if (name.includes("승하차_인원_정보"))
    return { kind: "ride_alight_by_hour", extension };
  if (name.includes("정류장별_승차피벗_모음"))
    return { kind: "stop_pivot_board", extension };
  if (name.includes("정류장별_하차피벗_모음"))
    return { kind: "stop_pivot_alight", extension };
  if (name.includes("노선기반_승차피벗_모음"))
    return { kind: "route_pivot_board", extension };
  if (name.includes("노선기반_하차피벗_모음"))
    return { kind: "route_pivot_alight", extension };
  if (name.startsWith("시간대별_")) return { kind: "by_time", extension };
  if (extension === "xlsx" || extension === "xls") return { kind: "excel", extension };
  return { kind: "unknown", extension };
}

export async function parseCsvFile(
  file: File
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "EUC-KR",
      complete: (res) => resolve(res.data as Record<string, string>[]),
      error: (err) => reject(err),
    });
  });
}

export async function parseExcelFile(
  file: File
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json as Record<string, string>[]);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export async function parseFile(
  file: File
): Promise<Record<string, string>[]> {
  const { extension } = detectFileKind(file.name);
  if (extension === "csv") {
    return parseCsvFile(file);
  } else if (extension === "xlsx" || extension === "xls") {
    return parseExcelFile(file);
  } else {
    throw new Error("Unsupported file type");
  }
}

export function pivotToLong(
  rows: Record<string, string>[],
  indexKeys: string[],
  type: 'boarding' | 'alighting' = 'boarding'
): LongData[] {
  if (!rows || rows.length === 0) return [];
  const timeCols = Object.keys(rows[0]).filter((k) =>
    /^(\d{2})$|^(\d{2})시$/.test(k)
  );
  const normCol = (c: string) => (c.endsWith("시") ? c.replace("시", "") : c);
  const out: LongData[] = [];
  for (const r of rows) {
    for (const c of timeCols) {
      const hh = normCol(c);
      const val = Number(r[c] ?? 0);
      out.push({
        time: hh,
        value: val,
        type,
        ...indexKeys.reduce(
          (acc, key) => ({ ...acc, [key]: r[key] }),
          {} as Record<string, string>
        ),
      });
    }
  }
  return out;
}

export function pivotToLongRideAlight(
  rows: Record<string, string>[],
  indexKeys: string[]
): LongData[] {
  if (!rows || rows.length === 0) return [];
  const rideAlightRegex = /^(\d{1,2})시(승차|하차)총승객수$/;
  const timeCols = Object.keys(rows[0]).filter((k) => rideAlightRegex.test(k));

  const out: LongData[] = [];
  for (const r of rows) {
    for (const c of timeCols) {
      const match = c.match(rideAlightRegex);
      if (match) {
        const hh = match[1];
        const type = match[2] === '승차' ? 'boarding' : 'alighting';
        const val = Number(r[c] ?? 0);
        out.push({
          time: hh,
          value: val,
          type,
          ...indexKeys.reduce(
            (acc, key) => ({ ...acc, [key]: r[key] }),
            {} as Record<string, string>
          ),
        });
      }
    }
  }
  return out;
}