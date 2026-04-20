"use client"

import * as React from "react"
import { X, User, Mail, Phone, MessageSquare, Send, CheckCircle2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { Vehicle } from "@/types/inventory"

interface VehicleInquiryModalProps {
    vehicle: Vehicle | null
    isOpen: boolean
    onClose: () => void
}

export function VehicleInquiryModal({
    vehicle,
    isOpen,
    onClose
}: VehicleInquiryModalProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isSuccess, setIsSuccess] = React.useState(false)

    if (!vehicle) return null

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Mock API call to simulate lead submission
        await new Promise(resolve => setTimeout(resolve, 1500))

        setIsSubmitting(false)
        setIsSuccess(true)

        // Auto close after 2 seconds on success
        setTimeout(() => {
            onClose()
            setIsSuccess(false)
        }, 3000)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border-none shadow-2xl">
                <DialogHeader className="bg-zinc-900 text-white p-6">
                    <DialogTitle className="text-2xl font-bold text-center tracking-tight">
                        Check Availability
                    </DialogTitle>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </DialogHeader>

                <div className="flex flex-col md:flex-row h-full">
                    {/* Left side: Vehicle Summary */}
                    <div className="w-full md:w-5/12 bg-zinc-50 dark:bg-zinc-900/50 p-6 border-r border-zinc-200 dark:border-zinc-800">
                        <div className="space-y-4">
                            <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-md border border-white/20">
                                <img
                                    src={vehicle.image}
                                    alt={`${vehicle.year} ${vehicle.make}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white leading-tight">
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                </h3>
                                <p className="text-zinc-500 font-medium">{vehicle.trim}</p>
                            </div>
                            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                <p className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Price</p>
                                <p className="text-3xl font-black text-green-600 dark:text-green-400">
                                    ${vehicle.price.toLocaleString()}
                                </p>
                            </div>
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-zinc-400">Stock #</span>
                                    <span className="text-zinc-900 dark:text-zinc-200">{vehicle.stockNumber}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-zinc-400">VIN</span>
                                    <span className="text-zinc-900 dark:text-zinc-200 font-mono">{vehicle.vin}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side: Inquiry Form */}
                    <div className="w-full md:w-7/12 p-8">
                        {isSuccess ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12 animate-in fade-in zoom-in-95 duration-500">
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                                </div>
                                <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">Inquiry Sent!</h4>
                                <p className="text-zinc-500">
                                    A specialist will check availability and get back to you shortly.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-zinc-500">First Name</Label>
                                        <Input id="firstName" placeholder="First Name" required className="h-11 border-zinc-200 focus:ring-green-500 focus:border-green-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Last Name</Label>
                                        <Input id="lastName" placeholder="Last Name" required className="h-11 border-zinc-200" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                        <Input id="email" type="email" placeholder="email@example.com" required className="pl-10 h-11 border-zinc-200" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                        <Input id="phone" type="tel" placeholder="(555) 000-0000" required className="pl-10 h-11 border-zinc-200" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Message (Optional)</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="I'm interested in this vehicle..."
                                        className="min-h-[100px] border-zinc-200 resize-none"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-green-600 dark:hover:bg-green-700 font-bold text-lg shadow-lg active:scale-[0.98] transition-all"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Sending...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Send className="w-4 h-4" />
                                            Submit Inquiry
                                        </div>
                                    )}
                                </Button>
                                <p className="text-[10px] text-zinc-400 text-center uppercase tracking-widest font-medium pt-2">
                                    Secure & Private Inquiries
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
