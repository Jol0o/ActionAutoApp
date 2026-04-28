import { useState } from "react";
import { X, Lock, Megaphone, DollarSign, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shipment } from "@/types/transportation";
import { trailerTypeOptions } from "@/components/driver-profile/driver-profile-constants";

interface EditShipmentModalProps {
  shipment: Shipment;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedShipment: Partial<Shipment>) => Promise<void>;
}

export function EditShipmentModal({
  shipment,
  isOpen,
  onClose,
  onSave,
}: EditShipmentModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    status: shipment.status,
    origin: shipment.origin,
    destination: shipment.destination,
    requestedPickupDate: shipment.requestedPickupDate || "",
    scheduledPickup: shipment.scheduledPickup || "",
    pickedUp: shipment.pickedUp || "",
    scheduledDelivery: shipment.scheduledDelivery || "",
    delivered: shipment.delivered || "",
    isPostedToBoard: shipment.isPostedToBoard || false,
    trailerTypeRequired: shipment.trailerTypeRequired || "",
    vehicleCount: shipment.vehicleCount || 1,
    preDispatchNotes: shipment.preDispatchNotes || "",
    carrierPayAmount: shipment.carrierPayAmount ?? "",
    copCodAmount: shipment.copCodAmount ?? "",
    specialInstructions: shipment.specialInstructions || "",
    loadSpecificTerms: shipment.loadSpecificTerms || "",
    desiredDeliveryDate: shipment.desiredDeliveryDate || "",
    internalLoadId: shipment.internalLoadId || "",
    originContact: {
      contactName: shipment.originContact?.contactName || "",
      email: shipment.originContact?.email || "",
      phone: shipment.originContact?.phone || "",
      cellPhone: shipment.originContact?.cellPhone || "",
      buyerReferenceNumber: shipment.originContact?.buyerReferenceNumber || "",
    },
    destinationContact: {
      contactName: shipment.destinationContact?.contactName || "",
      email: shipment.destinationContact?.email || "",
      phone: shipment.destinationContact?.phone || "",
      cellPhone: shipment.destinationContact?.cellPhone || "",
      buyerReferenceNumber:
        shipment.destinationContact?.buyerReferenceNumber || "",
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        carrierPayAmount:
          formData.carrierPayAmount !== ""
            ? Number(formData.carrierPayAmount)
            : undefined,
        copCodAmount:
          formData.copCodAmount !== ""
            ? Number(formData.copCodAmount)
            : undefined,
      };
      await onSave(payload);
      onClose();
    } catch (error) {
      console.error("Error saving shipment:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const statusOptions = [
    "Available for Pickup",
    "Dispatched",
    "In-Route",
    "Delivered",
    "Cancelled",
  ];

  const fieldClass =
    "w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const dateFieldClass = `${fieldClass} dark:scheme-dark`;
  const mutedLabelClass =
    "block text-xs font-medium text-muted-foreground mb-2";
  const sectionClass =
    "rounded-lg border border-border/60 bg-background/40 p-4 space-y-4";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-2xl max-w-[760px] w-full max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-border">
          <div>
            <h2 className="text-lg font-bold">Edit Shipment</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update shipment details, timeline, pricing, and contacts
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto max-h-[calc(90vh-145px)] custom-scrollbar"
        >
          <div className="p-6 space-y-5">
            {/* Shipment Status */}
            <div className={sectionClass}>
              <h3 className="text-base font-semibold">Shipment Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={mutedLabelClass}>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={fieldClass}
                    required
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    Tracking Number
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={shipment.trackingNumber || "Not assigned"}
                      disabled
                      className="w-full h-10 px-3 py-2 text-sm rounded-md border border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tracking numbers are automatically generated and cannot be
                    modified
                  </p>
                </div>
              </div>
            </div>

            {/* Route Information */}
            <div className={sectionClass}>
              <h3 className="text-base font-semibold">Route Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={mutedLabelClass}>Origin</label>
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    onChange={handleChange}
                    className={fieldClass}
                    required
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>Destination</label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    className={fieldClass}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className={sectionClass}>
              <h3 className="text-base font-semibold">Shipment Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={mutedLabelClass}>
                    Requested Pickup Date
                  </label>
                  <input
                    type="date"
                    name="requestedPickupDate"
                    value={formData.requestedPickupDate}
                    onChange={handleChange}
                    className={dateFieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>Scheduled Pickup</label>
                  <input
                    type="date"
                    name="scheduledPickup"
                    value={formData.scheduledPickup}
                    onChange={handleChange}
                    className={dateFieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>Picked Up</label>
                  <input
                    type="date"
                    name="pickedUp"
                    value={formData.pickedUp}
                    onChange={handleChange}
                    className={dateFieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>Scheduled Delivery</label>
                  <input
                    type="date"
                    name="scheduledDelivery"
                    value={formData.scheduledDelivery}
                    onChange={handleChange}
                    className={dateFieldClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={mutedLabelClass}>Delivered</label>
                  <input
                    type="date"
                    name="delivered"
                    value={formData.delivered}
                    onChange={handleChange}
                    className={dateFieldClass}
                  />
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                Dispatch & Board
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/40">
                  <div>
                    <p className="text-sm font-semibold">
                      Post to Driver Board
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Make this load visible to your drivers on the Available
                      Loads board
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        isPostedToBoard: !prev.isPostedToBoard,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      formData.isPostedToBoard
                        ? "bg-emerald-600"
                        : "bg-muted-foreground/40"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.isPostedToBoard
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={mutedLabelClass}>
                      Required Trailer Type
                    </label>
                    <select
                      name="trailerTypeRequired"
                      value={formData.trailerTypeRequired}
                      onChange={handleChange}
                      className={fieldClass}
                    >
                      <option value="">Any trailer</option>
                      {trailerTypeOptions.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={mutedLabelClass}>Vehicle Count</label>
                    <input
                      type="number"
                      name="vehicleCount"
                      value={formData.vehicleCount}
                      onChange={handleChange}
                      min={1}
                      max={12}
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={mutedLabelClass}>Pre-Dispatch Notes</label>
                  <textarea
                    name="preDispatchNotes"
                    value={formData.preDispatchNotes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        preDispatchNotes: e.target.value,
                      }))
                    }
                    rows={2}
                    maxLength={500}
                    placeholder="Special instructions for the driver..."
                    className={`${fieldClass} h-auto min-h-[80px] resize-none`}
                  />
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Pricing & Terms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={mutedLabelClass}>Carrier Pay ($)</label>
                  <input
                    type="number"
                    name="carrierPayAmount"
                    value={formData.carrierPayAmount}
                    onChange={handleChange}
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>COD/COP Amount ($)</label>
                  <input
                    type="number"
                    name="copCodAmount"
                    value={formData.copCodAmount}
                    onChange={handleChange}
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>Internal Load ID</label>
                  <input
                    type="text"
                    name="internalLoadId"
                    value={formData.internalLoadId}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder="CD-00001"
                    className={fieldClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={mutedLabelClass}>
                    Desired Delivery Date
                  </label>
                  <input
                    type="date"
                    name="desiredDeliveryDate"
                    value={formData.desiredDeliveryDate}
                    onChange={handleChange}
                    className={dateFieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>Load-Specific Terms</label>
                  <input
                    type="text"
                    name="loadSpecificTerms"
                    value={formData.loadSpecificTerms}
                    onChange={handleChange}
                    maxLength={500}
                    placeholder="e.g. Must tarp, No stack..."
                    className={fieldClass}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className={mutedLabelClass}>
                  Special Instructions (revealed after dispatch)
                </label>
                <textarea
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specialInstructions: e.target.value,
                    }))
                  }
                  rows={2}
                  maxLength={4000}
                  placeholder="Gate codes, dock instructions, hazmat requirements..."
                  className={`${fieldClass} h-auto min-h-[80px] resize-none`}
                />
              </div>
            </div>

            <div className={sectionClass}>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Origin Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={mutedLabelClass}>Contact Name</label>
                  <input
                    type="text"
                    value={formData.originContact.contactName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        originContact: {
                          ...prev.originContact,
                          contactName: e.target.value,
                        },
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>Phone</label>
                  <input
                    type="tel"
                    value={formData.originContact.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        originContact: {
                          ...prev.originContact,
                          phone: e.target.value,
                        },
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>Email</label>
                  <input
                    type="email"
                    value={formData.originContact.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        originContact: {
                          ...prev.originContact,
                          email: e.target.value,
                        },
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>Cell Phone</label>
                  <input
                    type="tel"
                    value={formData.originContact.cellPhone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        originContact: {
                          ...prev.originContact,
                          cellPhone: e.target.value,
                        },
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Destination Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={mutedLabelClass}>Contact Name</label>
                  <input
                    type="text"
                    value={formData.destinationContact.contactName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        destinationContact: {
                          ...prev.destinationContact,
                          contactName: e.target.value,
                        },
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>Phone</label>
                  <input
                    type="tel"
                    value={formData.destinationContact.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        destinationContact: {
                          ...prev.destinationContact,
                          phone: e.target.value,
                        },
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>Email</label>
                  <input
                    type="email"
                    value={formData.destinationContact.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        destinationContact: {
                          ...prev.destinationContact,
                          email: e.target.value,
                        },
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={mutedLabelClass}>Cell Phone</label>
                  <input
                    type="tel"
                    value={formData.destinationContact.cellPhone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        destinationContact: {
                          ...prev.destinationContact,
                          cellPhone: e.target.value,
                        },
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-border bg-card">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="min-w-[96px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="min-w-[120px] bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
