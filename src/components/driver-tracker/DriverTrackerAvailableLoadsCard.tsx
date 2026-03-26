"use client";

import * as React from "react";
import { Package, Truck, Loader2, UserPlus, ChevronDown, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shipment } from "@/types/transportation";
import { DriverTrackingItem } from "@/types/driver-tracking";
import { trailerTypeOptions } from "@/components/driver-profile/driver-profile-constants";

const trailerLabel = (val?: string) =>
    trailerTypeOptions.find((t) => t.value === val)?.label || val || "";

interface DriverTrackerAvailableLoadsCardProps {
    shipments: Shipment[];
    isLoading: boolean;
    activeDrivers: DriverTrackingItem[];
    onAssign: (shipmentId: string, driverId: string) => Promise<void>;
}

export function DriverTrackerAvailableLoadsCard({
    shipments,
    isLoading,
    activeDrivers,
    onAssign,
}: DriverTrackerAvailableLoadsCardProps) {
    const [assigning, setAssigning] = React.useState<string | null>(null);

    const handleAssign = async (shipmentId: string, driverId: string) => {
        setAssigning(shipmentId);
        try {
            await onAssign(shipmentId, driverId);
        } finally {
            setAssigning(null);
        }
    };

    return (
        <Card className="border-border/50 shadow-sm p-0 gap-0 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Package className="size-20" />
            </div>
            <CardHeader className="py-4 px-5 border-b border-border/10">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Truck className="size-4 text-primary" />
                            Available Loads
                        </CardTitle>
                        <p className="text-[10px] text-muted-foreground/60 font-medium mt-0.5">
                            {shipments.length} unassigned load{shipments.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    {shipments.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] font-bold bg-blue-500/10 text-blue-600">
                            {shipments.length} available
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-3 max-h-85 overflow-y-auto space-y-2">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                        <Loader2 className="size-5 text-primary animate-spin" />
                        <p className="text-xs text-muted-foreground">Loading loads...</p>
                    </div>
                )}

                {!isLoading && shipments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                        <div className="size-10 rounded-xl bg-muted/40 flex items-center justify-center">
                            <Package className="size-5 text-muted-foreground/40" />
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">No available loads</p>
                    </div>
                )}

                {shipments.map((shipment) => (
                    <div
                        key={shipment._id}
                        className="flex items-center justify-between rounded-xl border border-border/40 p-3 gap-2 hover:border-primary/30 hover:shadow-sm hover:bg-accent/30 transition-all duration-200"
                    >
                        <div className="flex items-start gap-3 min-w-0">
                            <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Package className="size-4 text-blue-600" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                                <p className="text-sm font-bold text-foreground truncate">
                                    {shipment.trackingNumber || shipment._id.slice(-8)}
                                </p>
                                {(shipment.origin || shipment.destination) && (
                                    <p className="text-[10px] text-muted-foreground/60 truncate font-medium">
                                        {shipment.origin} → {shipment.destination}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                    {shipment.isPostedToBoard && (
                                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-blue-300 text-blue-600">
                                            <Megaphone className="size-2 mr-0.5" />Board
                                        </Badge>
                                    )}
                                    {shipment.trailerTypeRequired && (
                                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-purple-300 text-purple-600">
                                            <Truck className="size-2 mr-0.5" />{trailerLabel(shipment.trailerTypeRequired)}
                                        </Badge>
                                    )}
                                    {shipment.vehicleCount && shipment.vehicleCount > 1 && (
                                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-indigo-300 text-indigo-600">
                                            {shipment.vehicleCount} cars
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="sm"
                                    className="h-7 px-2.5 text-[10px] font-semibold gap-1 shrink-0 shadow-sm"
                                    disabled={assigning === shipment._id || activeDrivers.length === 0}
                                >
                                    {assigning === shipment._id ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        <>
                                            <UserPlus className="size-3" />
                                            Assign
                                            <ChevronDown className="size-3" />
                                        </>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {activeDrivers.length === 0 && (
                                    <div className="px-3 py-2 text-xs text-muted-foreground">No active drivers</div>
                                )}
                                {activeDrivers.map((driver) => (
                                    <DropdownMenuItem
                                        key={driver.id}
                                        className="cursor-pointer gap-2.5"
                                        onClick={() => driver.driver?.id && handleAssign(shipment._id, driver.driver.id)}
                                    >
                                        <Avatar className="size-6 border border-border/50">
                                            {driver.driver?.avatar && <AvatarImage src={driver.driver.avatar} />}
                                            <AvatarFallback className="text-[9px] font-bold bg-primary/5 text-primary">
                                                {driver.driver?.name?.[0]?.toUpperCase() || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold truncate">{driver.driver?.name || "Unknown"}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {driver.shipments?.length || 0} load{(driver.shipments?.length || 0) !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
