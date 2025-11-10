
import React, { useState, useEffect, useMemo } from "react";
import { pivotToLongRideAlight } from "../lib/fileParser";
import { LongData } from "../lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DataTable } from "./DataTable";
import { Loader2 } from "lucide-react";
import { VirtualizedCombobox } from "./ui/combobox";

const Dashboard: React.FC = () => {
  const [parsedData, setParsedData] = useState<Record<string, any>[]>([]);
  const [routes, setRoutes] = useState<string[]>([]);
  const [stations, setStations] = useState<string[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filteredData, setFilteredData] = useState<LongData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/data.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        if (!jsonData || jsonData.length === 0) {
          setError("JSON 파일을 파싱했지만 데이터가 비어 있습니다.");
          return;
        }
        setParsedData(jsonData);
      } catch (e) {
        console.error("데이터 로딩 중 오류 발생:", e);
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
      }
    };
    fetchData();
  }, []);

  const longData = useMemo(() => {
    if (!parsedData || parsedData.length === 0) return [];
    return pivotToLongRideAlight(parsedData, ["노선번호", "노선명", "역명"]);
  }, [parsedData]);

  useEffect(() => {
    if (longData.length > 0) {
      setFilteredData(longData); // Set initial data
      const uniqueRoutes = [
        ...new Set(longData.map((d) => d["노선번호"] as string)),
      ].filter(Boolean);
      const uniqueStations = [
        ...new Set(longData.map((d) => d["역명"] as string)),
      ].filter(Boolean);
      setRoutes(uniqueRoutes.sort());
      setStations(uniqueStations.sort());
    }
  }, [longData]);

  useEffect(() => {
    if (longData.length === 0) return;

    setIsFiltering(true);
    const timer = setTimeout(() => {
      let filtered = longData;
      if (selectedRoute) {
        filtered = filtered.filter((d) => d["노선번호"] === selectedRoute);
      }
      if (selectedStation) {
        filtered = filtered.filter((d) => d["역명"] === selectedStation);
      }
      setFilteredData(filtered);
      setIsFiltering(false);
    }, 0);

    return () => clearTimeout(timer);
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
    return stations.map(station => ({ value: station, label: station }));
  }, [stations]);

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        <h1 className="text-2xl font-bold mb-4">오류</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">버스 승하차 데이터 분석</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            노선 선택
          </label>
          <Select onValueChange={setSelectedRoute} value={selectedRoute || ""}>
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
        {isFiltering && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-30 rounded-lg">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">시간대별 승하차 인원</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="boarding" fill="#8884d8" name="승차" />
              <Bar dataKey="alighting" fill="#82ca9d" name="하차" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">상세 데이터</h2>
          <DataTable rows={filteredData.slice(0, 500)} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
