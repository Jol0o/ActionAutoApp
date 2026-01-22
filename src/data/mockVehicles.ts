// data/mockVehicles.ts

import { Vehicle } from "@/types/inventory"

export const MOCK_VEHICLES: Vehicle[] = [
    {
        id: "1",
        stockNumber: "L20294",
        year: 2022,
        make: "Acura",
        model: "MDX",
        trim: "SH-AWD W/TECH",
        price: 45990,
        mileage: 46870,
        vin: "5J8YD4H86NL123456",
        image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop",
        location: "Orem, UT",
        color: "White",
        transmission: "Automatic",
        fuelType: "Gasoline"
    },
    {
        id: "2",
        stockNumber: "L21163",
        year: 2024,
        make: "Mercedes-Benz",
        model: "S-Class",
        trim: "S 580 4MATIC",
        price: 110000,
        mileage: 12483,
        vin: "WDDUX8GB8PA123456",
        image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop",
        location: "Lehi, UT",
        color: "Black",
        transmission: "Automatic",
        fuelType: "Gasoline"
    },
    {
        id: "3",
        stockNumber: "L20694",
        year: 2021,
        make: "Acura",
        model: "RDX",
        trim: "SH-AWD W/A-SPEC",
        price: 38500,
        mileage: 96441,
        vin: "5J8TC2H51ML123456",
        image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
        location: "Orem, UT",
        color: "Silver",
        transmission: "Automatic",
        fuelType: "Gasoline"
    },
    {
        id: "4",
        stockNumber: "L21009",
        year: 2020,
        make: "Audi",
        model: "A6",
        trim: "Premium Plus",
        price: 32900,
        mileage: 41629,
        vin: "WAUC2AF28LN123456",
        image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop",
        location: "Lehi, UT",
        color: "Blue",
        transmission: "Automatic",
        fuelType: "Gasoline"
    },
    {
        id: "5",
        stockNumber: "L20615",
        year: 2019,
        make: "BMW",
        model: "X5",
        trim: "xDrive40i",
        price: 42000,
        mileage: 38076,
        vin: "5UXCR6C09KL123456",
        image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop",
        location: "Orem, UT",
        color: "White",
        transmission: "Automatic",
        fuelType: "Gasoline"
    }
]