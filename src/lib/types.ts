export interface BusData {
  time: string;
  stopName: string;
  routeNo: number;
  vehicleNo: string;
  crowd: number;
}

export interface BusDataResponse {
  status: string;
  count: number;
  data: BusData[];
}

