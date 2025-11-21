import React, {
  useState,
  useEffect,
  useMemo,
  useTransition,
  Suspense,
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "./ui/select";
import { DataTable } from "./DataTable";
import { 
  Loader2, 
  TrendingUp, 
  MapPin, 
  Users, 
  Clock,
  Bus,
  BarChart3,
  Activity
} from "lucide-react";
import { VirtualizedCombobox } from "./ui/combobox";
import { Button } from "./ui/button";
import type { ApexOptions } from "apexcharts";
import type { BusData, BusDataResponse } from "../lib/types";
import { STATION_DATA } from "../lib/stationData";

const Chart = React.lazy(() => import("react-apexcharts"));

type ViewMode = "time" | "station" | "dayOfWeek" | "heatmap";

const Dashboard: React.FC = () => {
  const [parsedData, setParsedData] = useState<BusData[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"bar" | "line" | "heatmap">("bar");
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("time");
  const [error, setError] = useState<string | null>(null);

  // View mode Korean labels
  const viewModeLabels: Record<ViewMode, string> = {
    time: "📊 시간별",
    station: "📍 정류장별",
    dayOfWeek: "📅 요일별",
    heatmap: "🔥 히트맵 (시간x정류장)"
  };

  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingInitialData(true);
      try {
        const response = await fetch(
          "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLiM4661kI9PluKvCDmbU6m8QXnv3feE2rHvNwhR6AIwioVfQNseuKcJinw23yHJtR6XFvicYd20XWuyI-hS6qot23ke7FxSk6V3wQYCqgZRh-ua0fWSHz3orbsHKVvwl9sfRb-1YJ3gfzsO-SHluGkbqk-fxHuoZkerDSeCxCXBR6Uxyel6h7pybmDykZKgUFV4eRRPJXevY86mOS8gxven-N5PX8AEiSNrJhJaVI5qqfgX-bGBdUm5ZTfUqH52D7k1SwRK86AmKlfYjjJCug9qGsTi4A&lib=MNazO6jUKAMgmLoNFGkK3lulQkmJ5Oea8"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData: BusDataResponse = await response.json();
        if (!jsonData || !jsonData.data || jsonData.data.length === 0) {
          setError("데이터를 불러왔지만 비어 있습니다.");
          setIsLoadingInitialData(false);
          return;
        }
        startTransition(() => {
          setParsedData(jsonData.data);
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

  // Automatically switch chart type when view mode changes
  useEffect(() => {
    if (viewMode === "heatmap") {
      setChartType("heatmap");
    } else {
      setChartType("bar");
    }
  }, [viewMode]);

  const routes = useMemo(() => {
    if (parsedData.length === 0) return [];
    const uniqueRoutes = [
      ...new Set(parsedData.map((d) => String(d.routeNo))),
    ].filter(Boolean);
    return uniqueRoutes.sort();
  }, [parsedData]);

  const stations = useMemo(() => {
    if (parsedData.length === 0) return [];
    
    // Get all unique stations from the actual data
    const dataStations = [
      ...new Set(parsedData.map((d) => d.stopName)),
    ].filter(Boolean);
    
    // If we have STATION_DATA, use it for ordering, but include all data stations
    if (STATION_DATA.result.length > 0) {
      const orderedStations = STATION_DATA.result[0].stations.map(s => s.stationName);
      // Combine: ordered stations first, then any additional stations from data
      const additionalStations = dataStations.filter(s => !orderedStations.includes(s));
      return [...orderedStations, ...additionalStations.sort()];
    }
    
    // Otherwise just return sorted data stations
    return dataStations.sort();
  }, [parsedData]);

  const filteredData = useMemo(() => {
    if (parsedData.length === 0) return [];
    let filtered = parsedData;
    if (selectedRoute) {
      filtered = filtered.filter((d) => String(d.routeNo) === selectedRoute);
    }
    if (selectedStation) {
      filtered = filtered.filter((d) => d.stopName === selectedStation);
    }
    return filtered;
  }, [parsedData, selectedRoute, selectedStation]);

  const chartData = useMemo(() => {
    if (viewMode === "heatmap") {
      // Heatmap: Series = Stations (Y), X = Time (Hour), Value = Crowd
      // We need to aggregate by (Station, Hour)
      
      const orderedStations = STATION_DATA.result.length > 0 
        ? STATION_DATA.result[0].stations.map(s => s.stationName)
        : stations;

      // Initialize structure
      const stationMap = new Map<string, Map<string, { sum: number; count: number }>>();
      orderedStations.forEach(st => stationMap.set(st, new Map()));

      // Collect all unique hours from the data
      const hoursSet = new Set<number>();

      filteredData.forEach(d => {
        const date = new Date(d.time);
        const hour = date.getHours();
        const hourStr = `${hour.toString().padStart(2, '0')}시`;
        
        hoursSet.add(hour);

        if (stationMap.has(d.stopName)) {
          const hourMap = stationMap.get(d.stopName)!;
          if (!hourMap.has(hourStr)) {
            hourMap.set(hourStr, { sum: 0, count: 0 });
          }
          const entry = hourMap.get(hourStr)!;
          entry.sum += d.crowd;
          entry.count += 1;
        }
      });

      // Sort hours and create hour strings
      const sortedHours = Array.from(hoursSet).sort((a, b) => a - b);
      const hourLabels = sortedHours.map(h => `${h.toString().padStart(2, '0')}시`);

      // Build Series
      return orderedStations.map(st => {
        const hourMap = stationMap.get(st)!;
        return {
          name: st,
          data: hourLabels.map(h => {
            const entry = hourMap.get(h);
            return {
              x: h,
              y: entry ? Math.round(entry.sum / entry.count) : 0
            };
          })
        };
      }).reverse(); // Reverse to put first station at top
    }
    else if (viewMode === "time") {
      const grouped = filteredData.reduce((acc, d) => {
        const date = new Date(d.time);
        const hour = date.getHours();
        const timeStr = `${hour.toString().padStart(2, '0')}시`;
        
        if (!acc[timeStr]) {
          acc[timeStr] = { sum: 0, count: 0 };
        }
        acc[timeStr].sum += d.crowd;
        acc[timeStr].count += 1;
        return acc;
      }, {} as Record<string, { sum: number; count: number }>);

      return Object.entries(grouped)
        .map(([time, { sum }]) => ({
          category: time,
          crowd: sum, // User requested "Sum calculation" (합계산)
        }))
        .sort((a, b) => a.category.localeCompare(b.category));
    } else if (viewMode === "station") {
      const grouped = filteredData.reduce((acc, d) => {
        if (!acc[d.stopName]) {
          acc[d.stopName] = { sum: 0, count: 0 };
        }
        acc[d.stopName].sum += d.crowd;
        acc[d.stopName].count += 1;
        return acc;
      }, {} as Record<string, { sum: number; count: number }>);

      const orderedStations = STATION_DATA.result.length > 0 
        ? STATION_DATA.result[0].stations 
        : stations.map(s => ({ stationName: s }));
      
      return orderedStations.map(s => {
        const data = grouped[s.stationName];
        return {
          category: s.stationName,
          crowd: data ? Math.round(data.sum / data.count) : 0
        };
      }).filter(d => d.crowd > 0 || !selectedStation);
    } else { // dayOfWeek
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      const grouped = filteredData.reduce((acc, d) => {
        const date = new Date(d.time);
        const dayIndex = date.getDay();
        
        if (!acc[dayIndex]) {
          acc[dayIndex] = { sum: 0, count: 0 };
        }
        acc[dayIndex].sum += d.crowd;
        acc[dayIndex].count += 1;
        return acc;
      }, {} as Record<number, { sum: number; count: number }>);

      return days.map((day, index) => ({
        category: day,
        crowd: grouped[index] ? Math.round(grouped[index].sum / grouped[index].count) : 0
      }));
    }
  }, [filteredData, viewMode, selectedStation, stations]);

  const stationOptions = useMemo(() => {
    return stations.map((station) => ({ value: station, label: station }));
  }, [stations]);

  const chartOptions: ApexOptions = useMemo(() => {
    const commonOptions: ApexOptions = {
      chart: {
        height: viewMode === 'heatmap' ? 800 : 400, // Taller for heatmap
        animations: { enabled: true },
        toolbar: { show: false },
      },
      dataLabels: { enabled: false },
      tooltip: { shared: true, intersect: false },
      legend: { position: "top" },
    };

    if (viewMode === "heatmap") {
      return {
        ...commonOptions,
        chart: { ...commonOptions.chart, type: 'heatmap' },
        xaxis: {
            type: 'category',
            title: { text: '시간' }
        },
        yaxis: {
            title: { text: '정류장' }
        },
        plotOptions: {
          heatmap: {
            shadeIntensity: 0.5,
            radius: 0,
            useFillColorAsStroke: true,
            colorScale: {
              ranges: [
                {
                  from: 0,
                  to: 15,
                  name: '여유',
                  color: '#00A100' // Green
                },
                {
                  from: 16,
                  to: 25,
                  name: '보통',
                  color: '#FFB200' // Yellow/Orange
                },
                {
                  from: 26,
                  to: 100,
                  name: '혼잡',
                  color: '#FF0000' // Red
                }
              ]
            }
          }
        }
      };
    }

    // Standard Bar/Line Options
    return {
      ...commonOptions,
      chart: { ...commonOptions.chart, type: chartType as "bar" | "line" },
      xaxis: {
        categories: (chartData as any[]).map((d) => d.category),
        title: {
          text: viewMode === "time" ? "시간" : viewMode === "station" ? "정류장" : "요일",
        },
        labels: {
            rotate: viewMode === "station" ? -45 : 0,
            trim: true,
            maxHeight: 120,
        }
      },
      yaxis: {
        title: {
          text: "혼잡도",
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
        },
      },
      stroke: {
        width: chartType === "line" ? 3 : 1,
      },
      colors: ["#008FFB"],
    };
  }, [chartData, chartType, viewMode]);

  const chartSeries = useMemo(() => {
    if (viewMode === "heatmap") {
      return chartData as ApexAxisChartSeries;
    }
    return [
      {
        name: "혼잡도",
        data: (chartData as any[]).map((d) => d.crowd),
      },
    ];
  }, [chartData, viewMode]);

  const showOverallLoading = isLoadingInitialData || isPending;

  // Statistics calculations
  const statistics = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalRoutes: 0,
        totalStations: 0,
        averageCrowd: 0,
        peakCrowd: 0,
        peakHour: '-',
        totalRecords: 0
      };
    }

    const uniqueRoutes = new Set(filteredData.map(d => d.routeNo));
    const uniqueStations = new Set(filteredData.map(d => d.stopName));
    const totalCrowd = filteredData.reduce((sum, d) => sum + d.crowd, 0);
    const avgCrowd = Math.round(totalCrowd / filteredData.length);
    const maxCrowd = Math.max(...filteredData.map(d => d.crowd));

    // Find peak hour
    const hourCrowds = filteredData.reduce((acc, d) => {
      const hour = new Date(d.time).getHours();
      if (!acc[hour]) acc[hour] = { sum: 0, count: 0 };
      acc[hour].sum += d.crowd;
      acc[hour].count += 1;
      return acc;
    }, {} as Record<number, { sum: number; count: number }>);

    const peakHourNum = Object.entries(hourCrowds).reduce((peak, [hour, data]) => {
      const avg = data.sum / data.count;
      const peakAvg = hourCrowds[peak] ? hourCrowds[peak].sum / hourCrowds[peak].count : 0;
      return avg > peakAvg ? parseInt(hour) : peak;
    }, 0);

    return {
      totalRoutes: uniqueRoutes.size,
      totalStations: uniqueStations.size,
      averageCrowd: avgCrowd,
      peakCrowd: maxCrowd,
      peakHour: `${peakHourNum.toString().padStart(2, '0')}:00`,
      totalRecords: filteredData.length
    };
  }, [filteredData]);

  // Helper to get crowd level color
  const getCrowdColor = (crowd: number) => {
    if (crowd < 15) return 'text-green-600';
    if (crowd < 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCrowdBadge = (crowd: number) => {
    if (crowd < 15) return { text: '여유', class: 'bg-green-100 text-green-700 border-green-200' };
    if (crowd < 25) return { text: '보통', class: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { text: '혼잡', class: 'bg-red-100 text-red-700 border-red-200' };
  };

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        <h1 className="text-2xl font-bold mb-4">오류</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-100 via-indigo-50 to-purple-50 pb-12">
      {showOverallLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700">데이터 로딩 중...</p>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <div className="gradient-primary text-white py-12 px-4 mb-8 shadow-2xl">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Bus className="h-10 w-10" />
            <h1 className="text-4xl font-bold">버스 혼잡도 분석 대시보드</h1>
          </div>
          <p className="text-blue-100 text-lg ml-13">실시간 버스 데이터를 분석하여 혼잡도를 시각화합니다</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
          {/* Total Routes Card */}
          <div className="stat-card card-modern p-6 hover-lift">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Bus className="h-6 w-6 text-blue-600" />
              </div>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">총 노선 수</p>
            <p className="text-3xl font-bold text-gray-900">{statistics.totalRoutes}</p>
            <p className="text-xs text-gray-500 mt-2">운행 중인 노선</p>
          </div>

          {/* Total Stations Card */}
          <div className="stat-card card-modern p-6 hover-lift">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-purple-100 p-3 rounded-xl">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">총 정류장 수</p>
            <p className="text-3xl font-bold text-gray-900">{statistics.totalStations}</p>
            <p className="text-xs text-gray-500 mt-2">서비스 정류장</p>
          </div>

          {/* Average Crowd Card */}
          <div className="stat-card card-modern p-6 hover-lift">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">평균 혼잡도</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${getCrowdColor(statistics.averageCrowd)}`}>
                {statistics.averageCrowd}
              </p>
              <span className={`text-xs px-2 py-1 rounded-full border ${getCrowdBadge(statistics.averageCrowd).class}`}>
                {getCrowdBadge(statistics.averageCrowd).text}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">전체 데이터 평균</p>
          </div>

          {/* Peak Hour Card */}
          <div className="stat-card card-modern p-6 hover-lift">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-orange-100 p-3 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">피크 시간</p>
            <p className="text-3xl font-bold text-gray-900">{statistics.peakHour}</p>
            <p className="text-xs text-gray-500 mt-2">최대 혼잡 시간대</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="card-modern p-6 mb-8 animate-fade-in">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            필터 설정
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                보기 모드
              </label>
              <Select
                onValueChange={(value) => setViewMode(value as ViewMode)}
                value={viewMode}
              >
                <SelectTrigger className="border-2 hover:border-primary transition-colors">
                  <span className="block truncate">{viewModeLabels[viewMode]}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">📊 시간별</SelectItem>
                  <SelectItem value="station">📍 정류장별</SelectItem>
                  <SelectItem value="dayOfWeek">📅 요일별</SelectItem>
                  <SelectItem value="heatmap">🔥 히트맵 (시간x정류장)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                노선 선택
              </label>
              <Select
                onValueChange={(value) => setSelectedRoute(value || null)}
                value={selectedRoute || ""}
              >
                <SelectTrigger className="border-2 hover:border-primary transition-colors">
                  <span className="block truncate">{selectedRoute || "🚌 전체"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  {routes.map((route) => (
                    <SelectItem key={route} value={route}>
                      {route}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
        </div>

        {/* Charts and Data Section */}
        <div className="flex flex-col gap-8">
          {/* Chart Section - Full width */}
          <div className="card-modern p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                {viewMode === "time" ? "시간대별 총 혼잡도 (합계)" : 
                 viewMode === "station" ? "정류장별 혼잡도" : 
                 viewMode === "dayOfWeek" ? "요일별 혼잡도" : 
                 "혼잡도 히트맵"}
              </h2>
              {viewMode !== "heatmap" && (
                <div className="flex gap-2">
                  <Button
                    variant={chartType === "bar" ? "default" : "outline"}
                    size="sm"
                    className="w-20 transition-all"
                    onClick={() => setChartType("bar")}
                  >
                    📊 막대
                  </Button>
                  <Button
                    variant={chartType === "line" ? "default" : "outline"}
                    size="sm"
                    className="w-20 transition-all"
                    onClick={() => setChartType("line")}
                  >
                    📈 선
                  </Button>
                </div>
              )}
            </div>
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-4 rounded-xl">
              <Suspense
                fallback={
                  <div className="flex flex-col justify-center items-center h-[400px]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-sm text-gray-600">차트 로딩 중...</p>
                  </div>
                }
              >
                <Chart
                  options={{
                    ...chartOptions,
                    yaxis: {
                      ...chartOptions.yaxis,
                      title: {
                        text: viewMode === "time" ? "총 혼잡도" : "혼잡도",
                      }
                    }
                  }}
                  series={chartSeries.map(s => ({
                    ...s,
                    name: viewMode === "time" ? "총 혼잡도" : s.name
                  }))}
                  type={chartType === 'heatmap' ? 'heatmap' : chartType}
                  height={viewMode === 'heatmap' ? 800 : 400}
                />
              </Suspense>
            </div>
          </div>

          {/* Data Table Section - Full width */}
          <div className="card-modern p-6 animate-scale-in">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              상세 데이터
            </h2>
            <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="font-semibold">📋 총 {statistics.totalRecords.toLocaleString()}개 레코드</p>
            </div>
            <DataTable rows={filteredData} maxHeight={500} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
