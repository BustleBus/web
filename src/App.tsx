import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ParsedFile, LongData } from "@/lib/types";
import { pivotToLong } from "@/lib/fileParser";
import { DataTable } from "@/components/DataTable";
import { FileLoader } from "@/components/FileLoader";

/**
 * 버스 배차 데이터 뷰어 (단일 파일 컴포넌트)
 *
 * 사용법:
 * 1) 아래에서 CSV 파일들을 드래그&드롭(또는 선택)하세요.
 *    - 정류장별 통합 피벗: `정류장별_승차피벗_모음.csv`, `정류장별_하차피벗_모음.csv`
 *    - 노선기반 통합 피벗: `노선기반_승차피벗_모음.csv`, `노선기반_하차피벗_모음.csv`
 *    - 시간대별 분할: `시간대별_07시.csv` 등 (옵션)
 * 2) 상단 탭에서 원하는 뷰(정류장/노선/시간대)를 선택하고, 필터를 조정하세요.
 * 3) 우측 차트 영역에서 선택 데이터의 시간대 추이를 확인할 수 있습니다.
 *
 * 라이브러리: papaparse(브라우저 CSV 파서), recharts(차트), shadcn/ui, TailwindCSS
 */
export default function App() {
  const [files, setFiles] = useState<ParsedFile[]>([]); // {name, kind, data}

  // 분류된 데이터
  const stopPivotBoard = useMemo(
    () =>
      files.find((f) => f.kind === "stop_pivot_board")?.data ||
      ([] as Record<string, string>[]),
    [files]
  );
  const stopPivotAlight = useMemo(
    () =>
      files.find((f) => f.kind === "stop_pivot_alight")?.data ||
      ([] as Record<string, string>[]),
    [files]
  );
  const routePivotBoard = useMemo(
    () =>
      files.find((f) => f.kind === "route_pivot_board")?.data ||
      ([] as Record<string, string>[]),
    [files]
  );
  const routePivotAlight = useMemo(
    () =>
      files.find((f) => f.kind === "route_pivot_alight")?.data ||
      ([] as Record<string, string>[]),
    [files]
  );
  const timeFiles = useMemo(
    () => files.filter((f) => f.kind === "by_time"),
    [files]
  );

  // 공통 필터 상태
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedStop, setSelectedStop] = useState("");
  const [metric, setMetric] = useState<"boarding" | "alighting">("boarding"); // boarding | alighting

  // 후보 목록
  const routeCandidates = useMemo(() => {
    const rows = routePivotBoard.length ? routePivotBoard : routePivotAlight;
    const key = rows.length ? Object.keys(rows[0])[0] : "노선"; // 첫번째 컬럼(노선)
    return Array.from(new Set(rows.map((r) => String(r[key]))))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "ko"));
  }, [routePivotBoard, routePivotAlight]);

  const stopCandidates = useMemo(() => {
    const rows = stopPivotBoard.length ? stopPivotBoard : stopPivotAlight;
    // stop pivot: index가 (정류장, 노선) 순인 경우가 많다. 정류장 컬럼명을 유추
    const keys = rows.length ? Object.keys(rows[0]) : [];
    const stopKey = keys[0];
    return Array.from(new Set(rows.map((r) => String(r[stopKey]))))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "ko"));
  }, [stopPivotBoard, stopPivotAlight]);

  // 선택 데이터 → 차트용 시계열
  const timeSeries = useMemo(() => {
    const isRouteMode =
      !!selectedRoute && (routePivotBoard.length || routePivotAlight.length);
    const isStopMode =
      !!selectedStop && (stopPivotBoard.length || stopPivotAlight.length);

    if (isRouteMode) {
      const rows = metric === "boarding" ? routePivotBoard : routePivotAlight;
      if (!rows.length) return [];
      const keys = Object.keys(rows[0]);
      const routeKey = keys[0]; // 노선
      const stopKey = keys[1]; // 정류장
      const filtered = rows.filter(
        (r) => String(r[routeKey]) === String(selectedRoute)
      );
      const long = pivotToLong(filtered, [routeKey, stopKey]);
      // 선택 정류장이 있으면 해당 정류장만
      const target = selectedStop
        ? long.filter((d: LongData) => String(d[stopKey]) === String(selectedStop))
        : long;
      // 시간대별 합계
      const grouped: Record<string, number> = {};
      for (const d of target) {
        if (!grouped[d.time]) grouped[d.time] = 0;
        grouped[d.time] += Number(d.value || 0);
      }
      return Object.entries(grouped).map(([time, value]) => ({ time, value }));
    }

    if (isStopMode) {
      const rows = metric === "boarding" ? stopPivotBoard : stopPivotAlight;
      if (!rows.length) return [];
      const keys = Object.keys(rows[0]);
      const stopKey = keys[0]; // 정류장
      const routeKey = keys[1]; // 노선
      const filtered = rows.filter(
        (r) => String(r[stopKey]) === String(selectedStop)
      );
      const long = pivotToLong(filtered, [stopKey, routeKey]);
      return long
        .reduce((acc: { time: string; value: number }[], cur: LongData) => {
          const found = acc.find((x) => x.time === cur.time);
          if (found) found.value += Number(cur.value || 0);
          else acc.push({ time: cur.time, value: Number(cur.value || 0) });
          return acc;
        }, [])
        .sort((a: { time: string; value: number }, b: { time: string; value: number }) => a.time.localeCompare(b.time));
    }

    return [];
  }, [
    selectedRoute,
    selectedStop,
    metric,
    routePivotBoard,
    routePivotAlight,
    stopPivotBoard,
    stopPivotAlight,
  ]);

  // 시간대별 CSV 표시 (선택)
  const [activeTimeFile, setActiveTimeFile] = useState("");
  const activeTimeRows = useMemo(() => {
    if (!activeTimeFile) return [] as Record<string, string>[];
    const f = timeFiles.find((f) => f.name === activeTimeFile);
    return f?.data || ([] as Record<string, string>[]);
  }, [activeTimeFile, timeFiles]);

  const onFilesLoaded = (parsed: ParsedFile[]) => {
    setFiles((prev) => {
      // 동일 이름 덮어쓰기
      const map = new Map(prev.map((p) => [p.name, p]));
      for (const p of parsed) map.set(p.name, p);
      return Array.from(map.values());
    });
  };

  // UI
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🚌 버스 배차 데이터 뷰어</h1>
      <p className="text-sm text-muted-foreground">
        생성된 CSV 파일을 업로드해 정류장/노선/시간대 기준으로 탐색하고
        시각화합니다.
      </p>

      <FileLoader onLoaded={onFilesLoaded} />

      <Tabs defaultValue="route" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-xl">
          <TabsTrigger value="route">노선 기반</TabsTrigger>
          <TabsTrigger value="stop">정류장 기반</TabsTrigger>
          <TabsTrigger value="time">시간대 파일</TabsTrigger>
        </TabsList>

        {/* 노선 기반 */}
        <TabsContent value="route" className="space-y-4 mt-4">
          <Card className="p-4">
            <div className="grid md:grid-cols-4 gap-3 items-end">
              <div className="space-y-2">
                <Label>지표</Label>
                <Select value={metric} onValueChange={setMetric}>
                  <SelectTrigger>
                    <SelectValue placeholder="지표 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boarding">승차</SelectItem>
                    <SelectItem value="alighting">하차</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>노선</Label>
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                  <SelectTrigger>
                    <SelectValue placeholder="노선 선택" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 overflow-auto">
                    {routeCandidates.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>정류장(선택)</Label>
                <Input
                  placeholder="정류장 이름 일부 입력"
                  value={selectedStop}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSelectedStop(e.target.value)
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedRoute("");
                    setSelectedStop("");
                  }}
                >
                  필터 초기화
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">데이터 미리보기</h3>
              <DataTable
                rows={(metric === "boarding"
                  ? routePivotBoard
                  : routePivotAlight
                ).slice(0, 200)}
              />
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                시간대 추이
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeSeries.sort((a: { time: string; value: number }, b: { time: string; value: number }) =>
                      a.time.localeCompare(b.time)
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="합계"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 정류장 기반 */}
        <TabsContent value="stop" className="space-y-4 mt-4">
          <Card className="p-4">
            <div className="grid md:grid-cols-4 gap-3 items-end">
              <div className="space-y-2">
                <Label>지표</Label>
                <Select value={metric} onValueChange={setMetric}>
                  <SelectTrigger>
                    <SelectValue placeholder="지표 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boarding">승차</SelectItem>
                    <SelectItem value="alighting">하차</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>정류장</Label>
                <Select value={selectedStop} onValueChange={setSelectedStop}>
                  <SelectTrigger>
                    <SelectValue placeholder="정류장 선택" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 overflow-auto">
                    {stopCandidates.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedStop("");
                    setSelectedRoute("");
                  }}
                >
                  필터 초기화
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">데이터 미리보기</h3>
              <DataTable
                rows={(metric === "boarding"
                  ? stopPivotBoard
                  : stopPivotAlight
                ).slice(0, 200)}
              />
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                시간대 추이
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeSeries.sort((a: { time: string; value: number }, b: { time: string; value: number }) =>
                      a.time.localeCompare(b.time)
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="합계"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 시간대별 파일 */}
        <TabsContent value="time" className="space-y-4 mt-4">
          <Card className="p-4">
            <div className="grid md:grid-cols-3 gap-3 items-end">
              <div className="space-y-2 md:col-span-2">
                <Label>시간대 파일 선택</Label>
                <Select
                  value={activeTimeFile}
                  onValueChange={setActiveTimeFile}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="시간대별_..csv 선택" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 overflow-auto">
                    {timeFiles.map((f) => (
                      <SelectItem key={f.name} value={f.name}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setActiveTimeFile("")}
                >
                  선택 해제
                </Button>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">데이터 미리보기</h3>
            <DataTable rows={activeTimeRows.slice(0, 400)} />
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">가이드</h3>
        <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
          <li>
            정류장/노선 통합 피벗 파일은 열이 시간대(00~23) 입니다. 필요한 행만
            필터한 뒤, 우측 차트로 시간대 추이를 확인하세요.
          </li>
          <li>
            시간대별 분할 파일은 특정 시각의 노선×정류장 합계가 담겨 있습니다.
            노선/정류장별 물량 확인에 유용합니다.
          </li>
          <li>
            대용량 CSV의 경우 브라우저 메모리를 많이 사용할 수 있습니다. 필요한
            파일만 선택해 업로드하세요.
          </li>
        </ul>
      </Card>
    </div>
  );
}
