export interface QuoteMetrics {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    booked: number;
    potentialRevenue: number;
    conversionRate: number;
}

export interface ShipmentMetrics {
    total: number;
    active: number;
    pending: number;
    delivered: number;
    byStatus: {
        [key: string]: number;
    };
}

export interface InventoryMetrics {
    totalActive: number;
    byStatus: {
        [key: string]: number;
    };
    reconPipeline: {
        [key: string]: number;
    };
    aging: {
        averageDaysOnLot: number;
    };
}

export interface RecentActivity {
    year: number;
    make: string;
    modelName: string;
    updatedAt: string;
    status: string;
    price: number;
}

export interface DashboardData {
    quotes: QuoteMetrics;
    shipments: ShipmentMetrics;
    inventory: InventoryMetrics;
    recentActivity: RecentActivity[];
}

export interface DashboardResponse {
    statusCode: number;
    data: DashboardData;
    message: string;
    success: boolean;
}
