"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Vehicle } from "@/types/inventory"

export type ModalType = "details" | "inquiry" | "finance" | "video" | "shipping"

export function useInventoryActions() {
    const router = useRouter()
    const pathname = usePathname()
    // Single source of truth for which vehicle is being interacted with
    const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null)
    
    // States for different types of modals
    const [openModals, setOpenModals] = React.useState<Record<ModalType, boolean>>({
        details: false,
        inquiry: false,
        finance: false,
        video: false,
        shipping: false
    })

    const toggleModal = (type: ModalType, isOpen: boolean, vehicle?: Vehicle) => {
        if (vehicle) setSelectedVehicle(vehicle)
        setOpenModals(prev => ({ ...prev, [type]: isOpen }))
    }

    const handleVehicleClick = (vehicle: Vehicle) => {
        toggleModal("details", true, vehicle)
    }

    const handleCheckAvailability = (vehicle: Vehicle) => {
        toggleModal("inquiry", true, vehicle)
    }

    const handleApplyNow = (vehicle: Vehicle) => {
        // Context-aware routing: Stay in the dashboard if we are already there
        const isDashboard = pathname.includes('/inventory')
        if (isDashboard) {
            router.push(`/inventory/finance-application/${vehicle.id}`)
        } else {
            router.push(`/customer/finance-application/${vehicle.id}`)
        }
    }

    const handleCallUs = () => {
        window.open("tel:8017661736", "_self")
    }

    const handleVideo = (vehicle: Vehicle) => {
        toggleModal("video", true, vehicle)
    }

    const handleGetQuote = (vehicle: Vehicle) => {
        toggleModal("shipping", true, vehicle)
    }

    return {
        // State
        selectedVehicle,
        openModals,
        
        // Modal togglers
        setDetailsOpen: (open: boolean) => toggleModal("details", open),
        setInquiryOpen: (open: boolean) => toggleModal("inquiry", open),
        setFinanceOpen: (open: boolean) => toggleModal("finance", open),
        setVideoOpen: (open: boolean) => toggleModal("video", open),
        setShippingOpen: (open: boolean) => toggleModal("shipping", open),
        
        // Action Handlers
        handleVehicleClick,
        handleCheckAvailability,
        handleApplyNow,
        handleCallUs,
        handleVideo,
        handleGetQuote
    }
}
