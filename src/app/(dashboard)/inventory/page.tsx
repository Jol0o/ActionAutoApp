"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { CarInventoryCard } from "@/components/car-inventory-card"
import type { Vehicle } from "@/types/inventory"

const mockVehicles: Vehicle[] = [
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
  },
  {
    id: "6",
    stockNumber: "L21143",
    year: 2018,
    make: "Chevrolet",
    model: "Silverado 1500",
    trim: "LT Crew Cab",
    price: 28900,
    mileage: 116639,
    vin: "1GCUKREC0JZ123456",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop",
    location: "Lehi, UT",
    color: "Red",
    transmission: "Automatic",
    fuelType: "Gasoline"
  },
  {
    id: "7",
    stockNumber: "L20893",
    year: 2021,
    make: "Honda",
    model: "CR-V",
    trim: "Hybrid Sport",
    price: 29500,
    mileage: 55997,
    vin: "7FARW2H89ME123456",
    image: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&h=600&fit=crop",
    location: "Orem, UT",
    color: "Gray",
    transmission: "Automatic",
    fuelType: "Hybrid"
  },
  {
    id: "8",
    stockNumber: "L20846",
    year: 2020,
    make: "Toyota",
    model: "RAV4",
    trim: "XLE Premium",
    price: 27800,
    mileage: 65399,
    vin: "2T3N1RFV4LC123456",
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&h=600&fit=crop",
    location: "Lehi, UT",
    color: "Silver",
    transmission: "Automatic",
    fuelType: "Gasoline"
  },
  {
    id: "9",
    stockNumber: "M21027",
    year: 2019,
    make: "Ford",
    model: "F-150",
    trim: "Lariat SuperCrew",
    price: 38900,
    mileage: 163076,
    vin: "1FTEW1E89KF123456",
    image: "https://www.automotiveaddicts.com/wp-content/uploads/2019/10/2019-ford-f-150-limited.jpg",
    location: "Orem, UT",
    color: "Black",
    transmission: "Automatic",
    fuelType: "Gasoline"
  },
  {
    id: "10",
    stockNumber: "M19928",
    year: 2022,
    make: "Tesla",
    model: "Model 3",
    trim: "Long Range AWD",
    price: 42500,
    mileage: 76762,
    vin: "5YJ3E1EA8NF123456",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop",
    location: "Lehi, UT",
    color: "Blue",
    transmission: "Automatic",
    fuelType: "Electric"
  },
  {
    id: "11",
    stockNumber: "L21076",
    year: 2020,
    make: "Lexus",
    model: "RX 350",
    trim: "F Sport",
    price: 41200,
    mileage: 63225,
    vin: "2T2BZMCA4LC123456",
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop",
    location: "Orem, UT",
    color: "White",
    transmission: "Automatic",
    fuelType: "Gasoline"
  },
  {
    id: "12",
    stockNumber: "L20301",
    year: 2021,
    make: "Jeep",
    model: "Grand Cherokee",
    trim: "Limited 4WD",
    price: 36900,
    mileage: 69682,
    vin: "1C4RJFBG9MC123456",
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&h=600&fit=crop",
    location: "Lehi, UT",
    color: "Gray",
    transmission: "Automatic",
    fuelType: "Gasoline"
  }
]

type SortOption =
  | "make-asc"
  | "price-low"
  | "price-high"
  | "mileage-low"
  | "mileage-high"
  | "year-latest"

export default function InventoryPage() {
  const [sortBy, setSortBy] = React.useState<SortOption>("price-high")

  const sortedVehicles = React.useMemo(() => {
    const list = [...mockVehicles]
    switch (sortBy) {
      case "make-asc":
        return list.sort((a, b) => a.make.localeCompare(b.make))
      case "price-low":
        return list.sort((a, b) => a.price - b.price)
      case "price-high":
        return list.sort((a, b) => b.price - a.price)
      case "mileage-low":
        return list.sort((a, b) => a.mileage - b.mileage)
      case "mileage-high":
        return list.sort((a, b) => b.mileage - a.mileage)
      case "year-latest":
        return list.sort((a, b) => b.year - a.year)
      default:
        return list
    }
  }, [sortBy])

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm">
            <span className="font-bold">RESULTS:</span> {mockVehicles.length}
          </p>

          <div className="flex items-center gap-2">
            <span className="text-sm">Sort by</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="border rounded px-3 py-1.5 pr-8 text-sm"
              >
                <option value="make-asc">Make Ascending</option>
                <option value="price-low">Price Low</option>
                <option value="price-high">Price High</option>
                <option value="mileage-low">Mileage Low</option>
                <option value="mileage-high">Mileage High</option>
                <option value="year-latest">Year Latest</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
          {sortedVehicles.map((vehicle) => (
            <CarInventoryCard
              key={vehicle.id}
              vehicle={vehicle}
              onGetQuote={() => console.log("Get quote", vehicle.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
