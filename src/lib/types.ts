export type FileKind =
  | "stop_pivot_board"
  | "stop_pivot_alight"
  | "route_pivot_board"
  | "route_pivot_alight"
  | "by_time"
  | "ride_alight_by_hour"
  | "excel"
  | "unknown";

export interface ParsedFile {
  name: string;
  kind: FileKind;
  data: Record<string, string>[];
}

export interface LongData {
  time: string;
  value: number;
  type: "boarding" | "alighting";
  [key: string]: string | number;
}

