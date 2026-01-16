export type UserRole = 'Admin' | 'Manager' | 'Viewer';

export interface User {
    id: string;
    _id?: string; // Some backends use _id
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

export interface AuthTokens {
    access: {
        token: string;
        expires: string;
    };
    refresh: {
        token: string;
        expires: string;
    };
}

export interface AuthData {
    user: User;
    tokens: AuthTokens;
}

export type AuthResponse = ApiResponse<AuthData>;

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

// --- Dashboard & Vehicle Types ---

export type VehicleStatus = 'In Recon' | 'Ready for Sale' | 'Sold';
export type VehicleStep = 'Inspection' | 'Mechanical' | 'Body / Paint' | 'Detail' | 'Photography' | 'Ready';

export interface Note {
    text: string;
    author: string | User; // ID or populated User object
    date: string; // ISO date string
    _id?: string;
}

export interface IVehicle {
    _id: string;
    vin: string;
    year: number;
    make: string;
    modelName: string;
    trim?: string;
    color?: string;
    stockNumber?: string;
    status: VehicleStatus;
    currentStep: VehicleStep;
    assignedTo?: string | User;
    reconStartDate?: string;
    stepEnteredAt?: string;
    notes: Note[];
    createdAt?: string;
    updatedAt?: string;
}

export interface DashboardMetrics {
    inventoryOverview: {
        totalActive: number;
        inRecon: number;
        readyForSale: number;
    };
    reconStatus: Record<VehicleStep, number>;
    needsAttention: IVehicle[];
    recentActivity: Partial<IVehicle>[];
}
