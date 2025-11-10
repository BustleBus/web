import React, {
  useState,
  useEffect,
  useMemo,
  useTransition,
  Suspense,
} from "react";
import { pivotToLongRideAlight } from "../lib/fileParser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DataTable } from "./DataTable";
import { Loader2 } from "lucide-react";
import { VirtualizedCombobox } from "./ui/combobox";
import { Button } from "./ui/button";
import type { ApexOptions } from "apexcharts";

const Chart = React.lazy(() => import("react-apexcharts"));

const Dashboard: React.FC = () => {
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingInitialData(true);
      try {
        const response = await fetch("/data.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        if (!jsonData || jsonData.length === 0) {
          setError("JSON 파일을 파싱했지만 데이터가 비어 있습니다.");
          setIsLoadingInitialData(false);
          return;
        }
        startTransition(() => {
          setParsedData(jsonData);
        });
      } catch (e) {
        console.error("데이터 로딩 중 오류 발생:", e);
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
        setIsLoadingInitialData(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (parsedData.length > 0 && !isPending) {
      setIsLoadingInitialData(false);
    }
  }, [parsedData, isPending]);

  const longData = useMemo(() => {
    if (!parsedData || parsedData.length === 0) return [];
    return pivotToLongRideAlight(parsedData, ["노선번호", "노선명", "역명"]);
  }, [parsedData]);

  const routes = useMemo(() => {
    if (longData.length === 0) return [];
    const uniqueRoutes = [
      ...new Set(longData.map((d) => d["노선번호"] as string)),
    ].filter(Boolean);
    return uniqueRoutes.sort();
  }, [longData]);

  const stations = useMemo(() => {
    if (longData.length === 0) return [];
    const uniqueStations = [
      ...new Set(longData.map((d) => d["역명"] as string)),
    ].filter(Boolean);
    return uniqueStations.sort();
  }, [longData]);

  const filteredData = useMemo(() => {
    if (longData.length === 0) return [];
    let filtered = longData;
    if (selectedRoute) {
      filtered = filtered.filter((d) => d["노선번호"] === selectedRoute);
    }
    if (selectedStation) {
      filtered = filtered.filter((d) => d["역명"] === selectedStation);
    }
    return filtered;
  }, [longData, selectedRoute, selectedStation]);

  const chartData = useMemo(() => {
    return filteredData
      .reduce((acc, d) => {
        const time = d.time;
        const existing = acc.find((x) => x.time === time);
        if (existing) {
          if (d.type === "boarding") {
            existing.boarding += d.value;
          } else {
            existing.alighting += d.value;
          }
        } else {
          acc.push({
            time: time,
            boarding: d.type === "boarding" ? d.value : 0,
            alighting: d.type === "alighting" ? d.value : 0,
          });
        }
        return acc;
      }, [] as { time: string; boarding: number; alighting: number }[])
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredData]);

  const stationOptions = useMemo(() => {
    return stations.map((station) => ({ value: station, label: station }));
  }, [stations]);

  const chartOptions: ApexOptions = useMemo(() => {
    return {
      chart: {
        type: chartType,
        height: 400,
        animations: {
          enabled: true,
        },
        toolbar: {
          show: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: chartData.map((d) => d.time),
        title: {
          text: "시간",
        },
      },
      yaxis: {
        title: {
          text: "인원수",
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
      },
      legend: {
        position: "top",
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
        },
      },
      stroke: {
        width: chartType === 'line' ? 3 : 1,
      }
    };
  }, [chartData, chartType]);

  const chartSeries = useMemo(() => {
    return [
      {
        name: "승차",
        data: chartData.map((d) => d.boarding),
      },
      {
        name: "하차",
        data: chartData.map((d) => d.alighting),
      },
    ];
  }, [chartData]);

  const showOverallLoading = isLoadingInitialData || isPending;

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        <h1 className="text-2xl font-bold mb-4">오류</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 relative">
      {showOverallLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">버스 승하차 데이터 분석</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            노선 선택
          </label>
          <Select
            onValueChange={(value) => setSelectedRoute(value || null)}
            value={selectedRoute || ""}
          >
            <SelectTrigger>
              <SelectValue placeholder="노선을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">모든 노선</SelectItem>
              {routes.map((route) => (
                <SelectItem key={route} value={route}>
                  {route}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            정류장 선택
          </label>
          <VirtualizedCombobox
            options={stationOptions}
            value={selectedStation || ""}
            onSelect={setSelectedStation}
            placeholder="정류장을 선택하세요..."
            searchPlaceholder="정류장 검색..."
            noResultsMessage="검색 결과가 없습니다."
          />
        </div>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">시간대별 승하차 인원</h2>
            <div className="flex justify-end gap-2">
              <Button
                variant={chartType === "bar" ? "secondary" : "ghost"}
                size="sm"
                className="border w-16"
                onClick={() => setChartType("bar")}
              >
                막대
              </Button>
              <Button
                variant={chartType === "line" ? "secondary" : "ghost"}
                size="sm"
                className="border w-16"
                onClick={() => setChartType("line")}
              >
                선
              </Button>
            </div>
          </div>
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <Chart
              options={chartOptions}
              series={chartSeries}
              type={chartType}
              height={400}
            />
          </Suspense>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">상세 데이터</h2>
          <DataTable rows={filteredData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
