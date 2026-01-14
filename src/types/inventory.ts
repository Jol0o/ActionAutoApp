// Type definitions for car inventory and shipping quotes

export interface Vehicle {
    id: string;
    stockNumber: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    price: number;
    mileage: number;
    vin: string;
    image: string;
    location: string;
    color?: string;
    transmission?: string;
    fuelType?: string;
}

export interface ShippingQuoteFormData {
    // Customer Information
    firstName: string;
    lastName: string;
    email: string;
    phone: string;

    // Destination
    zipCode: string;
    units: number;
    fullAddress: string;

    // Transport Options
    enclosedTrailer: boolean;
    vehicleInoperable: boolean;
}

export interface ShippingQuote {
    vehicleId: string;
    basePrice: number;
    enclosedTrailerFee: number;
    inoperableFee: number;
    totalPrice: number;
    estimatedDays: string;
}

export interface QuoteCalculation {
    quotes: Record<string, ShippingQuote>; // vehicleId -> ShippingQuote
    formData: ShippingQuoteFormData;
}
