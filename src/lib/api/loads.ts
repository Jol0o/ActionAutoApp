import { apiClient } from "@/lib/api-client";
import type {
  LocationBlock,
  LoadVehicle,
  LoadDates,
  LoadAdditionalInfo,
  LoadContract,
} from "@/components/create-load/types";
import type { Load } from "@/types/load";

export interface VinLookupResult {
  year: number;
  make: string;
  model: string;
  color: string;
  condition: "Operable" | "Inoperable";
}

export interface RateResult {
  miles: number;
  estimatedRate: number;
  eta: { min: number; max: number };
}

export interface CreateLoadPayload {
  postType: "load-board" | "assign-carrier";
  pickup: LocationBlock;
  delivery: LocationBlock;
  vehicles: LoadVehicle[];
  dates: LoadDates;
  additionalInfo: LoadAdditionalInfo;
  contract: LoadContract;
}

export interface CreatedLoad {
  _id: string;
  loadNumber: string;
  status: string;
}

export interface InventoryVehicle {
  vin: string;
  year: number;
  make: string;
  model: string;
  color: string;
  condition: "Operable" | "Inoperable";
}

export async function getInventoryVehicles(q?: string): Promise<InventoryVehicle[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  const res = await apiClient.get<{ data: InventoryVehicle[] }>(`/api/loads/vehicles${params}`);
  return res.data.data;
}

export async function lookupVin(vin: string): Promise<VinLookupResult> {
  const res = await apiClient.get<{ data: VinLookupResult }>(`/api/loads/vin/${vin}`);
  return res.data.data;
}

export async function calculateLoadRate(
  pickupZip: string,
  deliveryZip: string,
  vehicles: Array<{ trailerType: string; condition: string }>
): Promise<RateResult> {
  const res = await apiClient.post<{ data: RateResult }>("/api/loads/calculate-rate", {
    pickupZip,
    deliveryZip,
    vehicles,
  });
  return res.data.data;
}

export interface LoadsQuery {
  status?: string
  postType?: string
  q?: string
  page?: number
  limit?: number
}

export interface LoadsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface LoadsResult {
  loads: Load[]
  pagination: LoadsPagination
}

export interface LoadStats {
  all: number
  Posted: number
  Assigned: number
  "In-Transit": number
  Delivered: number
  Cancelled: number
}

export async function getLoads(query?: LoadsQuery): Promise<LoadsResult> {
  const params = new URLSearchParams()
  if (query?.status)   params.set("status",   query.status)
  if (query?.postType) params.set("postType",  query.postType)
  if (query?.q)        params.set("q",         query.q)
  if (query?.page)     params.set("page",      String(query.page))
  if (query?.limit)    params.set("limit",     String(query.limit))
  const qs = params.toString()
  const res = await apiClient.get<{ data: LoadsResult }>(`/api/loads${qs ? `?${qs}` : ""}`)
  return res.data.data
}

export async function getLoadStats(): Promise<LoadStats> {
  const res = await apiClient.get<{ data: LoadStats }>("/api/loads/stats")
  return res.data.data
}

export async function createLoad(payload: CreateLoadPayload): Promise<CreatedLoad> {
  const body = {
    postType:         payload.postType,
    pickupLocation:   payload.pickup,
    deliveryLocation: payload.delivery,
    vehicles: payload.vehicles.map(({ id: _id, ...v }) => ({
      ...v,
      year: v.year ? Number(v.year) : undefined,
    })),
    dates:          payload.dates,
    additionalInfo: payload.additionalInfo,
    contract:       payload.contract,
  };
  const res = await apiClient.post<{ data: CreatedLoad }>("/api/loads", body);
  return res.data.data;
}
