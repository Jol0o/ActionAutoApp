"use client"

import * as React from "react"
import {
    Truck,
    MapPin,
    Navigation,
    Clock,
    DollarSign,
    ChevronRight,
    Plus,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    Calendar,
    Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TransportationPage() {
    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Transportation</h1>
                    <p className="text-muted-foreground text-sm">Manage vehicle logistics, shipping quotes, and incoming fleet tracking.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Globe className="size-4" /> Carriers
                    </Button>
                    <Button size="sm" className="gap-2 bg-primary">
                        <Plus className="size-4" /> Book Shipment
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Active Shipments Table */}
                <div className="xl:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between border-b">
                            <div>
                                <CardTitle className="text-lg font-bold">Incoming Fleet</CardTitle>
                                <CardDescription>Real-time status of 8 vehicles in transit.</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search VIN or BOL..." className="pl-8 h-9" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-secondary border-b">
                                        <tr>
                                            <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                                            <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Origin</th>
                                            <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                            <th className="p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">ETA</th>
                                            <th className="p-4 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        <ShipmentRow
                                            vehicle="2022 Tesla Model 3"
                                            vin="5YJ3E..."
                                            origin="Manheim Las Vegas"
                                            status="On Truck"
                                            eta="Tomorrow"
                                            progress={75}
                                        />
                                        <ShipmentRow
                                            vehicle="2021 Ford F-150"
                                            vin="1FTEW..."
                                            origin="Denver, CO"
                                            status="Dispatched"
                                            eta="Jan 18"
                                            progress={20}
                                        />
                                        <ShipmentRow
                                            vehicle="2023 Honda CR-V"
                                            vin="5J8YK..."
                                            origin="Salt Lake City"
                                            status="Delivered"
                                            eta="Today"
                                            progress={100}
                                            isDelivered
                                        />
                                        <ShipmentRow
                                            vehicle="2020 Toyota RAV4"
                                            vin="2T3L1..."
                                            origin="Phoenix, AZ"
                                            status="Stalled"
                                            eta="Delayed"
                                            progress={45}
                                            isDelayed
                                        />
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quote Calculator */}
                <div className="space-y-6">
                    <Card className="border-none shadow-md bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Fast Quote</CardTitle>
                            <CardDescription className="text-xs">Estimate shipping costs for new acquisitions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pickup Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                    <Input placeholder="Zip Code or City" className="pl-9" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Destination</label>
                                <div className="relative">
                                    <Navigation className="absolute left-2.5 top-2.5 size-4 text-primary" />
                                    <Input value="Action Auto Lehi (84043)" disabled className="pl-9 bg-secondary" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" className="text-xs h-9 bg-primary/5 border-primary/20 text-primary font-bold">Sedan / SUV</Button>
                                    <Button variant="outline" size="sm" className="text-xs h-9">Truck / Heavy</Button>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-lg p-5 mt-4 text-white">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-white/50 uppercase">Estimated Quote</span>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 h-5 px-1.5 text-[9px]">Best Rate</Badge>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold">$450</span>
                                    <span className="text-white/50 text-[10px]">USD</span>
                                </div>
                                <p className="text-[9px] text-white/40 mt-1 italic">Average 3-day transit from Las Vegas Region.</p>
                                <Button className="w-full bg-primary mt-4 h-9 font-bold text-xs uppercase tracking-wider">Book This Shipment</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-primary/10">
                        <CardContent className="p-4 flex gap-4">
                            <div className="size-10 bg-primary rounded flex items-center justify-center text-white shrink-0">
                                <Truck className="size-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-primary tracking-tight">Preferred Carrier Network</h4>
                                <p className="text-[10px] text-primary leading-relaxed mt-1">
                                    Utilizing our ACERTUS partnership to guarantee $0 hidden fees and 100% insured transit.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function ShipmentRow({ vehicle, vin, origin, status, eta, progress, isDelivered, isDelayed }: { vehicle: string, vin: string, origin: string, status: string, eta: string, progress: number, isDelivered?: boolean, isDelayed?: boolean }) {
    return (
        <tr className="group hover:bg-background transition-colors">
            <td className="p-4">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">{vehicle}</span>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">{vin}</span>
                </div>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <MapPin className="size-3 text-muted-foreground" /> {origin}
                </div>
            </td>
            <td className="p-4">
                <div className="space-y-1.5 w-32">
                    <div className="flex justify-between items-center">
                        <span className={`text-[10px] font-bold uppercase ${isDelivered ? 'text-primary' : isDelayed ? 'text-destructive' : 'text-primary'}`}>{status}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 rounded-full ${isDelivered ? 'bg-primary/100' : isDelayed ? 'bg-destructive/100' : 'bg-primary'}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </td>
            <td className="p-4 text-right">
                <span className={`text-xs font-bold ${isDelayed ? 'text-destructive' : 'text-foreground'}`}>{eta}</span>
            </td>
            <td className="p-4">
                <MoreVertical className="size-4 text-muted-foreground cursor-pointer" />
            </td>
        </tr>
    )
}
