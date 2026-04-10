"use client";

import * as React from "react";
import {
  Package, Truck, Loader2, UserPlus, Megaphone,
  MapPin, ArrowRight, Calendar, DollarSign, Search,
  CheckCircle2, XCircle, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
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
  const [assignShipment, setAssignShipment] = React.useState<Shipment | null>(null);
  const [driverSearch, setDriverSearch] = React.useState("");

  const handleAssign = async (shipmentId: string, driverId: string) => {
    setAssigning(shipmentId);
    try {
      await onAssign(shipmentId, driverId);
      setAssignShipment(null);
    } finally {
      setAssigning(null);
    }
  };

  const filteredDrivers = React.useMemo(() => {
    const q = driverSearch.trim().toLowerCase();
    if (!q) return activeDrivers;
    return activeDrivers.filter((d) => {
      const name = d.driver?.name?.toLowerCase() || "";
      const email = d.driver?.email?.toLowerCase() || "";
      return name.includes(q) || email.includes(q);
    });
  }, [activeDrivers, driverSearch]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <Loader2 className="size-5 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground">Loading available loads...</p>
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="size-14 rounded-2xl bg-muted/40 flex items-center justify-center">
          <Package className="size-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">No available loads</p>
        <p className="text-[11px] text-muted-foreground/60">Create a shipment or post to the load board</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border/30">
        {shipments.map((shipment) => (
          <div key={shipment._id} className="p-4 hover:bg-accent/30 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Package className="size-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-foreground">
                      {shipment.trackingNumber || shipment._id.slice(-8)}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {shipment.isPostedToBoard && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 border-blue-300 text-blue-600 gap-0.5">
                          <Megaphone className="size-2.5" />Board
                        </Badge>
                      )}
                      {shipment.trailerTypeRequired && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 border-purple-300 text-purple-600 gap-0.5">
                          <Truck className="size-2.5" />{trailerLabel(shipment.trailerTypeRequired)}
                        </Badge>
                      )}
                      {shipment.vehicleCount && shipment.vehicleCount > 0 && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 border-indigo-300 text-indigo-600">
                          {shipment.vehicleCount} vehicle{shipment.vehicleCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {(shipment.origin || shipment.destination) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{shipment.origin}</span>
                      <ArrowRight className="size-3 shrink-0 text-muted-foreground/40" />
                      <span className="truncate">{shipment.destination}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                    {shipment.requestedPickupDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-2.5" />
                        Pickup: {new Date(shipment.requestedPickupDate).toLocaleDateString()}
                      </span>
                    )}
                    {shipment.carrierPayAmount != null && shipment.carrierPayAmount > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <DollarSign className="size-2.5" />
                        {shipment.carrierPayAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                className="h-8 px-3 text-xs font-bold gap-1.5 shrink-0 shadow-sm"
                disabled={assigning === shipment._id || activeDrivers.length === 0}
                onClick={() => { setAssignShipment(shipment); setDriverSearch(""); }}
              >
                {assigning === shipment._id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="size-3.5" />
                    Assign Driver
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={assignShipment !== null} onOpenChange={(open) => { if (!open) setAssignShipment(null); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="size-4 text-primary" />
              Assign Driver
            </DialogTitle>
            {assignShipment && (
              <div className="mt-2 rounded-lg border border-border/40 p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-blue-600 shrink-0" />
                  <p className="text-sm font-bold">{assignShipment.trackingNumber || assignShipment._id.slice(-8)}</p>
                  <div className="flex gap-1 flex-wrap">
                    {assignShipment.trailerTypeRequired && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 border-purple-300 text-purple-600 gap-0.5">
                        <Truck className="size-2.5" />{trailerLabel(assignShipment.trailerTypeRequired)}
                      </Badge>
                    )}
                    {assignShipment.vehicleCount && assignShipment.vehicleCount > 0 && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 border-indigo-300 text-indigo-600">
                        {assignShipment.vehicleCount} vehicle{assignShipment.vehicleCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
                {(assignShipment.origin || assignShipment.destination) && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{assignShipment.origin}</span>
                    <ArrowRight className="size-3 shrink-0" />
                    <span className="truncate">{assignShipment.destination}</span>
                  </div>
                )}
              </div>
            )}
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
            <Input
              value={driverSearch}
              onChange={(e) => setDriverSearch(e.target.value)}
              placeholder="Search drivers..."
              className="h-9 pl-9 text-xs rounded-lg border-border/40"
            />
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {filteredDrivers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <p className="text-xs text-muted-foreground">No drivers found</p>
              </div>
            )}
            {filteredDrivers.map((driver) => {
              const eq = driver.equipment;
              const trailerMatch = eq?.trailerType && assignShipment?.trailerTypeRequired
                ? eq.trailerType === assignShipment.trailerTypeRequired : null;
              const capacityMatch = eq?.maxVehicleCapacity && assignShipment?.vehicleCount
                ? eq.maxVehicleCapacity >= assignShipment.vehicleCount : null;

              return (
                <div
                  key={driver.id}
                  className="flex items-center justify-between rounded-xl border border-border/40 p-3 gap-3 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Avatar className="size-10 border-2 border-background shadow-sm shrink-0">
                      {driver.driver?.avatar && <AvatarImage src={driver.driver.avatar} />}
                      <AvatarFallback className="text-xs font-bold bg-primary/5 text-primary">
                        {driver.driver?.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-bold truncate">{driver.driver?.name || "Unknown"}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{driver.shipments?.length || 0} load{(driver.shipments?.length || 0) !== 1 ? "s" : ""}</span>
                        {eq?.truckMake && (
                          <>
                            <span className="text-muted-foreground/30">|</span>
                            <span>{eq.truckMake} {eq.truckModel || ""}</span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {eq?.trailerType && (
                          <Badge className="text-[9px] px-1.5 py-0 h-5 bg-purple-500/10 text-purple-600 border-purple-200 gap-0.5">
                            <Truck className="size-2.5" />{trailerLabel(eq.trailerType)}
                          </Badge>
                        )}
                        {eq?.maxVehicleCapacity != null && eq.maxVehicleCapacity > 0 && (
                          <Badge className="text-[9px] px-1.5 py-0 h-5 bg-indigo-500/10 text-indigo-600 border-indigo-200">
                            Cap: {eq.maxVehicleCapacity}
                          </Badge>
                        )}
                        {trailerMatch !== null && (
                          <Badge className={`text-[9px] px-1.5 py-0 h-5 gap-0.5 ${trailerMatch ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-red-500/10 text-red-600 border-red-200"}`}>
                            {trailerMatch ? <CheckCircle2 className="size-2.5" /> : <XCircle className="size-2.5" />}
                            Trailer
                          </Badge>
                        )}
                        {capacityMatch !== null && (
                          <Badge className={`text-[9px] px-1.5 py-0 h-5 gap-0.5 ${capacityMatch ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-red-500/10 text-red-600 border-red-200"}`}>
                            {capacityMatch ? <CheckCircle2 className="size-2.5" /> : <XCircle className="size-2.5" />}
                            Capacity
                          </Badge>
                        )}
                        {eq?.isComplianceExpired && (
                          <Badge className="text-[9px] px-1.5 py-0 h-5 gap-0.5 bg-red-500/10 text-red-600 border-red-200">
                            <AlertTriangle className="size-2.5" />Expired
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs font-bold shrink-0 shadow-sm"
                    disabled={assigning !== null}
                    onClick={() => driver.driver?.id && assignShipment && handleAssign(assignShipment._id, driver.driver.id)}
                  >
                    {assigning === assignShipment?._id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      "Assign"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
